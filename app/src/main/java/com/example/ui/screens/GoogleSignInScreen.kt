package com.example.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.ui.components.AppBrandLogo
import com.example.ui.viewmodel.AppAuthState

@Composable
fun GoogleSignInScreen(
  authState: AppAuthState,
  onSignIn: () -> Unit,
  onContinueOffline: () -> Unit = {}
) {
  val loading = authState is AppAuthState.Connecting || authState is AppAuthState.LoadingCloud
  val error = (authState as? AppAuthState.Error)?.message

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(28.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.Center
  ) {
    AppBrandLogo(size = 78.dp)
    Spacer(Modifier.height(28.dp))
    Text(
      text = "Welcome to Paisa",
      style = MaterialTheme.typography.headlineMedium,
      fontWeight = FontWeight.Bold,
      textAlign = TextAlign.Center
    )
    Spacer(Modifier.height(8.dp))
    Text(
      text = "Track your expenses, manage monthly budgets, and analyze spending habits.",
      style = MaterialTheme.typography.bodyLarge,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
      textAlign = TextAlign.Center
    )
    Spacer(Modifier.height(28.dp))

    if (loading) {
      CircularProgressIndicator()
      Spacer(Modifier.height(14.dp))
      Text(
        text = "Loading your secure cloud data…",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
    } else {
      Button(
        onClick = onSignIn,
        enabled = !loading,
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large
      ) {
        Text("Continue with Google", fontWeight = FontWeight.SemiBold)
      }

      Spacer(Modifier.height(12.dp))

      OutlinedButton(
        onClick = onContinueOffline,
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large
      ) {
        Text("Use Offline (Local Storage)", fontWeight = FontWeight.Medium)
      }
    }

    if (!error.isNullOrBlank()) {
      Spacer(Modifier.height(16.dp))
      Text(
        text = error,
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.error,
        textAlign = TextAlign.Center
      )
    }
  }
}
