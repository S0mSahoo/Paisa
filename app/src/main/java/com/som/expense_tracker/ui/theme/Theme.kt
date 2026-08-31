package com.som.expense_tracker.ui.theme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
private val Scheme=lightColorScheme(primary=Color(0xFF171821),secondary=Color(0xFF167C5A),background=Color(0xFFF7F7FB),surface=Color.White)
@Composable fun DailyMoneyTheme(content:@Composable()->Unit){MaterialTheme(colorScheme=Scheme,content=content)}
