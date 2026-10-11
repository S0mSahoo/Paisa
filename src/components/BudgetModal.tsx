import React, { useState, useEffect } from 'react';
import { BudgetModel, TransactionCategory } from '../types/finance';
import { CATEGORY_METADATA, formatCurrency } from '../utils/formatters';
import { X, Check, PiggyBank } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (totalBudget: number, categoryBudgets: Record<string, number>) => void;
  currentBudget?: BudgetModel | null;
  currencySymbol: string;
  monthLabel: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentBudget,
  currencySymbol,
  monthLabel
}) => {
  const [total, setTotal] = useState('');
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>({});

  const expenseCategories = Object.entries(CATEGORY_METADATA)
    .filter(([_, meta]) => meta.type === 'EXPENSE')
    .map(([k]) => k as TransactionCategory);

  useEffect(() => {
    if (currentBudget) {
      setTotal(currentBudget.totalBudget.toString());
      const dict: Record<string, string> = {};
      Object.entries(currentBudget.categoryBudgets).forEach(([k, v]) => {
        dict[k] = v.toString();
      });
      setCatBudgets(dict);
    } else {
      setTotal('45000');
      setCatBudgets({});
    }
  }, [currentBudget, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = parseFloat(total) || 0;
    const finalCats: Record<string, number> = {};
    Object.entries(catBudgets).forEach(([k, v]) => {
      const parsed = parseFloat(v);
      if (!isNaN(parsed) && parsed > 0) {
        finalCats[k] = parsed;
      }
    });

    onSave(numTotal, finalCats);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <PiggyBank size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Monthly Budget Settings</h2>
              <p className="text-[11px] text-slate-400">{monthLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Total Overall Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Overall Monthly Budget Cap
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                required
                min="0"
                placeholder="45000"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Your maximum intended monthly spending ceiling.
            </p>
          </div>

          {/* Category Budgets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Category Limits (Optional)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {expenseCategories.map((cat) => {
                const meta = CATEGORY_METADATA[cat];
                const Icon = meta.icon;
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="p-1.5 rounded-md"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="text-xs font-medium text-slate-300 truncate">
                        {meta.label}
                      </span>
                    </div>
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={catBudgets[cat] || ''}
                        onChange={(e) =>
                          setCatBudgets({ ...catBudgets, [cat]: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-2 py-1 text-xs text-right text-white font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Save Budget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
