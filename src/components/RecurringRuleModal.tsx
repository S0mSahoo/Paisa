import React, { useState, useEffect } from 'react';
import { RecurringRule, TransactionType, TransactionCategory, RecurrenceInterval, PaymentMethod } from '../types/finance';
import { CATEGORY_METADATA, PAYMENT_METHOD_LABELS, RECURRENCE_LABELS } from '../utils/formatters';
import { X, Check, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RecurringRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<RecurringRule, 'id' | 'createdAt'>, editId?: string) => void;
  editRule?: RecurringRule | null;
  currencySymbol: string;
}

export const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editRule,
  currencySymbol
}) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('HOUSING');
  const [interval, setInterval] = useState<RecurrenceInterval>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [startDateStr, setStartDateStr] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editRule) {
      setType(editRule.type);
      setTitle(editRule.title);
      setAmount(editRule.amount.toString());
      setCategory(editRule.category);
      setInterval(editRule.interval);
      setPaymentMethod(editRule.paymentMethod);
      setNote(editRule.note || '');
      const d = new Date(editRule.startDate);
      setStartDateStr(d.toISOString().slice(0, 10));
    } else {
      setType('EXPENSE');
      setTitle('');
      setAmount('');
      setCategory('HOUSING');
      setInterval('MONTHLY');
      setPaymentMethod('UPI');
      setNote('');
      setStartDateStr(new Date().toISOString().slice(0, 10));
    }
  }, [editRule, isOpen]);

  if (!isOpen) return null;

  const availableCategories = Object.entries(CATEGORY_METADATA)
    .filter(([_, meta]) => meta.type === type)
    .map(([cat]) => cat as TransactionCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const [year, month, day] = startDateStr.split('-').map(Number);
    const startTimestamp = new Date(year, month - 1, day, 12, 0, 0).getTime();

    onSave(
      {
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        interval,
        startDate: startTimestamp,
        paymentMethod,
        note: note.trim(),
        isActive: editRule ? editRule.isActive : true,
        lastGeneratedDate: editRule ? editRule.lastGeneratedDate : 0
      },
      editRule ? editRule.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <RefreshCw size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">
              {editRule ? 'Edit Recurring Rule' : 'New Recurring Rule'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategory('HOUSING');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                type === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight size={15} />
              <span>Recurring Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategory('SALARY');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                type === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight size={15} />
              <span>Recurring Income</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Rule Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Apartment Rent, Netflix, Salary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Repeat Frequency</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as RecurrenceInterval)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              >
                {Object.entries(RECURRENCE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_METADATA[cat]?.label || cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Starting Date</label>
              <input
                type="date"
                required
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
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

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Due on 5th of every month"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            />
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
              <span>{editRule ? 'Save Rule' : 'Create Rule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
