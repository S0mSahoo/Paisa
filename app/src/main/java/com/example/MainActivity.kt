package com.example

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.Crossfade
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.screens.GoogleSignInScreen
import com.example.ui.screens.MainAppScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.AppAuthState
import com.example.ui.viewmodel.FinanceViewModel
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.common.api.ApiException

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      val viewModel: FinanceViewModel = viewModel()
      val authState by viewModel.appAuthState.collectAsState()

      val signInLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
      ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
          try {
            val account = GoogleSignIn.getSignedInAccountFromIntent(result.data)
              .getResult(ApiException::class.java)
            viewModel.onGoogleSignInSuccess(account)
          } catch (e: ApiException) {
            viewModel.onGoogleSignInFailure(
              "Google Sign-In failed (${e.statusCode}). Please try again."
            )
          }
        } else {
          viewModel.onGoogleSignInFailure("Google Sign-In was cancelled.")
        }
      }

      MyApplicationTheme {
        Crossfade(
          targetState = authState is AppAuthState.SignedIn || authState is AppAuthState.Offline,
          label = "auth_state"
        ) { hasAccess ->
          if (hasAccess) {
            MainAppScreen(viewModel = viewModel)
          } else {
            GoogleSignInScreen(
              authState = authState,
              onSignIn = {
                viewModel.startDriveConnecting()
                signInLauncher.launch(viewModel.getDriveSignInIntent())
              },
              onContinueOffline = {
                viewModel.continueOffline()
              }
            )
          }
        }
      }
    }
  }
}
