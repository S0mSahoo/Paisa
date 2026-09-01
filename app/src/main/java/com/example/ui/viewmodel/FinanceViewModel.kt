package com.example.ui.viewmodel

import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.drive.GoogleDriveBackupService
import com.example.data.drive.GoogleDriveState
import com.example.data.model.BudgetModel
import com.example.data.model.CalendarDayData
import com.example.data.model.CategorySpending
import com.example.data.model.DailySpendingPoint
import com.example.data.model.ExportPeriod
import com.example.data.model.MonthlyFinancialSummary
import com.example.data.model.PaymentMethod
import com.example.data.model.RecurrenceInterval
import com.example.data.model.RecurringRule
import com.example.data.model.TransactionCategory
import com.example.data.model.TransactionItem
import com.example.data.model.TransactionType
import com.example.data.model.UserProfile
import com.example.data.model.YearlyFinancialSummary
import com.example.data.repository.FinanceRepository
import com.example.ui.components.DateUtils
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.Calendar

sealed class AppAuthState {
  data object SignedOut : AppAuthState()
  data object Connecting : AppAuthState()
  data object LoadingCloud : AppAuthState()
  data class SignedIn(val email: String) : AppAuthState()
  data class Error(val message: String) : AppAuthState()
}

class FinanceViewModel(application: Application) : AndroidViewModel(application) {
  private val repository = FinanceRepository(application.applicationContext)
  val driveService = GoogleDriveBackupService(application.applicationContext)

  // Cloud-first Google account state. Room is retained only as a local cache.
  private val _googleDriveState = MutableStateFlow<GoogleDriveState>(GoogleDriveState.NotConnected)
  val googleDriveState: StateFlow<GoogleDriveState> = _googleDriveState.asStateFlow()

  private val _appAuthState = MutableStateFlow<AppAuthState>(
    if (driveService.getLastSignedInAccount() != null) AppAuthState.LoadingCloud else AppAuthState.SignedOut
  )
  val appAuthState: StateFlow<AppAuthState> = _appAuthState.asStateFlow()

  private val cloudSyncMutex = Mutex()
  private var cloudAccount: GoogleSignInAccount? = null

  // Selected Month & Year for Dashboard & Analysis
  private val _selectedCalendar = MutableStateFlow(Calendar.getInstance().apply {
    set(Calendar.HOUR_OF_DAY, 12)
    set(Calendar.MINUTE, 0)
    set(Calendar.SECOND, 0)
    set(Calendar.MILLISECOND, 0)
  })
  val selectedCalendar: StateFlow<Calendar> = _selectedCalendar.asStateFlow()

  // Selected Day in Calendar Screen
  private val _selectedDayTimestamp = MutableStateFlow(System.currentTimeMillis())
  val selectedDayTimestamp: StateFlow<Long> = _selectedDayTimestamp.asStateFlow()

  // Search & Filter in Transactions Screen
  private val _searchQuery = MutableStateFlow("")
  val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

  private val _filterType = MutableStateFlow<TransactionType?>(null)
  val filterType: StateFlow<TransactionType?> = _filterType.asStateFlow()

  private val _filterCategory = MutableStateFlow<TransactionCategory?>(null)
  val filterCategory: StateFlow<TransactionCategory?> = _filterCategory.asStateFlow()

  // User Profile
  private val _userProfile = MutableStateFlow(repository.getUserProfile())
  val userProfile: StateFlow<UserProfile> = _userProfile.asStateFlow()

