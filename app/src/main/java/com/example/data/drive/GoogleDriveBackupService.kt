package com.example.data.drive

import android.content.Context
import android.content.Intent
import com.example.data.model.BudgetModel
import com.example.data.model.RecurringRule
import com.example.data.model.TransactionItem
import com.example.data.model.UserProfile
import com.google.android.gms.auth.GoogleAuthUtil
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.Scope
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

sealed class GoogleDriveState {
  data object NotConnected : GoogleDriveState()
  data object Connecting : GoogleDriveState()
  data object LoadingCloudData : GoogleDriveState()
  data object Syncing : GoogleDriveState()
  data class Connected(
    val email: String,
    val lastSyncTimestampMillis: Long?
  ) : GoogleDriveState()
  data class SyncSuccess(
    val email: String,
    val timestampMillis: Long
  ) : GoogleDriveState()
  data class SyncFailed(
    val email: String?,
    val errorMessage: String
  ) : GoogleDriveState()
}

data class CloudDataPayload(
  val schemaVersion: Int = 1,
  val updatedAt: Long = System.currentTimeMillis(),
  val userProfile: UserProfile,
  val transactions: List<TransactionItem>,
  val budgets: List<BudgetModel>,
  val recurringRules: List<RecurringRule>
)

/** Compatibility reader for the v3 backup file produced before cloud-first migration. */
private data class LegacyBackupPayload(
  val version: String = "3.0.0",
  val exportTimestamp: Long = 0L,
  val userProfile: UserProfile,
  val transactions: List<TransactionItem>,
  val budgets: List<BudgetModel>,
  val recurringRules: List<RecurringRule>
)

sealed class CloudLoadResult {
  data class Found(val payload: CloudDataPayload) : CloudLoadResult()
  data object NotFound : CloudLoadResult()
}

class GoogleDriveBackupService(private val context: Context) {

  companion object {
    const val SCOPE_DRIVE_APPDATA = "https://www.googleapis.com/auth/drive.appdata"
    const val CLOUD_FILE_NAME = "paisa_financial_data.json"
    private const val PREFS_NAME = "paisa_drive_prefs"
    private const val KEY_LAST_SYNC = "key_last_sync_timestamp"
    private const val KEY_CONNECTED_EMAIL = "key_connected_email"
    private const val KEY_HAS_AUTHENTICATED = "key_has_authenticated"
  }

