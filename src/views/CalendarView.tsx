import React, { useState } from 'react';
import { TransactionItem } from '../types/finance';
import { formatCurrency, formatDate, CATEGORY_METADATA, PAYMENT_METHOD_LABELS } from '../utils/formatters';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CalendarViewProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  transactions: TransactionItem[];
  currencySymbol: string;
  onOpenAddTransactionForDate: (date: Date) => void;
  onSelectTransaction: (tx: TransactionItem) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  transactions,
  currencySymbol,
  onOpenAddTransactionForDate,
  onSelectTransaction
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month & total days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Group transactions by day of month
  const dayTxMap: Record<number, TransactionItem[]> = {};
  for (let i = 1; i <= totalDaysInMonth; i++) {
    dayTxMap[i] = [];
  }

  transactions.forEach((tx) => {
    const d = new Date(tx.timestamp);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (dayTxMap[day]) {
        dayTxMap[day].push(tx);
      }
    }
  });

  // Calendar cells
  const calendarCells: {
    day: number;
    isCurrentMonth: boolean;
    date: Date;
    txs: TransactionItem[];
  }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(year, month - 1, d),
      txs: []
    });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
      txs: dayTxMap[i] || []
    });
  }

  // Next month leading days to complete grid
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
      txs: []
    });
  }

  const selectedDayTransactions = dayTxMap[selectedDay] || [];
  const selectedDayDate = new Date(year, month, selectedDay);

  const selectedDayIncome = selectedDayTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((s, t) => s + t.amount, 0);

  const selectedDayExpense = selectedDayTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Calendar Grid */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Expense Calendar</h3>
              <p className="text-xs text-slate-400">
                Click any day to inspect transactions or log new entries
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={onNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-[11px] font-bold text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={idx}
                    className="min-h-[76px] p-2 rounded-xl bg-slate-950/30 border border-slate-900/50 opacity-30 flex flex-col justify-between"
                  >
                    <span className="text-[11px] text-slate-600 font-medium">{cell.day}</span>
                  </div>
                );
              }

              const isSelected = selectedDay === cell.day;
              const hasTxs = cell.txs.length > 0;
              const dayExp = cell.txs
                .filter((t) => t.type === 'EXPENSE')
                .reduce((s, t) => s + t.amount, 0);
              const dayInc = cell.txs
                .filter((t) => t.type === 'INCOME')
                .reduce((s, t) => s + t.amount, 0);

              const isToday =
                new Date().getDate() === cell.day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(cell.day)}
                  className={`min-h-[76px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center'
                          : isSelected
                          ? 'text-emerald-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {hasTxs && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    )}
                  </div>

                  <div className="space-y-0.5 mt-1">
                    {dayExp > 0 && (
                      <div className="text-[10px] font-bold text-rose-400 truncate">
                        -{formatCurrency(dayExp, currencySymbol)}
                      </div>
                    )}
                    {dayInc > 0 && (
                      <div className="text-[10px] font-bold text-emerald-400 truncate">
                        +{formatCurrency(dayInc, currencySymbol)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Day Details */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">
                  {formatDate(selectedDayDate.getTime(), 'full')}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedDayTransactions.length} items logged
                </p>
              </div>
              <button
                onClick={() => onOpenAddTransactionForDate(selectedDayDate)}
                className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition text-xs font-bold flex items-center gap-1"
                title="Add for this day"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>

            {/* Day Financial Mini Summary */}
            <div className="grid grid-cols-2 gap-2 my-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Day Income</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {formatCurrency(selectedDayIncome, currencySymbol)}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Day Spent</span>
                <p className="text-sm font-bold text-rose-400 mt-0.5">
                  {formatCurrency(selectedDayExpense, currencySymbol)}
                </p>
              </div>
            </div>

            {/* List of items on this day */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedDayTransactions.length > 0 ? (
                selectedDayTransactions.map((tx) => {
                  const meta = CATEGORY_METADATA[tx.category];
                  const Icon = meta?.icon || Sparkles;
                  const isInc = tx.type === 'INCOME';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${meta?.color || '#10b981'}20`,
                            color: meta?.color || '#10b981'
                          }}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{tx.title}</p>
                          <p className="text-[10px] text-slate-400">{meta?.label}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            isInc ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {isInc ? '+' : '-'}
                          {formatCurrency(tx.amount, currencySymbol)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No records on this date.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onOpenAddTransactionForDate(selectedDayDate)}
            className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Transaction for {cellMonthDayString(selectedDayDate)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function cellMonthDayString(d: Date): string {
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
