import React from 'react';
import { RecurringRule } from '../types/finance';
import { formatCurrency, formatDate, CATEGORY_METADATA, PAYMENT_METHOD_LABELS, RECURRENCE_LABELS } from '../utils/formatters';
import {
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

interface RecurringViewProps {
  recurringRules: RecurringRule[];
  currencySymbol: string;
  onOpenAddRule: () => void;
  onEditRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
  onToggleActive: (id: string) => void;
  onTriggerGenerateDue: () => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  recurringRules,
  currencySymbol,
  onOpenAddRule,
  onEditRule,
  onDeleteRule,
  onToggleActive,
  onTriggerGenerateDue
}) => {
  const activeRules = recurringRules.filter((r) => r.isActive);
  const monthlyRecurringExpense = activeRules
    .filter((r) => r.type === 'EXPENSE')
    .reduce((sum, r) => {
      if (r.interval === 'DAILY') return sum + r.amount * 30;
      if (r.interval === 'WEEKLY') return sum + r.amount * 4;
      if (r.interval === 'MONTHLY') return sum + r.amount;
      if (r.interval === 'YEARLY') return sum + r.amount / 12;
      return sum;
    }, 0);

  const monthlyRecurringIncome = activeRules
    .filter((r) => r.type === 'INCOME')
    .reduce((sum, r) => {
      if (r.interval === 'DAILY') return sum + r.amount * 30;
      if (r.interval === 'WEEKLY') return sum + r.amount * 4;
      if (r.interval === 'MONTHLY') return sum + r.amount;
      if (r.interval === 'YEARLY') return sum + r.amount / 12;
      return sum;
    }, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Fixed Monthly Outflow</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-['Outfit']">
              {formatCurrency(monthlyRecurringExpense, currencySymbol)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Rent, bills, subscriptions &amp; EMIs</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Fixed Monthly Inflow</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-['Outfit']">
              {formatCurrency(monthlyRecurringIncome, currencySymbol)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Salary, regular retainer &amp; rent</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Rules</span>
            <span className="text-xs font-bold text-emerald-400">
              {activeRules.length} of {recurringRules.length} enabled
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={onTriggerGenerateDue}
              className="w-full py-2 rounded-xl text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Play size={14} />
              <span>Process Due Rules</span>
            </button>
            <button
              onClick={onOpenAddRule}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shrink-0"
              title="Add Rule"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Recurring Rules Directory</h4>
            <p className="text-xs text-slate-400">
              Rules automatically post to your transactions list when due
            </p>
          </div>
          <button
            onClick={onOpenAddRule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Rule</span>
          </button>
        </div>

        {recurringRules.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {recurringRules.map((rule) => {
              const meta = CATEGORY_METADATA[rule.category];
              const Icon = meta?.icon || Sparkles;
              const isIncome = rule.type === 'INCOME';

              return (
                <div
                  key={rule.id}
                  className={`p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition ${
                    !rule.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        backgroundColor: `${meta?.color || '#10b981'}20`,
                        color: meta?.color || '#10b981'
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{rule.title}</p>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-950 border border-slate-800 rounded-md text-slate-300">
                          {RECURRENCE_LABELS[rule.interval]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="text-slate-300 font-medium">
                          {meta?.label || rule.category}
                        </span>
                        <span>•</span>
                        <span>Starts {formatDate(rule.startDate, 'short')}</span>
                        <span>•</span>
                        <span>{PAYMENT_METHOD_LABELS[rule.paymentMethod] || rule.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-base font-bold font-['Outfit'] ${
                          isIncome ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(rule.amount, currencySymbol)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Active toggle button */}
                      <button
                        onClick={() => onToggleActive(rule.id)}
                        className={`p-1.5 rounded-lg transition ${
                          rule.isActive
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-slate-500 hover:bg-slate-800'
                        }`}
                        title={rule.isActive ? 'Disable Rule' : 'Enable Rule'}
                      >
                        {rule.isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </button>

                      <button
                        onClick={() => onEditRule(rule)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Rule"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Rule"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xs text-slate-400 mb-3">No recurring rules configured.</p>
            <button
              onClick={onOpenAddRule}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
            >
              + Create Recurring Rule
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
