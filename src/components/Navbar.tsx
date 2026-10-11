import React from 'react';
import { ChevronLeft, ChevronRight, Plus, FileDown } from 'lucide-react';
import { getMonthLabel } from '../utils/formatters';

interface NavbarProps {
  currentDate: Date;
  onPrevMonth: () => Unit;
  onNextMonth: () => Unit;
  onCurrentMonth: () => Unit;
  onOpenAddTransaction: () => Unit;
  onOpenExportPdf: () => Unit;
  userName: string;
}

type Unit = void;

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onOpenAddTransaction,
  onOpenExportPdf,
  userName
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Sync badge */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  ₹
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-['Outfit']">Paisa</h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Local &amp; Private
                </span>
              </div>
              <p className="text-xs text-slate-400">Personal Income &amp; Expense Manager</p>
            </div>
          </div>

          {/* Mobile quick add button */}
          <button
            onClick={onOpenAddTransaction}
            className="sm:hidden p-2 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition"
            title="Add Transaction"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Date Month Selector */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={onCurrentMonth}
            className="px-3 py-1 text-sm font-semibold text-slate-200 hover:text-emerald-400 transition min-w-[140px] text-center"
          >
            {getMonthLabel(currentDate)}
          </button>

          <button
            onClick={onNextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            onClick={onOpenExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition shadow-sm"
          >
            <FileDown size={15} className="text-emerald-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
};
