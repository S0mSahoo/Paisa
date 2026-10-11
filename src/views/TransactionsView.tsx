import React, { useState } from 'react';
import { TransactionItem, TransactionType, TransactionCategory } from '../types/finance';
import { formatCurrency, formatDate, CATEGORY_METADATA, PAYMENT_METHOD_LABELS } from '../utils/formatters';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: TransactionItem[];
  currencySymbol: string;
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: TransactionItem) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  currencySymbol,
  onOpenAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Filter & Search logic
  const filtered = transactions.filter((tx) => {
    // Search query matching title, note, amount, category
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchNote = tx.note ? tx.note.toLowerCase().includes(q) : false;
      const matchCat = (CATEGORY_METADATA[tx.category]?.label || tx.category).toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      if (!matchTitle && !matchNote && !matchCat && !matchAmount) return false;
    }

    // Type filter
    if (filterType !== 'ALL' && tx.type !== filterType) return false;

    // Category filter
    if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date_desc') return b.timestamp - a.timestamp;
    if (sortBy === 'date_asc') return a.timestamp - b.timestamp;
    if (sortBy === 'amount_desc') return b.amount - a.amount;
    if (sortBy === 'amount_asc') return a.amount - b.amount;
    return 0;
  });

  const totalFilteredIncome = sorted
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + t.amount, 0);

  const totalFilteredExpense = sorted
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Search & Filter Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, category, note or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            onClick={onOpenAddTransaction}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Filter chips & Sort dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['ALL', 'EXPENSE', 'INCOME'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    filterType === t
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : t === 'EXPENSE' ? 'Expenses' : 'Incomes'}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(CATEGORY_METADATA).map(([k, meta]) => (
                <option key={k} value={k}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="date_desc">Latest Date First</option>
              <option value="date_asc">Oldest Date First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary of Filtered Results */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-slate-400 font-medium">
        <span>Showing {sorted.length} transaction records</span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 font-bold">
            +{formatCurrency(totalFilteredIncome, currencySymbol)}
          </span>
          <span className="text-rose-400 font-bold">
            -{formatCurrency(totalFilteredExpense, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Transaction Table / List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {sorted.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {sorted.map((tx) => {
              const meta = CATEGORY_METADATA[tx.category];
              const Icon = meta?.icon || Sparkles;
              const isIncome = tx.type === 'INCOME';

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition group"
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
                        <p className="text-sm font-semibold text-white truncate">{tx.title}</p>
                        {tx.isRecurring && (
                          <span
                            className="p-1 rounded-md bg-indigo-500/20 text-indigo-400"
                            title="Recurring Transaction"
                          >
                            <RefreshCw size={11} />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="font-medium text-slate-300">
                          {meta?.label || tx.category}
                        </span>
                        <span>•</span>
                        <span>{formatDate(tx.timestamp, 'full')}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-slate-950 rounded-md border border-slate-800 text-[10px]">
                          {PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod}
                        </span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-400 truncate max-w-[200px]">
                              "{tx.note}"
                            </span>
                          </>
                        )}
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
                        {formatCurrency(tx.amount, currencySymbol)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Record"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Record"
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
            <p className="text-xs text-slate-400 mb-3">No matching transactions found.</p>
            <button
              onClick={onOpenAddTransaction}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
            >
              + Add Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
