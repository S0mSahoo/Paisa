import { TransactionCategory, TransactionType, PaymentMethod, RecurrenceInterval } from '../types/finance';
import {
  LucideIcon,
  Utensils,
  ShoppingCart,
  Car,
  Home,
  Receipt,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Plane,
  Dumbbell,
  Sparkles,
  Tv,
  HelpCircle,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Gift,
  Coins,
  Wallet
} from 'lucide-react';
import React from 'react';

export interface CategoryInfo {
  label: string;
  type: TransactionType;
  color: string;
  icon: LucideIcon;
}

export const CATEGORY_METADATA: Record<TransactionCategory, CategoryInfo> = {
  // Expenses
  FOOD_DINING: { label: 'Food & Dining', type: 'EXPENSE', color: '#f59e0b', icon: Utensils },
  GROCERIES: { label: 'Groceries', type: 'EXPENSE', color: '#10b981', icon: ShoppingCart },
  TRANSPORTATION: { label: 'Transportation', type: 'EXPENSE', color: '#0ea5e9', icon: Car },
  HOUSING: { label: 'Housing & Rent', type: 'EXPENSE', color: '#6366f1', icon: Home },
  UTILITIES: { label: 'Bills & Utilities', type: 'EXPENSE', color: '#8b5cf6', icon: Receipt },
  SHOPPING: { label: 'Shopping', type: 'EXPENSE', color: '#ec4899', icon: ShoppingBag },
  ENTERTAINMENT: { label: 'Entertainment', type: 'EXPENSE', color: '#14b8a6', icon: Film },
  HEALTHCARE: { label: 'Healthcare', type: 'EXPENSE', color: '#ef4444', icon: HeartPulse },
  EDUCATION: { label: 'Education', type: 'EXPENSE', color: '#4f46e5', icon: GraduationCap },
  TRAVEL: { label: 'Travel', type: 'EXPENSE', color: '#0284c7', icon: Plane },
  FITNESS: { label: 'Fitness & Sports', type: 'EXPENSE', color: '#06b6d4', icon: Dumbbell },
  PERSONAL_CARE: { label: 'Personal Care', type: 'EXPENSE', color: '#d946ef', icon: Sparkles },
  SUBSCRIPTIONS: { label: 'Subscriptions', type: 'EXPENSE', color: '#a855f7', icon: Tv },
  OTHER_EXPENSE: { label: 'Other Expense', type: 'EXPENSE', color: '#64748b', icon: HelpCircle },

  // Income
  SALARY: { label: 'Salary & Wages', type: 'INCOME', color: '#10b981', icon: Briefcase },
  FREELANCE: { label: 'Freelance & Gigs', type: 'INCOME', color: '#06b6d4', icon: Laptop },
  BUSINESS: { label: 'Business Revenue', type: 'INCOME', color: '#6366f1', icon: Building2 },
  INVESTMENTS: { label: 'Investments & Returns', type: 'INCOME', color: '#34d399', icon: TrendingUp },
  BONUS: { label: 'Bonus & Incentives', type: 'INCOME', color: '#f59e0b', icon: Gift },
  GIFT: { label: 'Gifts & Grants', type: 'INCOME', color: '#ec4899', icon: Gift },
  RENTAL_INCOME: { label: 'Rental Income', type: 'INCOME', color: '#38bdf8', icon: Home },
  OTHER_INCOME: { label: 'Other Income', type: 'INCOME', color: '#64748b', icon: Coins }
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  UPI: 'UPI (GPay / PhonePe / Paytm)',
  CASH: 'Cash',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  NET_BANKING: 'Net Banking / IMPS',
  WALLET: 'Digital Wallet',
  OTHER: 'Other'
};

export const RECURRENCE_LABELS: Record<RecurrenceInterval, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly'
};

export function formatCurrency(amount: number, symbol = '₹'): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(abs);

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function formatDate(timestamp: number, format: 'full' | 'short' | 'time' | 'dayOnly' = 'full'): string {
  const d = new Date(timestamp);
  if (format === 'time') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (format === 'short') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  if (format === 'dayOnly') {
    return d.getDate().toString();
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
}
