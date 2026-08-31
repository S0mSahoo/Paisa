package com.som.expense_tracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.som.expense_tracker.ui.theme.DailyMoneyTheme
import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private val bg = Color(0xFFF7F7FB)
private val ink = Color(0xFF171821)
private val muted = Color(0xFF747784)
private val green = Color(0xFF167C5A)
private val red = Color(0xFFCF4B4B)

 data class Transaction(val title:String,val category:String,val amount:Double,val income:Boolean,val date:String)

class MainActivity : ComponentActivity() {
 override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { DailyMoneyTheme { DailyMoneyApp() } } }
}

@Composable fun DailyMoneyApp(){
 var tab by remember { mutableIntStateOf(0) }
 var showAdd by remember { mutableStateOf(false) }
 var incomeMode by remember { mutableStateOf(false) }
 var txns by remember { mutableStateOf(listOf(
   Transaction("Salary","Salary",78000.0,true,"31 Aug"),
   Transaction("Lunch","Food",308.0,false,"31 Aug"),
   Transaction("Cab","Transport",772.0,false,"31 Aug"),
   Transaction("Movie","Entertainment",260.0,false,"30 Aug"),
   Transaction("Groceries","Food",1250.0,false,"29 Aug")
 )) }
 Scaffold(containerColor=bg, bottomBar={ NavigationBar(containerColor=Color.White) {
   listOf("Home","Activity","Analytics").forEachIndexed { i, label -> NavigationBarItem(selected=tab==i,onClick={tab=i},icon={Icon(if(i==0) Icons.Default.Home else if(i==1) Icons.Default.ReceiptLong else Icons.Default.Insights,label,null)},label={Text(label)}) }
 }}) { p -> Box(Modifier.fillMaxSize().padding(p)) {
   when(tab){0->Home(txns);1->Activity(txns);2->Analytics(txns)}
   FloatingActionButton(onClick={showAdd=true},modifier=Modifier.align(Alignment.BottomEnd).padding(20.dp),containerColor=ink,contentColor=Color.White){Icon(Icons.Default.Add,"Add")}
 } }
 if(showAdd) AddSheet(incomeMode){ incomeMode=it.first; if(it.second!=null){txns=listOf(it.second!!)+txns}; showAdd=false }
}

@Composable fun Header(title:String, subtitle:String?=null){ Column(Modifier.padding(horizontal=22.dp,vertical=20.dp)){ Text(title,fontSize=28.sp,fontWeight=FontWeight.Bold,color=ink); subtitle?.let{Text(it,color=muted,fontSize=14.sp,modifier=Modifier.padding(top=3.dp))} } }
fun money(v:Double)=NumberFormat.getCurrencyInstance(Locale("en","IN")).format(v).replace("₹","₹ ")

@Composable fun Home(t:List<Transaction>){ val income=t.filter{it.income}.sumOf{it.amount}; val expense=t.filter{!it.income}.sumOf{it.amount};
 Column(Modifier.fillMaxSize()){ Header("Good evening, Som","31 August 2026 • Your money at a glance")
  Card(Modifier.padding(horizontal=18.dp).fillMaxWidth(),colors=CardDefaults.cardColors(containerColor=ink),shape=RoundedCornerShape(26.dp)){Column(Modifier.padding(22.dp)){Text("August balance",color=Color.White.copy(.65f),fontSize=13.sp);Text(money(income-expense),color=Color.White,fontSize=34.sp,fontWeight=FontWeight.Bold);Spacer(Modifier.height(18.dp));Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Metric("Income",money(income),green);Metric("Spent",money(expense),Color(0xFFFF8A8A))}}}}
  Spacer(Modifier.height(20.dp)); Row(Modifier.padding(horizontal=18.dp),horizontalArrangement=Arrangement.spacedBy(12.dp)){QuickCard("Add expense",Icons.Default.RemoveCircleOutline,red);QuickCard("Add income",Icons.Default.AddCircleOutline,green)}
  SectionTitle("Recent activity","See all")
  LazyColumn(contentPadding=PaddingValues(horizontal=18.dp,bottom=100.dp)){items(t.take(5)){TransactionRow(it)}}
 }
}
@Composable fun Metric(label:String,value:String,color:Color){Column{Text(label,color=Color.White.copy(.6f),fontSize=12.sp);Text(value,color=color,fontSize=17.sp,fontWeight=FontWeight.SemiBold)}}
@Composable fun QuickCard(text:String,icon:androidx.compose.ui.graphics.vector.ImageVector,color:Color){Card(Modifier.weight(1f).height(74.dp),shape=RoundedCornerShape(20.dp),colors=CardDefaults.cardColors(containerColor=Color.White)){Row(Modifier.fillMaxSize().padding(14.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(40.dp).clip(CircleShape).background(color.copy(.1f)),contentAlignment=Alignment.Center){Icon(icon,null,tint=color)};Text(text,Modifier.padding(start=9.dp),fontWeight=FontWeight.SemiBold,fontSize=13.sp)}}}
@Composable fun SectionTitle(a:String,b:String){Row(Modifier.fillMaxWidth().padding(horizontal=22.dp,vertical=18.dp),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Text(a,fontSize=18.sp,fontWeight=FontWeight.Bold,color=ink);Text(b,color=green,fontWeight=FontWeight.SemiBold,fontSize=13.sp)}}
@Composable fun TransactionRow(t:Transaction){Row(Modifier.fillMaxWidth().padding(vertical=8.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(44.dp).clip(RoundedCornerShape(14.dp)).background(if(t.income)green.copy(.1f) else red.copy(.1f)),contentAlignment=Alignment.Center){Icon(if(t.income)Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,null,tint=if(t.income)green else red)};Column(Modifier.weight(1f).padding(horizontal=12.dp)){Text(t.title,fontWeight=FontWeight.SemiBold,color=ink);Text("${t.category} • ${t.date}",color=muted,fontSize=12.sp)};Text((if(t.income) "+ " else "− ")+money(t.amount),fontWeight=FontWeight.Bold,color=if(t.income)green else ink)}}