  private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private val okHttpClient = OkHttpClient.Builder()
    .connectTimeout(20, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .writeTimeout(30, TimeUnit.SECONDS)
    .build()

  private val moshi = Moshi.Builder()
    .addLast(KotlinJsonAdapterFactory())
    .build()

  private val payloadAdapter = moshi.adapter(CloudDataPayload::class.java)
  private val legacyPayloadAdapter = moshi.adapter(LegacyBackupPayload::class.java)

  @Suppress("DEPRECATION")
  val signInClient: GoogleSignInClient
    get() {
      val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestEmail()
        .requestProfile()
        .requestScopes(Scope(SCOPE_DRIVE_APPDATA))
        .build()
      return GoogleSignIn.getClient(context, gso)
    }

  fun getSignInIntent(): Intent = signInClient.signInIntent

  fun getLastSignedInAccount(): GoogleSignInAccount? =
    GoogleSignIn.getLastSignedInAccount(context)

  fun getLastSyncTimestamp(): Long? {
    val ts = prefs.getLong(KEY_LAST_SYNC, 0L)
    return ts.takeIf { it > 0L }
  }

  fun hasAuthenticatedBefore(): Boolean = prefs.getBoolean(KEY_HAS_AUTHENTICATED, false)

  fun markAuthenticated(account: GoogleSignInAccount) {
    prefs.edit()
      .putBoolean(KEY_HAS_AUTHENTICATED, true)
      .putString(KEY_CONNECTED_EMAIL, account.email.orEmpty())
      .apply()
  }

  fun clearAccountMetadata() {
    prefs.edit()
      .remove(KEY_CONNECTED_EMAIL)
      .remove(KEY_LAST_SYNC)
      .apply()
  }

  fun getSavedEmail(): String? = prefs.getString(KEY_CONNECTED_EMAIL, null)

  @Suppress("DEPRECATION")
  suspend fun signOut(): Boolean = withContext(Dispatchers.IO) {
    try {
      signInClient.signOut().awaitResult()
      clearAccountMetadata()
      true
    } catch (_: Exception) {
      false
    }
  }

  /**
   * Loads the application's cloud data from the Google Drive appDataFolder.
   * Only this app's data is queried; unrelated Drive files are never touched.
   */
  suspend fun loadCloudData(account: GoogleSignInAccount): CloudLoadResult = withContext(Dispatchers.IO) {
    val accessToken = getAccessToken(account)
    val existingFileId = findExistingDataFileId(accessToken) ?: return@withContext CloudLoadResult.NotFound

    val request = Request.Builder()
      .url("https://www.googleapis.com/drive/v3/files/$existingFileId?alt=media")
      .header("Authorization", "Bearer $accessToken")
      .get()
      .build()

    okHttpClient.newCall(request).execute().use { response ->
      if (response.code == 404) return@withContext CloudLoadResult.NotFound
      if (!response.isSuccessful) {
        throw IOException("Google Drive could not load your financial data (HTTP ${response.code}).")
      }

      val content = response.body?.string().orEmpty()
      if (content.isBlank()) return@withContext CloudLoadResult.NotFound

      val payload = runCatching { payloadAdapter.fromJson(content) }.getOrNull()
        ?: runCatching {
          legacyPayloadAdapter.fromJson(content)?.let { legacy ->
            CloudDataPayload(
              schemaVersion = 1,
              updatedAt = legacy.exportTimestamp,
              userProfile = legacy.userProfile,
              transactions = legacy.transactions,
              budgets = legacy.budgets,
              recurringRules = legacy.recurringRules
            )
          }
        }.getOrNull()
        ?: throw IOException("The Paisa cloud data could not be read.")

      CloudLoadResult.Found(payload)
    }
  }

  /**
   * Writes the complete authoritative application dataset to the user's appDataFolder.
   * A single application-specific file is created and updated in place.
   */
  suspend fun syncCloudData(
    account: GoogleSignInAccount,
    userProfile: UserProfile,
    transactions: List<TransactionItem>,
    budgets: List<BudgetModel>,
    recurringRules: List<RecurringRule>
  ): Long = withContext(Dispatchers.IO) {
    val accessToken = getAccessToken(account)
    val payload = CloudDataPayload(
      userProfile = userProfile.copy(hasCompletedOnboarding = true),
      transactions = transactions,
      budgets = budgets,
      recurringRules = recurringRules,
      updatedAt = System.currentTimeMillis()
    )
    val jsonContent = payloadAdapter.toJson(payload)

    val existingFileId = findExistingDataFileId(accessToken)
    val success = if (existingFileId != null) {
      updateFileContent(accessToken, existingFileId, jsonContent)
    } else {
      createNewFile(accessToken, jsonContent)
    }

    if (!success) {
      throw IOException("Google Drive did not save your financial data.")
    }

    val timestamp = System.currentTimeMillis()
    prefs.edit()
      .putLong(KEY_LAST_SYNC, timestamp)
      .putString(KEY_CONNECTED_EMAIL, account.email.orEmpty())
      .putBoolean(KEY_HAS_AUTHENTICATED, true)
      .apply()
    timestamp
  }

  private fun getAccessToken(account: GoogleSignInAccount): String {
    val androidAccount = account.account
      ?: throw IllegalStateException("Google account credential not found. Please sign in again.")

    return try {
      GoogleAuthUtil.getToken(context, androidAccount, "oauth2:$SCOPE_DRIVE_APPDATA")
    } catch (e: Exception) {
      throw IOException("Google authentication failed. Please sign in again.", e)
    } ?: throw IOException("Google authentication did not return an access token.")
  }

  private fun findExistingDataFileId(accessToken: String): String? {
    val query = "(name='$CLOUD_FILE_NAME' or name='paisa_financial_backup.json') and trashed=false"
    val url = "https://www.googleapis.com/drive/v3/files" +
      "?spaces=appDataFolder" +
      "&q=${java.net.URLEncoder.encode(query, "UTF-8")}" +
      "&fields=files(id,name,modifiedTime)&pageSize=10"

    val request = Request.Builder()
      .url(url)
      .header("Authorization", "Bearer $accessToken")
      .get()
      .build()

    okHttpClient.newCall(request).execute().use { response ->
      if (!response.isSuccessful) {
        throw IOException("Google Drive could not check your Paisa cloud data (HTTP ${response.code}).")
      }
      val body = response.body?.string().orEmpty()
      val files = JSONObject(body).optJSONArray("files") ?: return null
      if (files.length() == 0) return null
      return files.getJSONObject(0).optString("id").takeIf { it.isNotBlank() }
    }
  }

  private fun createNewFile(accessToken: String, jsonContent: String): Boolean {
    val metadata = JSONObject().apply {
      put("name", CLOUD_FILE_NAME)
      put("parents", JSONArray().put("appDataFolder"))
      put("mimeType", "application/json")
    }.toString()

    val metadataBody = metadata.toRequestBody("application/json; charset=UTF-8".toMediaType())
    val mediaBody = jsonContent.toRequestBody("application/json; charset=UTF-8".toMediaType())

    val requestBody = MultipartBody.Builder()
      .setType("multipart/related".toMediaType())
      .addPart(metadataBody)
      .addPart(mediaBody)
      .build()

    val request = Request.Builder()
      .url("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
      .header("Authorization", "Bearer $accessToken")
      .post(requestBody)
      .build()

    return okHttpClient.newCall(request).execute().use { response -> response.isSuccessful }
  }

  private fun updateFileContent(accessToken: String, fileId: String, jsonContent: String): Boolean {
    val mediaBody = jsonContent.toRequestBody("application/json; charset=UTF-8".toMediaType())

    val request = Request.Builder()
      .url("https://www.googleapis.com/upload/drive/v3/files/$fileId?uploadType=media")
      .header("Authorization", "Bearer $accessToken")
      .patch(mediaBody)
      .build()

    return okHttpClient.newCall(request).execute().use { response -> response.isSuccessful }
  }
}