  // All Transactions from DB
  val allTransactions: StateFlow<List<TransactionItem>> = repository.allTransactions.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
  )

  // All Budgets from DB
  val allBudgets: StateFlow<List<BudgetModel>> = repository.allBudgets.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
  )

  // All Recurring Rules from DB
  val allRecurringRules: StateFlow<List<RecurringRule>> = repository.allRecurringRules.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
  )

  // Current Month Summary: Income, Expenses, Savings, Budget
  val currentMonthSummary: StateFlow<MonthlyFinancialSummary> = combine(
    allTransactions,
    allBudgets,
    _selectedCalendar
  ) { transactions, budgets, cal ->
    val monthKey = DateUtils.getMonthKey(cal)
    val monthLabel = DateUtils.getMonthLabel(cal)
    val startOfMonth = DateUtils.getStartOfMonth(cal)
    val endOfMonth = DateUtils.getEndOfMonth(cal)

    val monthTransactions = transactions.filter { it.timestamp in startOfMonth..endOfMonth }
    val totalIncome = monthTransactions.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
    val totalExpense = monthTransactions.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
    val savings = totalIncome - totalExpense
    val savingsRate = if (totalIncome > 0) (savings / totalIncome) * 100.0 else 0.0

    val budgetObj = budgets.find { it.monthKey == monthKey }
    val budgetLimit = budgetObj?.totalBudget ?: 0.0
    val budgetRemaining = if (budgetLimit > 0) budgetLimit - totalExpense else 0.0
    val budgetUsagePercent = if (budgetLimit > 0) (totalExpense / budgetLimit) * 100.0 else 0.0

    MonthlyFinancialSummary(
      monthKey = monthKey,
      monthLabel = monthLabel,
      totalIncome = totalIncome,
      totalExpense = totalExpense,
      savings = savings,
      savingsRate = savingsRate,
      budgetLimit = budgetLimit,
      budgetUsed = totalExpense,
      budgetRemaining = budgetRemaining,
      budgetUsagePercent = budgetUsagePercent,
      transactionCount = monthTransactions.size
    )
  }.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = MonthlyFinancialSummary(
      monthKey = DateUtils.getMonthKey(Calendar.getInstance()),
      monthLabel = DateUtils.getMonthLabel(Calendar.getInstance())
    )
  )

  // Current Year Summary
  val currentYearSummary: StateFlow<YearlyFinancialSummary> = combine(
    allTransactions,
    _selectedCalendar
  ) { transactions, cal ->
    val year = cal.get(Calendar.YEAR)
    val startOfYear = DateUtils.getStartOfYear(year)
    val endOfYear = DateUtils.getEndOfYear(year)

    val yearTransactions = transactions.filter { it.timestamp in startOfYear..endOfYear }
    val totalIncome = yearTransactions.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
    val totalExpense = yearTransactions.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
    val savings = totalIncome - totalExpense
    val savingsRate = if (totalIncome > 0) (savings / totalIncome) * 100.0 else 0.0

    // Monthly breakdown
    val monthlyList = (0..11).map { monthIdx ->
      val monthCal = Calendar.getInstance().apply {
        set(year, monthIdx, 1, 0, 0, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val mStart = DateUtils.getStartOfMonth(monthCal)
      val mEnd = DateUtils.getEndOfMonth(monthCal)
      val mTx = yearTransactions.filter { it.timestamp in mStart..mEnd }
      val mIncome = mTx.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
      val mExpense = mTx.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
      MonthlyFinancialSummary(
        monthKey = DateUtils.getMonthKey(monthCal),
        monthLabel = DateUtils.getMonthLabel(monthCal),
        totalIncome = mIncome,
        totalExpense = mExpense,
        savings = mIncome - mExpense,
        transactionCount = mTx.size
      )
    }

    YearlyFinancialSummary(
      year = year,
      totalIncome = totalIncome,
      totalExpense = totalExpense,
      savings = savings,
      savingsRate = savingsRate,
      monthlyBreakdown = monthlyList
    )
  }.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = YearlyFinancialSummary(year = Calendar.getInstance().get(Calendar.YEAR))
  )

  // Category-wise Spending in Selected Month
  val categorySpendingList: StateFlow<List<CategorySpending>> = combine(
    allTransactions,
    _selectedCalendar
  ) { transactions, cal ->
    val startOfMonth = DateUtils.getStartOfMonth(cal)
    val endOfMonth = DateUtils.getEndOfMonth(cal)
    val monthExpenses = transactions.filter { it.timestamp in startOfMonth..endOfMonth && it.type == TransactionType.EXPENSE }
    val totalMonthExpense = monthExpenses.sumOf { it.amount }

    if (totalMonthExpense == 0.0) {
      emptyList()
    } else {
      monthExpenses.groupBy { it.category }.map { (category, list) ->
        val amount = list.sumOf { it.amount }
        val pct = (amount / totalMonthExpense).toFloat()
        CategorySpending(
          category = category,
          amount = amount,
          percentage = pct,
          count = list.size,
          color = category.color
        )
      }.sortedByDescending { it.amount }
    }
  }.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
  )

  // Daily Spending Trend in Selected Month
  val dailySpendingTrend: StateFlow<List<DailySpendingPoint>> = combine(
    allTransactions,
    _selectedCalendar
  ) { transactions, cal ->
    val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
    val year = cal.get(Calendar.YEAR)
    val month = cal.get(Calendar.MONTH)

    val points = mutableListOf<DailySpendingPoint>()
    for (day in 1..daysInMonth) {
      val dayCal = Calendar.getInstance().apply {
        set(year, month, day, 0, 0, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val startDay = dayCal.timeInMillis
      val endDay = DateUtils.getEndOfDay(startDay)
      val dayTx = transactions.filter { it.timestamp in startDay..endDay }
      val exp = dayTx.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
      val inc = dayTx.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }

      points.add(
        DailySpendingPoint(
          dayOfMonth = day,
          dateKey = DateUtils.getDayKey(dayCal),
          dayLabel = day.toString(),
          expense = exp,
          income = inc,
          net = inc - exp
        )
      )
    }
    points
  }.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
  )

  // Calendar Grid Data for Calendar Screen
  val calendarDaysData: StateFlow<List<CalendarDayData>> = combine(
    allTransactions,
    _selectedCalendar
  ) { transactions, cal ->
    val year = cal.get(Calendar.YEAR)
    val month = cal.get(Calendar.MONTH)
    val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)

    val firstDayCal = Calendar.getInstance().apply {
      set(year, month, 1, 0, 0, 0)
      set(Calendar.MILLISECOND, 0)
    }
    // Sunday = 1, Monday = 2, etc. Offset for grid alignment
    val firstDayOfWeek = firstDayCal.get(Calendar.DAY_OF_WEEK) // 1=Sun, 7=Sat
    val leadDays = firstDayOfWeek - 1

    val todayKey = DateUtils.getDayKey(Calendar.getInstance())
    val gridDays = mutableListOf<CalendarDayData>()

    // Leading days from previous month
    val prevMonthCal = (firstDayCal.clone() as Calendar).apply { add(Calendar.MONTH, -1) }
    val prevDaysCount = prevMonthCal.getActualMaximum(Calendar.DAY_OF_MONTH)
    for (i in (prevDaysCount - leadDays + 1)..prevDaysCount) {
      val c = (prevMonthCal.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, i) }
      val start = DateUtils.getStartOfDay(c.timeInMillis)
      val end = DateUtils.getEndOfDay(start)
      val dayTx = transactions.filter { it.timestamp in start..end }
      val inc = dayTx.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
      val exp = dayTx.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }

      gridDays.add(
        CalendarDayData(
          dayOfMonth = i,
          dateKey = DateUtils.getDayKey(c),
          epochMillis = start,
          isCurrentMonth = false,
          isToday = DateUtils.getDayKey(c) == todayKey,
          hasIncome = inc > 0,
          hasExpense = exp > 0,
          totalIncome = inc,
          totalExpense = exp,
          transactions = dayTx
        )
      )
    }

    // Current month days
    for (day in 1..daysInMonth) {
      val c = Calendar.getInstance().apply {
        set(year, month, day, 12, 0, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val start = DateUtils.getStartOfDay(c.timeInMillis)
      val end = DateUtils.getEndOfDay(start)
      val dayTx = transactions.filter { it.timestamp in start..end }
      val inc = dayTx.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
      val exp = dayTx.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }

      gridDays.add(
        CalendarDayData(
          dayOfMonth = day,
          dateKey = DateUtils.getDayKey(c),
          epochMillis = start,
          isCurrentMonth = true,
          isToday = DateUtils.getDayKey(c) == todayKey,
          hasIncome = inc > 0,
          hasExpense = exp > 0,
          totalIncome = inc,
          totalExpense = exp,
          transactions = dayTx
        )
      )
    }

    // Trailing days to fill 35 or 42 grid cells
    val remaining = (7 - (gridDays.size % 7)) % 7
    val nextMonthCal = (firstDayCal.clone() as Calendar).apply { add(Calendar.MONTH, 1) }
    for (day in 1..remaining) {
      val c = (nextMonthCal.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, day) }
      val start = DateUtils.getStartOfDay(c.timeInMillis)
      val end = DateUtils.getEndOfDay(start)
      val dayTx = transactions.filter { it.timestamp in start..end }
      val inc = dayTx.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
      val exp = dayTx.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }

      gridDays.add(
        CalendarDayData(
          dayOfMonth = day,
          dateKey = DateUtils.getDayKey(c),
          epochMillis = start,
          isCurrentMonth = false,
          isToday = DateUtils.getDayKey(c) == todayKey,
          hasIncome = inc > 0,
          hasExpense = exp > 0,
          totalIncome = inc,
          totalExpense = exp,
          transactions = dayTx
        )
      )
    }

    gridDays
  }.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
  )

  // Transactions on the specifically selected calendar date
  val selectedDateTransactions: StateFlow<List<TransactionItem>> = combine(
    allTransactions,
    _selectedDayTimestamp
  ) { transactions, dayMillis ->
    val start = DateUtils.getStartOfDay(dayMillis)
    val end = DateUtils.getEndOfDay(dayMillis)
    transactions.filter { it.timestamp in start..end }
  }.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
  )

  // Filtered Transactions for Transactions Screen
  val filteredTransactions: StateFlow<List<TransactionItem>> = combine(
    allTransactions,
    _searchQuery,
    _filterType,
    _filterCategory
  ) { transactions, query, type, cat ->
    transactions.filter { item ->
      val matchesQuery = query.isBlank() ||
          item.title.contains(query, ignoreCase = true) ||
          item.category.displayName.contains(query, ignoreCase = true) ||
          item.note.contains(query, ignoreCase = true) ||
          item.amount.toString().contains(query)
      val matchesType = type == null || item.type == type
      val matchesCat = cat == null || item.category == cat
      matchesQuery && matchesType && matchesCat
    }
  }.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = emptyList()
  )

  init {
    val account = driveService.getLastSignedInAccount()
    if (account != null) {
      initializeSignedInAccount(account)
    }
  }

  // ================= Navigation & Period =================

  fun previousMonth() {
    val cal = (_selectedCalendar.value.clone() as Calendar).apply {
      add(Calendar.MONTH, -1)
    }
    _selectedCalendar.value = cal
  }

  fun nextMonth() {
    val cal = (_selectedCalendar.value.clone() as Calendar).apply {
      add(Calendar.MONTH, 1)
    }
    _selectedCalendar.value = cal
  }

  fun previousYear() {
    val cal = (_selectedCalendar.value.clone() as Calendar).apply {
      add(Calendar.YEAR, -1)
    }
    _selectedCalendar.value = cal
  }

  fun nextYear() {
    val cal = (_selectedCalendar.value.clone() as Calendar).apply {
      add(Calendar.YEAR, 1)
    }
    _selectedCalendar.value = cal
  }

  fun setYear(year: Int) {
    val cal = (_selectedCalendar.value.clone() as Calendar).apply {
      set(Calendar.YEAR, year)
    }
    _selectedCalendar.value = cal
  }

  fun setMonthAndYear(year: Int, month: Int) {
    val cal = (_selectedCalendar.value.clone() as Calendar).apply {
      set(Calendar.YEAR, year)
      set(Calendar.MONTH, month)
    }
    _selectedCalendar.value = cal
  }

  fun selectCalendarDate(timestamp: Long) {
    _selectedDayTimestamp.value = timestamp
    val cal = Calendar.getInstance().apply { timeInMillis = timestamp }
    _selectedCalendar.value = cal
  }

  // ================= Filters =================

  fun setSearchQuery(query: String) {
    _searchQuery.value = query
  }

  fun setFilterType(type: TransactionType?) {
    _filterType.value = type
  }

  fun setFilterCategory(category: TransactionCategory?) {
    _filterCategory.value = category
  }

  // ================= Google Account / Profile =================

  fun onGoogleSignInSuccess(account: GoogleSignInAccount) {
    initializeSignedInAccount(account)
  }

  fun onGoogleSignInFailure(errorMessage: String) {
    cloudAccount = null
    _appAuthState.value = AppAuthState.Error(errorMessage)
    _googleDriveState.value = GoogleDriveState.NotConnected
  }

  private fun initializeSignedInAccount(account: GoogleSignInAccount) {
    viewModelScope.launch {
      val email = account.email.orEmpty()
      if (email.isBlank()) {
        _appAuthState.value = AppAuthState.Error("Google did not provide an account email. Please try again.")
        return@launch
      }

      _googleDriveState.value = GoogleDriveState.Connecting
      _appAuthState.value = AppAuthState.LoadingCloud
      cloudAccount = account

      try {
        val firstAuthentication = !driveService.hasAuthenticatedBefore()
        val localSnapshot = if (firstAuthentication) repository.getUserDataSnapshotSuspend() else null

        _googleDriveState.value = GoogleDriveState.LoadingCloudData
        val result = driveService.loadCloudData(account)

        when (result) {
          is com.example.data.drive.CloudLoadResult.Found -> {
            val cloudProfile = result.payload.userProfile.copy(
              name = account.displayName ?: result.payload.userProfile.name,
              email = account.email.orEmpty(),
              photoUrl = account.photoUrl?.toString(),
              hasCompletedOnboarding = true
            )
            repository.replaceFinancialData(
              profile = cloudProfile,
              transactions = result.payload.transactions,
              budgets = result.payload.budgets,
              recurringRules = result.payload.recurringRules
            )
            _userProfile.value = cloudProfile
          }
          com.example.data.drive.CloudLoadResult.NotFound -> {
            val snapshot = localSnapshot
            val profile = UserProfile(
              name = account.displayName.orEmpty(),
              email = email,
              photoUrl = account.photoUrl?.toString(),
              hasCompletedOnboarding = true
            )
            if (snapshot != null && (snapshot.transactions.isNotEmpty() || snapshot.budgets.isNotEmpty() || snapshot.recurringRules.isNotEmpty())) {
              // One-time migration of pre-cloud local data for the first signed-in account.
              repository.replaceFinancialData(
                profile = profile,
                transactions = snapshot.transactions,
                budgets = snapshot.budgets,
                recurringRules = snapshot.recurringRules
              )
            } else {
              repository.replaceFinancialData(profile, emptyList(), emptyList(), emptyList())
            }
            _userProfile.value = profile
            driveService.syncCloudData(account, profile, snapshot?.transactions.orEmpty(), snapshot?.budgets.orEmpty(), snapshot?.recurringRules.orEmpty())
          }
        }

        driveService.markAuthenticated(account)
        _userProfile.value = repository.getUserProfile().copy(
          name = account.displayName ?: repository.getUserProfile().name,
          email = email,
          photoUrl = account.photoUrl?.toString(),
          hasCompletedOnboarding = true
        )
        repository.saveUserProfile(_userProfile.value)
        _googleDriveState.value = GoogleDriveState.Connected(email, driveService.getLastSyncTimestamp())
        _appAuthState.value = AppAuthState.SignedIn(email)

        // Generate any due recurring entries only after the cloud dataset is loaded.
        if (repository.processDueRecurringRules() > 0) {
          syncCurrentCloudData()
        }
      } catch (e: Exception) {
        cloudAccount = null
        _appAuthState.value = AppAuthState.Error(e.localizedMessage ?: "Unable to load your Google Drive data.")
        _googleDriveState.value = GoogleDriveState.SyncFailed(email, e.localizedMessage ?: "Unable to load cloud data")
      }
    }
  }

  // ================= Transaction Operations =================

  fun addTransaction(
    title: String,
    amount: Double,
    type: TransactionType,
    category: TransactionCategory,
    timestamp: Long,
    note: String,
    paymentMethod: PaymentMethod,
    isRecurring: Boolean = false,
    recurringRuleId: Long? = null
  ) {
    viewModelScope.launch {
      val item = TransactionItem(
        title = title.trim(),
        amount = amount,
        type = type,
        category = category,
        timestamp = timestamp,
        note = note.trim(),
        paymentMethod = paymentMethod,
        isRecurring = isRecurring,
        recurringRuleId = recurringRuleId
      )
      repository.insertTransaction(item)
      syncCurrentCloudData()
    }
  }

  fun updateTransaction(item: TransactionItem) {
    viewModelScope.launch {
      repository.updateTransaction(item)
      syncCurrentCloudData()
    }
  }

  fun deleteTransaction(item: TransactionItem) {
    viewModelScope.launch {
      repository.deleteTransaction(item)
      syncCurrentCloudData()
    }
  }

  fun deleteTransactionById(id: Long) {
    viewModelScope.launch {
      repository.deleteTransactionById(id)
      syncCurrentCloudData()
    }
  }

  // ================= Budget Operations =================

  fun saveMonthlyBudget(
    monthKey: String,
    totalBudget: Double,
    categoryBudgets: Map<TransactionCategory, Double>
  ) {
    viewModelScope.launch {
      val existing = allBudgets.value.find { it.monthKey == monthKey }
      val budget = BudgetModel(
        id = existing?.id ?: 0,
        monthKey = monthKey,
        totalBudget = totalBudget,
        categoryBudgets = categoryBudgets,
        updatedAt = System.currentTimeMillis()
      )
      repository.saveBudget(budget)
      syncCurrentCloudData()
    }
  }

  fun deleteBudget(monthKey: String) {
    viewModelScope.launch {
      repository.deleteBudgetForMonth(monthKey)
      syncCurrentCloudData()
    }
  }

  // ================= Recurring Rule Operations =================

  fun addRecurringRule(
    title: String,
    amount: Double,
    type: TransactionType,
    category: TransactionCategory,
    interval: RecurrenceInterval,
    startDate: Long,
    endDate: Long?,
    paymentMethod: PaymentMethod,
    note: String
  ) {
    viewModelScope.launch {
      val rule = RecurringRule(
        title = title.trim(),
        amount = amount,
        type = type,
        category = category,
        interval = interval,
        startDate = startDate,
        endDate = endDate,
        lastGeneratedDate = 0,
        paymentMethod = paymentMethod,
        note = note.trim(),
        isActive = true
      )
      repository.insertRecurringRule(rule)
      repository.processDueRecurringRules()
      syncCurrentCloudData()
    }
  }

  fun updateRecurringRule(rule: RecurringRule) {
    viewModelScope.launch {
      repository.updateRecurringRule(rule)
      repository.processDueRecurringRules()
      syncCurrentCloudData()
    }
  }

  fun toggleRecurringRule(id: Long, isActive: Boolean) {
    viewModelScope.launch {
      repository.toggleRecurringRule(id, isActive)
      if (isActive) {
        repository.processDueRecurringRules()
      }
      syncCurrentCloudData()
    }
  }

  fun deleteRecurringRule(id: Long) {
    viewModelScope.launch {
      repository.deleteRecurringRule(id)
      syncCurrentCloudData()
    }
  }

  fun processRecurringRules() {
    viewModelScope.launch {
      if (repository.processDueRecurringRules() > 0) {
        syncCurrentCloudData()
      }
    }
  }

  // ================= PDF Export & Sharing =================

  fun exportToPdf(
    context: Context,
    period: ExportPeriod,
    customStart: Long? = null,
    customEnd: Long? = null,
    onSuccess: (String) -> Unit,
    onError: (String) -> Unit
  ) {
    viewModelScope.launch {
      try {
        val file = repository.exportToPdf(period, _selectedCalendar.value, customStart, customEnd)

        val uri: Uri = FileProvider.getUriForFile(
          context,
          "${context.packageName}.fileprovider",
          file
        )

        val intent = Intent(Intent.ACTION_SEND).apply {
          type = "application/pdf"
          putExtra(Intent.EXTRA_STREAM, uri)
          putExtra(Intent.EXTRA_SUBJECT, "Paisa Financial Statement (${file.name})")
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        val chooser = Intent.createChooser(intent, "Share or Save Financial PDF")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)

        onSuccess("PDF Statement generated: ${file.name}")
      } catch (e: Exception) {
        e.printStackTrace()
        onError(e.localizedMessage ?: "Failed to generate PDF report")
      }
    }
  }

  fun clearAllData(onComplete: () -> Unit) {
    viewModelScope.launch {
      repository.clearAllFinancialData()
      syncCurrentCloudData()
      onComplete()
    }
  }

  // ================= Google Drive Actions =================

  fun getDriveSignInIntent(): Intent = driveService.getSignInIntent()

  fun startDriveConnecting() {
    _googleDriveState.value = GoogleDriveState.Connecting
    _appAuthState.value = AppAuthState.Connecting
  }

  fun signOut(onComplete: () -> Unit = {}) {
    viewModelScope.launch {
      driveService.signOut()
      cloudAccount = null
      repository.clearAllFinancialData()
      _userProfile.value = UserProfile()
      _googleDriveState.value = GoogleDriveState.NotConnected
      _appAuthState.value = AppAuthState.SignedOut
      onComplete()
    }
  }

  private suspend fun syncCurrentCloudData() {
    val account = cloudAccount ?: driveService.getLastSignedInAccount() ?: return

    cloudSyncMutex.withLock {
      val snapshot = repository.getUserDataSnapshotSuspend()
      val profile = _userProfile.value.copy(
        name = account.displayName ?: snapshot.userProfile.name,
        email = account.email.orEmpty(),
        photoUrl = account.photoUrl?.toString(),
        hasCompletedOnboarding = true
      )
      _googleDriveState.value = GoogleDriveState.Syncing
      try {
        val timestamp = driveService.syncCloudData(
          account = account,
          userProfile = profile,
          transactions = snapshot.transactions,
          budgets = snapshot.budgets,
          recurringRules = snapshot.recurringRules
        )
        _userProfile.value = profile
        repository.saveUserProfile(profile)
        _googleDriveState.value = GoogleDriveState.SyncSuccess(
          email = account.email.orEmpty(),
          timestampMillis = timestamp
        )
      } catch (e: Exception) {
        _googleDriveState.value = GoogleDriveState.SyncFailed(
          email = account.email,
          errorMessage = e.localizedMessage ?: "Your latest change could not be synced to Google Drive."
        )
      }
    }
  }

  fun performDriveBackup(onSuccessMessage: (String) -> Unit, onErrorMessage: (String) -> Unit) {
    viewModelScope.launch {
      if (cloudAccount == null) {
        onErrorMessage("Please sign in with Google first.")
        return@launch
      }
      syncCurrentCloudData()
      when (val state = _googleDriveState.value) {
        is GoogleDriveState.SyncSuccess -> onSuccessMessage("Financial data synced to Google Drive")
        is GoogleDriveState.Connected -> onSuccessMessage("Financial data is up to date in Google Drive")
        is GoogleDriveState.SyncFailed -> onErrorMessage(state.errorMessage)
        else -> onErrorMessage("Google Drive sync did not complete.")
      }
    }
  }

  fun resetDriveStateToConnected() {
    val account = driveService.getLastSignedInAccount()
    if (account != null) {
      cloudAccount = account
      _googleDriveState.value = GoogleDriveState.Connected(
        email = account.email.orEmpty(),
        lastSyncTimestampMillis = driveService.getLastSyncTimestamp()
      )
    } else {
      _googleDriveState.value = GoogleDriveState.NotConnected
    }
  }

}
