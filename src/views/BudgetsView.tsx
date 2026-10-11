import React from 'react';
import { TransactionItem, BudgetModel, TransactionCategory } from '../types/finance';
import { formatCurrency, CATEGORY_METADATA } from '../utils/formatters';
import { PiggyBank, Plus, AlertTriangle, CheckCircle2, TrendingDown, Sparkles } from 'lucide-react';

interface BudgetsViewProps {
  currentBudget?: BudgetModel;
  transactions: TransactionItem[];
  currencySymbol: string;
  monthLabel: string;
  onOpenBudgetModal: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  currentBudget,
  transactions,
  currencySymbol,
  monthLabel,
  onOpenBudgetModal
}) => {
  const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');
  const totalExpense = expenseTxs.reduce((s, t) => s + t.amount, 0);

  const totalBudgetCap = currentBudget?.totalBudget || 0;
  const overallRemaining = totalBudgetCap - totalExpense;
  const overallUsage = totalBudgetCap > 0 ? (totalExpense / totalBudgetCap) * 100 : 0;

  // Category expense map
  const catExpenseMap: Record<string, number> = {};
  expenseTxs.forEach((t) => {
    catExpenseMap[t.category] = (catExpenseMap[t.category] || 0) + t.amount;
  });

  // Expense categories with configured budgets or actual spend
  const categoryBudgets = currentBudget?.categoryBudgets || {};
  const activeExpenseCategories = Object.entries(CATEGORY_METADATA)
    .filter(([_, meta]) => meta.type === 'EXPENSE')
    .map(([cat]) => cat as TransactionCategory);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Monthly Budget Summary Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                {monthLabel}
              </span>
              <h3 className="text-lg font-bold text-white">Monthly Expense Budget</h3>
            </div>
            <p className="text-xs text-slate-400">
              Set caps to discipline your monthly cash outflow and save more.
            </p>
          </div>

          <button
            onClick={onOpenBudgetModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <PiggyBank size={16} />
            <span>{totalBudgetCap > 0 ? 'Edit Budget Limits' : 'Set Monthly Budget'}</span>
          </button>
        </div>

        {totalBudgetCap > 0 ? (
          <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Budget Limit</span>
                <p className="text-lg font-bold text-white mt-0.5">
                  {formatCurrency(totalBudgetCap, currencySymbol)}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Actual Outflow</span>
                <p className="text-lg font-bold text-rose-400 mt-0.5">
                  {formatCurrency(totalExpense, currencySymbol)}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Remaining Cushion</span>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    overallRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(overallRemaining, currencySymbol)}
                </p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">Overall Budget Consumption</span>
                <span
                  className={
                    overallUsage > 100
                      ? 'text-rose-400'
                      : overallUsage > 80
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {overallUsage.toFixed(1)}% Used
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallUsage > 100
                      ? 'bg-rose-500'
                      : overallUsage > 80
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, overallUsage)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-3">
              You haven't set a budget ceiling for {monthLabel} yet.
            </p>
            <button
              onClick={onOpenBudgetModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
            >
              + Configure Monthly Limit
            </button>
          </div>
        )}
      </div>

      {/* Category Budgets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-white">Category-Specific Budget Tracking</h4>
          <span className="text-xs text-slate-400">
            {Object.keys(categoryBudgets).length} categories with specific caps
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeExpenseCategories.map((cat) => {
            const meta = CATEGORY_METADATA[cat];
            const Icon = meta?.icon || Sparkles;
            const spent = catExpenseMap[cat] || 0;
            const limit = categoryBudgets[cat] || 0;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            const remaining = limit - spent;

            if (limit === 0 && spent === 0) return null;

            return (
              <div
                key={cat}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
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
                    <div>
                      <h5 className="text-sm font-semibold text-white">{meta?.label || cat}</h5>
                      <span className="text-xs text-slate-400">
                        {limit > 0 ? `Limit: ${formatCurrency(limit, currencySymbol)}` : 'No Cap Configured'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {formatCurrency(spent, currencySymbol)}
                    </p>
                    {limit > 0 && (
                      <span
                        className={`text-[11px] font-semibold ${
                          remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {remaining >= 0 ? `${formatCurrency(remaining, currencySymbol)} left` : 'Over limit'}
                      </span>
                    )}
                  </div>
                </div>

                {limit > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>{percent.toFixed(0)}% used</span>
                      <span>
                        {spent >= limit ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle size={12} /> Over budget
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} /> On track
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent > 100
                            ? 'bg-rose-500'
                            : percent > 80
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
