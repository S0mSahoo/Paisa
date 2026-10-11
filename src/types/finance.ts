export type TransactionType = 'EXPENSE' | 'INCOME';

export type RecurrenceInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type PaymentMethod = 
  | 'UPI'
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'NET_BANKING'
  | 'WALLET'
  | 'OTHER';

export type TransactionCategory =
  // Expense
  | 'FOOD_DINING'
  | 'GROCERIES'
  | 'TRANSPORTATION'
  | 'HOUSING'
  | 'UTILITIES'
  | 'SHOPPING'
  | 'ENTERTAINMENT'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'TRAVEL'
  | 'FITNESS'
  | 'PERSONAL_CARE'
  | 'SUBSCRIPTIONS'
  | 'OTHER_EXPENSE'
  // Income
  | 'SALARY'
  | 'FREELANCE'
  | 'BUSINESS'
  | 'INVESTMENTS'
  | 'BONUS'
  | 'GIFT'
  | 'RENTAL_INCOME'
  | 'OTHER_INCOME';

export interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  timestamp: number; // epoch millis
  note?: string;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  recurringRuleId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetModel {
  id: string;
  monthKey: string; // "YYYY-MM", e.g. "2026-09"
  totalBudget: number;
  categoryBudgets: Record<string, number>; // category -> budget amount
  updatedAt: number;
}

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  interval: RecurrenceInterval;
  startDate: number;
  endDate?: number;
  lastGeneratedDate?: number;
  paymentMethod: PaymentMethod;
  note?: string;
  isActive: boolean;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  email: string;
  currencySymbol: string;
  currencyCode: string;
  hasCompletedOnboarding: boolean;
}

export interface CategorySpending {
  category: TransactionCategory;
  name: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export interface DailySpendingPoint {
  dayOfMonth: number;
  dateKey: string; // "YYYY-MM-DD"
  dayLabel: string;
  expense: number;
  income: number;
  net: number;
}

export type ActiveTab = 'dashboard' | 'calendar' | 'transactions' | 'budgets' | 'recurring' | 'analytics' | 'settings';
