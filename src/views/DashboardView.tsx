import React from 'react';
import { TransactionItem, BudgetModel, CategorySpending, DailySpendingPoint } from '../types/finance';
import { formatCurrency, formatDate, CATEGORY_METADATA, PAYMENT_METHOD_LABELS } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardViewProps {
  transactions: TransactionItem[];
  currentBudget?: BudgetModel;
  currencySymbol: string;
  onOpenAddTransaction: () => void;
  onOpenBudgetModal: () => void;
  onSelectTransaction: (tx: TransactionItem) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  currentBudget,
  currencySymbol,
  onOpenAddTransaction,
  onOpenBudgetModal,
  onSelectTransaction,
  onNavigateTab
}) => {
  // Aggregate Income, Expense, Savings
  const incomeTxs = transactions.filter((t) => t.type === 'INCOME');
  const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');

  const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Budget calculations
  const totalBudgetCap = currentBudget?.totalBudget || 0;
  const budgetRemaining = totalBudgetCap - totalExpense;
  const budgetPercent = totalBudgetCap > 0 ? (totalExpense / totalBudgetCap) * 100 : 0;

  // Category breakdown for Pie Chart
  const categoryMap: Record<string, { amount: number; count: number }> = {};
  expenseTxs.forEach((t) => {
    if (!categoryMap[t.category]) {
      categoryMap[t.category] = { amount: 0, count: 0 };
    }
    categoryMap[t.category].amount += t.amount;
    categoryMap[t.category].count += 1;
  });

  const categoryBreakdown: CategorySpending[] = Object.entries(categoryMap)
    .map(([cat, data]) => ({
      category: cat as any,
      name: CATEGORY_METADATA[cat as keyof typeof CATEGORY_METADATA]?.label || cat,
      amount: data.amount,
      percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
      count: data.count,
      color: CATEGORY_METADATA[cat as keyof typeof CATEGORY_METADATA]?.color || '#64748b'
    }))
    .sort((a, b) => b.amount - a.amount);

  // Daily Trend Chart data (1 to 31)
  const dailyPointsMap: Record<number, { expense: number; income: number }> = {};
  for (let i = 1; i <= 31; i++) {
    dailyPointsMap[i] = { expense: 0, income: 0 };
  }
  transactions.forEach((t) => {
    const day = new Date(t.timestamp).getDate();
    if (dailyPointsMap[day]) {
      if (t.type === 'EXPENSE') dailyPointsMap[day].expense += t.amount;
      if (t.type === 'INCOME') dailyPointsMap[day].income += t.amount;
    }
  });

  const dailyTrendData = Object.entries(dailyPointsMap).map(([day, val]) => ({
    day: `D${day}`,
    Expense: val.expense,
    Income: val.income
  }));

  // Recent 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-['Outfit']">
              {formatCurrency(totalIncome, currencySymbol)}
            </h3>
            <p className="text-xs text-emerald-400/90 mt-1 flex items-center gap-1 font-medium">
              <ArrowUpRight size={14} />
              <span>{incomeTxs.length} income deposits</span>
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-['Outfit']">
              {formatCurrency(totalExpense, currencySymbol)}
            </h3>
            <p className="text-xs text-rose-400/90 mt-1 flex items-center gap-1 font-medium">
              <ArrowDownRight size={14} />
              <span>{expenseTxs.length} expense transactions</span>
            </p>
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Net Savings</span>
            <div className={`p-2 rounded-xl ${netSavings >= 0 ? 'bg-cyan-500/15 text-cyan-400' : 'bg-amber-500/15 text-amber-400'}`}>
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black font-['Outfit'] ${netSavings >= 0 ? 'text-white' : 'text-amber-400'}`}>
              {formatCurrency(netSavings, currencySymbol)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {savingsRate.toFixed(1)}% savings rate this period
            </p>
          </div>
        </div>

        {/* Monthly Budget */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Monthly Budget</span>
              <button
                onClick={onOpenBudgetModal}
                className="text-[11px] font-bold text-emerald-400 hover:underline"
              >
                Set Limit
              </button>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-white">
                  {totalBudgetCap > 0 ? formatCurrency(totalBudgetCap, currencySymbol) : 'Not Set'}
                </h3>
                {totalBudgetCap > 0 && (
                  <span className={`text-xs font-bold ${budgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {budgetRemaining >= 0 ? `${formatCurrency(budgetRemaining, currencySymbol)} left` : 'Over budget'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {totalBudgetCap > 0 && (
            <div className="mt-3">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercent > 100
                      ? 'bg-rose-500'
                      : budgetPercent > 80
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, budgetPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{budgetPercent.toFixed(0)}% used</span>
                <span>{formatCurrency(totalExpense, currencySymbol)} spent</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white">Daily Cashflow Trend</h4>
              <p className="text-xs text-slate-400">Day-by-day distribution of income and expenses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Income
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                Expense
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `${v > 0 ? (v / 1000).toFixed(0) + 'k' : 0}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value) || 0, currencySymbol), '']}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={14} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Category Donut / Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Category Allocation</h4>
                <p className="text-xs text-slate-400">Highest spending categories</p>
              </div>
              <PieChartIcon size={18} className="text-slate-500" />
            </div>

            {categoryBreakdown.length > 0 ? (
              <>
                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value) || 0, currencySymbol), '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center pointer-events-none">
                    <span className="text-[10px] text-slate-400">Total Spent</span>
                    <span className="text-xs font-bold text-white">
                      {formatCurrency(totalExpense, currencySymbol)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
                  {categoryBreakdown.slice(0, 4).map((cat) => {
                    const meta = CATEGORY_METADATA[cat.category];
                    const Icon = meta?.icon || Sparkles;
                    return (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-slate-300 truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-medium">
                          <span className="text-white">{formatCurrency(cat.amount, currencySymbol)}</span>
                          <span className="text-[10px] text-slate-400 w-8 text-right">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
                <span>No expense records for this month yet.</span>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('budgets')}
            className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition flex items-center justify-center gap-1"
          >
            <span>Manage Budget Limits</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Recent Transactions</h4>
            <p className="text-xs text-slate-400">Latest activity in this period</p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({transactions.length})</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {recentTransactions.map((tx) => {
              const meta = CATEGORY_METADATA[tx.category];
              const Icon = meta?.icon || Sparkles;
              const isIncome = tx.type === 'INCOME';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 rounded-xl px-3 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${meta?.color || '#10b981'}20`,
                        color: meta?.color || '#10b981'
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{tx.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{meta?.label || tx.category}</span>
                        <span>•</span>
                        <span>{formatDate(tx.timestamp, 'short')}</span>
                        <span>•</span>
                        <span>{PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, currencySymbol)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-xs text-slate-400 mb-3">No transactions found for this month.</p>
            <button
              onClick={onOpenAddTransaction}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
            >
              + Add First Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
