import React, { useState, useEffect } from 'react';
import { TransactionItem, TransactionType, TransactionCategory, PaymentMethod } from '../types/finance';
import { CATEGORY_METADATA, PAYMENT_METHOD_LABELS } from '../utils/formatters';
import { X, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, Tag, CreditCard, AlignLeft, Check } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<TransactionItem, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  editTransaction?: TransactionItem | null;
  currencySymbol: string;
  defaultDate?: Date;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editTransaction,
  currencySymbol,
  defaultDate
}) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('FOOD_DINING');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [dateStr, setDateStr] = useState('');
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setTitle(editTransaction.title);
      setAmount(editTransaction.amount.toString());
      setCategory(editTransaction.category);
      setPaymentMethod(editTransaction.paymentMethod);
      setNote(editTransaction.note || '');
      setIsRecurring(!!editTransaction.isRecurring);
      const d = new Date(editTransaction.timestamp);
      setDateStr(d.toISOString().slice(0, 10));
    } else {
      setType('EXPENSE');
      setTitle('');
      setAmount('');
      setCategory('FOOD_DINING');
      setPaymentMethod('UPI');
      setNote('');
      setIsRecurring(false);
      const targetDate = defaultDate || new Date();
      setDateStr(targetDate.toISOString().slice(0, 10));
    }
  }, [editTransaction, isOpen, defaultDate]);

  if (!isOpen) return null;

  // Filter categories by type
  const availableCategories = Object.entries(CATEGORY_METADATA)
    .filter(([_, meta]) => meta.type === type)
    .map(([cat]) => cat as TransactionCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 12, 0, 0);

    onSave(
      {
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        timestamp: selectedDate.getTime(),
        paymentMethod,
        note: note.trim(),
        isRecurring
      },
      editTransaction ? editTransaction.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {editTransaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Income vs Expense Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategory('FOOD_DINING');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition ${
                type === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight size={16} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategory('SALARY');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition ${
                type === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight size={16} />
              <span>Income</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Title / Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Groceries at Supermarket, Client Invoice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              {availableCategories.map((cat) => {
                const meta = CATEGORY_METADATA[cat];
                const Icon = meta.icon;
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium transition ${
                      isSelected
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                    }`}
                  >
                    <span
                      className="p-1 rounded-md"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Note (Optional)</label>
            <input
              type="text"
              placeholder="Add extra context or reference..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Action Buttons */}
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
              <span>{editTransaction ? 'Save Changes' : 'Add Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