@Composable fun Activity(t:List<Transaction>){Column{Header("Activity","Everything you've recorded") ; LazyColumn(contentPadding=PaddingValues(horizontal=18.dp,bottom=90.dp)){items(t){TransactionRow(it)}}}}
@Composable fun Analytics(t:List<Transaction>){val e=t.filter{!it.income}.sumOf{it.amount};val by=t.filter{!it.income}.groupBy{it.category}.mapValues{it.value.sumOf{x->x.amount}}.toList().sortedByDescending{it.second};Column{Header("Analytics","August 2026")
 Card(Modifier.padding(horizontal=18.dp).fillMaxWidth(),shape=RoundedCornerShape(24.dp),colors=CardDefaults.cardColors(Color.White)){Column(Modifier.padding(20.dp)){Text("Where your money goes",fontWeight=FontWeight.Bold,fontSize=18.sp);Spacer(Modifier.height(16.dp));by.forEach{(cat,v)->Row(Modifier.fillMaxWidth().padding(vertical=8.dp),horizontalArrangement=Arrangement.SpaceBetween){Text(cat,color=ink);Text("${money(v)}  ${if(e==0.0)0 else (v/e*100).toInt()}%",fontWeight=FontWeight.SemiBold)}}}}}}

@Composable fun AddSheet(initial:Boolean,onDone:(Pair<Boolean,Transaction?>)->Unit){var inc by remember{mutableStateOf(initial)};var amount by remember{mutableStateOf("")};var title by remember{mutableStateOf("")};var cat by remember{mutableStateOf(if(inc)"Salary" else "Food")};ModalBottomSheet(onDismissRequest={onDone(inc to null)}){Column(Modifier.padding(22.dp).navigationBarsPadding()){Text(if(inc)"Add income" else "Add expense",fontSize=26.sp,fontWeight=FontWeight.Bold);Row(Modifier.padding(vertical=16.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)){FilterChip(selected=!inc,onClick={inc=false},label={Text("Expense")});FilterChip(selected=inc,onClick={inc=true},label={Text("Income")})};OutlinedTextField(value=amount,onValueChange={amount=it.filter{c->c.isDigit()||c=='.'}},label={Text("Amount")},singleLine=true,modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(10.dp));OutlinedTextField(value=title,onValueChange={title=it},label={Text("What was it?")},singleLine=true,modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(10.dp));OutlinedTextField(value=cat,onValueChange={cat=it},label={Text("Category")},singleLine=true,modifier=Modifier.fillMaxWidth());Spacer(Modifier.height(18.dp));Button(onClick={val a=amount.toDoubleOrNull();if(a!=null&&a>0)onDone(inc to Transaction(title.ifBlank{cat},cat,a,inc,"31 Aug"))},modifier=Modifier.fillMaxWidth().height(54.dp),shape=RoundedCornerShape(16.dp)){Text("Save transaction",fontSize=16.sp,fontWeight=FontWeight.Bold)}}}}
