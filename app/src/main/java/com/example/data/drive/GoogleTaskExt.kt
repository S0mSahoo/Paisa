package com.example.data.drive

import com.google.android.gms.tasks.Task
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

suspend fun <T> Task<T>.awaitResult(): T = suspendCancellableCoroutine { continuation ->
  addOnCompleteListener { task ->
    if (task.isSuccessful) {
      continuation.resume(task.result)
    } else {
      continuation.resumeWithException(task.exception ?: IllegalStateException("Google Play Services task failed"))
    }
  }
}
