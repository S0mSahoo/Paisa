import React from 'react';
import { TransactionItem, TransactionCategory } from '../types/finance';
import { formatCurrency, CATEGORY_METADATA, PAYMENT_METHOD_LABELS } from '../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, CreditCard, Sparkles, Award } from 'lucide-react';

interface AnalyticsViewProps {
  transactions: TransactionItem[];
  currencySymbol: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions, currencySymbol }) => {
  const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');
  const incomeTxs = transactions.filter((t) => t.type === 'INCOME');

  const totalExpense = expenseTxs.reduce((s, t) => s + t.amount, 0);
  const totalIncome = incomeTxs.reduce((s, t) => s + t.amount, 0);

  // Group by Category
  const catMap: Record<string, { amount: number; count: number }> = {};
  expenseTxs.forEach((t) => {
    if (!catMap[t.category]) catMap[t.category] = { amount: 0, count: 0 };
    catMap[t.category].amount += t.amount;
    catMap[t.category].count += 1;
  });

  const categoryRanked = Object.entries(catMap)
    .map(([cat, val]) => {
      const categoryKey = cat as TransactionCategory;
      const meta = CATEGORY_METADATA[categoryKey];
      return {
        category: categoryKey,
        label: meta?.label || cat,
        amount: val.amount,
        percentage: totalExpense > 0 ? (val.amount / totalExpense) * 100 : 0,
        count: val.count,
        color: meta?.color || '#64748b'
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Group by Payment Method
  const paymentMap: Record<string, number> = {};
  transactions.forEach((t) => {
    paymentMap[t.paymentMethod] = (paymentMap[t.paymentMethod] || 0) + t.amount;
  });

  const paymentData = Object.entries(paymentMap).map(([method, amount]) => ({
    name: PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] || method,
    amount
  }));

  // Monthly breakdown for the past 6 months
  const monthlyDataMap: Record<string, { income: number; expense: number; label: string }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString([], { month: 'short' });
    monthlyDataMap[key] = { income: 0, expense: 0, label };
  }

  transactions.forEach((t) => {
    const d = new Date(t.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyDataMap[key]) {
      if (t.type === 'INCOME') monthlyDataMap[key].income += t.amount;
      if (t.type === 'EXPENSE') monthlyDataMap[key].expense += t.amount;
    }
  });

  const multiMonthTrend = Object.values(monthlyDataMap);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top 6-Month Income vs Expense Trend */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">6-Month Cashflow Trajectory</h4>
            <p className="text-xs text-slate-400">Comparing income inflows and expense outflows over time</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Incomes
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              Expenses
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={multiMonthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${v > 0 ? (v / 1000).toFixed(0) + 'k' : 0}`}
              />
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
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Ranked Spending Categories & Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranked Categories */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white">Top Spending Categories</h4>
            <Award size={18} className="text-amber-400" />
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {categoryRanked.length > 0 ? (
              categoryRanked.map((cat, idx) => {
                const meta = CATEGORY_METADATA[cat.category];
                const Icon = meta?.icon || Sparkles;

                return (
                  <div key={cat.category} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-bold text-slate-500 w-4">#{idx + 1}</span>
                        <span
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <Icon size={14} />
                        </span>
                        <span className="font-semibold text-slate-200">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold">
                        <span className="text-white">{formatCurrency(cat.amount, currencySymbol)}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">No expense records found.</div>
            )}
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white">Payment Method Share</h4>
              <CreditCard size={18} className="text-cyan-400" />
            </div>

            <div className="space-y-3">
              {paymentData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800"
                >
                  <span className="text-xs font-semibold text-slate-300">{item.name}</span>
                  <span className="text-xs font-bold text-white">
                    {formatCurrency(item.amount, currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300/90">
            💡 <strong>Financial Insight:</strong> Tracking payments through multiple channels helps maintain complete transparency in digital wallet transactions and cash expenses.
          </div>
        </div>
      </div>
    </div>
  );
};
