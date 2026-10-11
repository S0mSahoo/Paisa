import { TransactionItem, BudgetModel, RecurringRule, UserProfile } from '../types/finance';
import { getMonthKey } from './formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'paisa_transactions_v1',
  BUDGETS: 'paisa_budgets_v1',
  RECURRING: 'paisa_recurring_v1',
  USER_PROFILE: 'paisa_user_profile_v1',
};

export function getInitialUserProfile(): UserProfile {
  return {
    name: 'Som Sahoo',
    email: 'email.somsahoo@gmail.com',
    currencySymbol: '₹',
    currencyCode: 'INR',
    hasCompletedOnboarding: true,
  };
}

export function generateSampleData(): {
  transactions: TransactionItem[];
  budgets: BudgetModel[];
  recurring: RecurringRule[];
} {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const transactions: TransactionItem[] = [
    {
      id: 'tx_salary_1',
      title: 'Monthly Salary (Direct Deposit)',
      amount: 85000,
      type: 'INCOME',
      category: 'SALARY',
      timestamp: startOfMonth + 10 * 3600 * 1000,
      paymentMethod: 'NET_BANKING',
      note: 'Monthly tech consulting salary',
      createdAt: startOfMonth,
      updatedAt: startOfMonth,
    },
    {
      id: 'tx_rent_1',
      title: 'Apartment Rent',
      amount: 18000,
      type: 'EXPENSE',
      category: 'HOUSING',
      timestamp: startOfMonth + 14 * 3600 * 1000,
      paymentMethod: 'UPI',
      note: '2BHK Society Rent',
      isRecurring: true,
      createdAt: startOfMonth,
      updatedAt: startOfMonth,
    },
    {
      id: 'tx_freelance_1',
      title: 'UI/UX Design Milestone',
      amount: 22000,
      type: 'INCOME',
      category: 'FREELANCE',
      timestamp: now.getTime() - 6 * 86400 * 1000,
      paymentMethod: 'NET_BANKING',
      note: 'Client project payment',
      createdAt: now.getTime() - 6 * 86400 * 1000,
      updatedAt: now.getTime() - 6 * 86400 * 1000,
    },
    {
      id: 'tx_groc_1',
      title: 'Supermarket & Organic Pantry',
      amount: 4350,
      type: 'EXPENSE',
      category: 'GROCERIES',
      timestamp: now.getTime() - 4 * 86400 * 1000,
      paymentMethod: 'UPI',
      note: 'Weekly essentials and fresh produce',
      createdAt: now.getTime() - 4 * 86400 * 1000,
      updatedAt: now.getTime() - 4 * 86400 * 1000,
    },
    {
      id: 'tx_dining_1',
      title: 'Bistro Weekend Dinner',
      amount: 2150,
      type: 'EXPENSE',
      category: 'FOOD_DINING',
      timestamp: now.getTime() - 2 * 86400 * 1000,
      paymentMethod: 'CREDIT_CARD',
      note: 'Dinner with friends',
      createdAt: now.getTime() - 2 * 86400 * 1000,
      updatedAt: now.getTime() - 2 * 86400 * 1000,
    },
    {
      id: 'tx_util_1',
      title: 'Electricity & High-Speed Fiber',
      amount: 2600,
      type: 'EXPENSE',
      category: 'UTILITIES',
      timestamp: now.getTime() - 3 * 86400 * 1000,
      paymentMethod: 'UPI',
      note: 'Utility bill payments',
      createdAt: now.getTime() - 3 * 86400 * 1000,
      updatedAt: now.getTime() - 3 * 86400 * 1000,
    },
    {
      id: 'tx_sub_1',
      title: 'Streaming & Cloud Subscriptions',
      amount: 1299,
      type: 'EXPENSE',
      category: 'SUBSCRIPTIONS',
      timestamp: now.getTime() - 5 * 86400 * 1000,
      paymentMethod: 'CREDIT_CARD',
      note: 'Spotify, Google One & Netflix',
      isRecurring: true,
      createdAt: now.getTime() - 5 * 86400 * 1000,
      updatedAt: now.getTime() - 5 * 86400 * 1000,
    },
    {
      id: 'tx_fit_1',
      title: 'Gym & Fitness Membership',
      amount: 3000,
      type: 'EXPENSE',
      category: 'FITNESS',
      timestamp: now.getTime() - 7 * 86400 * 1000,
      paymentMethod: 'UPI',
      note: 'Monthly fitness center renewal',
      createdAt: now.getTime() - 7 * 86400 * 1000,
      updatedAt: now.getTime() - 7 * 86400 * 1000,
    },
    {
      id: 'tx_invest_1',
      title: 'Index Fund SIP Return / Dividend',
      amount: 4500,
      type: 'INCOME',
      category: 'INVESTMENTS',
      timestamp: now.getTime() - 8 * 86400 * 1000,
      paymentMethod: 'NET_BANKING',
      note: 'Quarterly dividend payout',
      createdAt: now.getTime() - 8 * 86400 * 1000,
      updatedAt: now.getTime() - 8 * 86400 * 1000,
    },
  ];

  const budgets: BudgetModel[] = [
    {
      id: `budget_${currentMonthKey}`,
      monthKey: currentMonthKey,
      totalBudget: 45000,
      categoryBudgets: {
        HOUSING: 18000,
        GROCERIES: 10000,
        FOOD_DINING: 6000,
        UTILITIES: 4000,
        SUBSCRIPTIONS: 2000,
        FITNESS: 3000,
        SHOPPING: 5000,
      },
      updatedAt: Date.now(),
    },
  ];

  const recurring: RecurringRule[] = [
    {
      id: 'rec_rent',
      title: 'Apartment Monthly Rent',
      amount: 18000,
      type: 'EXPENSE',
      category: 'HOUSING',
      interval: 'MONTHLY',
      startDate: startOfMonth,
      paymentMethod: 'UPI',
      note: 'Automated recurring rent rule',
      isActive: true,
      lastGeneratedDate: startOfMonth,
      createdAt: startOfMonth,
    },
    {
      id: 'rec_salary',
      title: 'Monthly Salary Credit',
      amount: 85000,
      type: 'INCOME',
      category: 'SALARY',
      interval: 'MONTHLY',
      startDate: startOfMonth,
      paymentMethod: 'NET_BANKING',
      note: 'Corporate payroll',
      isActive: true,
      lastGeneratedDate: startOfMonth,
      createdAt: startOfMonth,
    },
    {
      id: 'rec_sub',
      title: 'Cloud & Media Subscriptions',
      amount: 1299,
      type: 'EXPENSE',
      category: 'SUBSCRIPTIONS',
      interval: 'MONTHLY',
      startDate: startOfMonth,
      paymentMethod: 'CREDIT_CARD',
      note: 'Media subscriptions',
      isActive: true,
      lastGeneratedDate: startOfMonth,
      createdAt: startOfMonth,
    },
  ];

  return { transactions, budgets, recurring };
}

export function loadTransactions(): TransactionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      const sample = generateSampleData();
      saveTransactions(sample.transactions);
      return sample.transactions;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading transactions', e);
    return [];
  }
}

export function saveTransactions(items: TransactionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving transactions', e);
  }
}

export function loadBudgets(): BudgetModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!raw) {
      const sample = generateSampleData();
      saveBudgets(sample.budgets);
      return sample.budgets;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading budgets', e);
    return [];
  }
}

export function saveBudgets(items: BudgetModel[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving budgets', e);
  }
}

export function loadRecurring(): RecurringRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECURRING);
    if (!raw) {
      const sample = generateSampleData();
      saveRecurring(sample.recurring);
      return sample.recurring;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading recurring rules', e);
    return [];
  }
}

export function saveRecurring(items: RecurringRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving recurring rules', e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) {
      const initial = getInitialUserProfile();
      saveUserProfile(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return getInitialUserProfile();
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving user profile', e);
  }
}
