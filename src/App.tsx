import React, { useState, useEffect } from 'react';
import { ActiveTab, TransactionItem, BudgetModel, RecurringRule, UserProfile } from './types/finance';
import {
  loadTransactions,
  saveTransactions,
  loadBudgets,
  saveBudgets,
  loadRecurring,
  saveRecurring,
  loadUserProfile,
  saveUserProfile,
  generateSampleData
} from './utils/storage';
import { getMonthKey } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { Navigation } from './components/Navigation';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { RecurringRuleModal } from './components/RecurringRuleModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { DashboardView } from './views/DashboardView';
import { CalendarView } from './views/CalendarView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { RecurringView } from './views/RecurringView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Data states
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetModel[]>([]);
  const [recurring, setRecurring] = useState<RecurringRule[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile());

  // Modal states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<TransactionItem | null>(null);
  const [defaultModalDate, setDefaultModalDate] = useState<Date | undefined>(undefined);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editRecurringRule, setEditRecurringRule] = useState<RecurringRule | null>(null);

  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedTx = loadTransactions();
    const loadedBudgets = loadBudgets();
    const loadedRecurring = loadRecurring();
    const loadedProfile = loadUserProfile();

    setTransactions(loadedTx);
    setBudgets(loadedBudgets);
    setRecurring(loadedRecurring);
    setUserProfile(loadedProfile);
  }, []);

  // Save changes to localStorage
  const updateTransactions = (newItems: TransactionItem[]) => {
    setTransactions(newItems);
    saveTransactions(newItems);
  };

  const updateBudgets = (newBudgets: BudgetModel[]) => {
    setBudgets(newBudgets);
    saveBudgets(newBudgets);
  };

  const updateRecurring = (newRules: RecurringRule[]) => {
    setRecurring(newRules);
    saveRecurring(newRules);
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    saveUserProfile(profile);
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Current month key & active budget
  const currentMonthKey = getMonthKey(currentDate);
  const currentBudget = budgets.find((b) => b.monthKey === currentMonthKey);

  // Transactions filtered for the active month view
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.timestamp);
    return getMonthKey(d) === currentMonthKey;
  });

  // Transaction Actions
  const handleSaveTransaction = (
    txData: Omit<TransactionItem, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    const now = Date.now();
    if (editId) {
      const updated = transactions.map((t) =>
        t.id === editId ? { ...t, ...txData, updatedAt: now } : t
      );
      updateTransactions(updated);
    } else {
      const newTx: TransactionItem = {
        ...txData,
        id: `tx_${now}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: now,
        updatedAt: now,
      };
      updateTransactions([newTx, ...transactions]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    updateTransactions(updated);
  };

  // Budget Actions
  const handleSaveBudget = (totalBudget: number, categoryBudgets: Record<string, number>) => {
    const now = Date.now();
    const existingIndex = budgets.findIndex((b) => b.monthKey === currentMonthKey);

    if (existingIndex >= 0) {
      const updated = [...budgets];
      updated[existingIndex] = {
        ...updated[existingIndex],
        totalBudget,
        categoryBudgets,
        updatedAt: now,
      };
      updateBudgets(updated);
    } else {
      const newBudget: BudgetModel = {
        id: `budget_${currentMonthKey}`,
        monthKey: currentMonthKey,
        totalBudget,
        categoryBudgets,
        updatedAt: now,
      };
      updateBudgets([...budgets, newBudget]);
    }
  };

  // Recurring Rules Actions
  const handleSaveRecurringRule = (
    ruleData: Omit<RecurringRule, 'id' | 'createdAt'>,
    editId?: string
  ) => {
    const now = Date.now();
    if (editId) {
      const updated = recurring.map((r) =>
        r.id === editId ? { ...r, ...ruleData } : r
      );
      updateRecurring(updated);
    } else {
      const newRule: RecurringRule = {
        ...ruleData,
        id: `rec_${now}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: now,
      };
      updateRecurring([...recurring, newRule]);
    }
  };

  const handleDeleteRecurringRule = (id: string) => {
    const updated = recurring.filter((r) => r.id !== id);
    updateRecurring(updated);
  };

  const handleToggleRecurringRule = (id: string) => {
    const updated = recurring.map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    );
    updateRecurring(updated);
  };

  // Process Due Recurring Rules
  const handleTriggerDueRecurring = () => {
    const now = Date.now();
    const generatedTxs: TransactionItem[] = [];

    const updatedRules = recurring.map((rule) => {
      if (!rule.isActive) return rule;

      const newTx: TransactionItem = {
        id: `tx_rec_${now}_${Math.random().toString(36).substr(2, 5)}`,
        title: `${rule.title} (Auto-posted)`,
        amount: rule.amount,
        type: rule.type,
        category: rule.category,
        timestamp: now,
        paymentMethod: rule.paymentMethod,
        isRecurring: true,
        recurringRuleId: rule.id,
        note: rule.note || 'Generated from recurring rule',
        createdAt: now,
        updatedAt: now,
      };
      generatedTxs.push(newTx);

      return {
        ...rule,
        lastGeneratedDate: now,
      };
    });

    if (generatedTxs.length > 0) {
      updateTransactions([...generatedTxs, ...transactions]);
      updateRecurring(updatedRules);
      alert(`Successfully generated ${generatedTxs.length} recurring transactions!`);
    } else {
      alert('No active recurring rules to process.');
    }
  };

  // Reset & Clear
  const handleResetSampleData = () => {
    const sample = generateSampleData();
    updateTransactions(sample.transactions);
    updateBudgets(sample.budgets);
    updateRecurring(sample.recurring);
  };

  const handleClearAllData = () => {
    updateTransactions([]);
    updateBudgets([]);
    updateRecurring([]);
  };

  const handleImportData = (data: {
    transactions: TransactionItem[];
    budgets: BudgetModel[];
    recurring: RecurringRule[];
    userProfile: UserProfile;
  }) => {
    updateTransactions(data.transactions);
    updateBudgets(data.budgets);
    updateRecurring(data.recurring);
    handleUpdateProfile(data.userProfile);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Top App Header */}
      <Navbar
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onCurrentMonth={handleCurrentMonth}
        onOpenAddTransaction={() => {
          setEditTransaction(null);
          setDefaultModalDate(undefined);
          setIsTransactionModalOpen(true);
        }}
        onOpenExportPdf={() => setIsExportPdfModalOpen(true)}
        userName={userProfile.name}
      />

      {/* Main Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        txCount={transactions.length}
        recurringCount={recurring.filter((r) => r.isActive).length}
      />

      {/* Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={currentMonthTransactions}
            currentBudget={currentBudget}
            currencySymbol={userProfile.currencySymbol}
            onOpenAddTransaction={() => {
              setEditTransaction(null);
              setDefaultModalDate(undefined);
              setIsTransactionModalOpen(true);
            }}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            onSelectTransaction={(tx) => {
              setEditTransaction(tx);
              setIsTransactionModalOpen(true);
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            currentDate={currentDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            transactions={transactions}
            currencySymbol={userProfile.currencySymbol}
            onOpenAddTransactionForDate={(date) => {
              setEditTransaction(null);
              setDefaultModalDate(date);
              setIsTransactionModalOpen(true);
            }}
            onSelectTransaction={(tx) => {
              setEditTransaction(tx);
              setIsTransactionModalOpen(true);
            }}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            currencySymbol={userProfile.currencySymbol}
            onOpenAddTransaction={() => {
              setEditTransaction(null);
              setDefaultModalDate(undefined);
              setIsTransactionModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditTransaction(tx);
              setIsTransactionModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            currentBudget={currentBudget}
            transactions={currentMonthTransactions}
            currencySymbol={userProfile.currencySymbol}
            monthLabel={currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringView
            recurringRules={recurring}
            currencySymbol={userProfile.currencySymbol}
            onOpenAddRule={() => {
              setEditRecurringRule(null);
              setIsRecurringModalOpen(true);
            }}
            onEditRule={(rule) => {
              setEditRecurringRule(rule);
              setIsRecurringModalOpen(true);
            }}
            onDeleteRule={handleDeleteRecurringRule}
            onToggleActive={handleToggleRecurringRule}
            onTriggerGenerateDue={handleTriggerDueRecurring}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            currencySymbol={userProfile.currencySymbol}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            transactions={transactions}
            budgets={budgets}
            recurring={recurring}
            onImportData={handleImportData}
            onResetSampleData={handleResetSampleData}
            onClearAllData={handleClearAllData}
            onOpenExportPdf={() => setIsExportPdfModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editTransaction={editTransaction}
        currencySymbol={userProfile.currencySymbol}
        defaultDate={defaultModalDate}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        currentBudget={currentBudget}
        currencySymbol={userProfile.currencySymbol}
        monthLabel={currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
      />

      <RecurringRuleModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setEditRecurringRule(null);
        }}
        onSave={handleSaveRecurringRule}
        editRule={editRecurringRule}
        currencySymbol={userProfile.currencySymbol}
      />

      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        transactions={transactions}
        currentDate={currentDate}
        userName={userProfile.name}
        currencySymbol={userProfile.currencySymbol}
      />
    </div>
  );
}

export default App;
