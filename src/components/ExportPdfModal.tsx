import React, { useState } from 'react';
import { TransactionItem } from '../types/finance';
import { generatePdfStatement } from '../utils/pdfExport';
import { X, FileDown, Calendar, CheckCircle2 } from 'lucide-react';
import { getMonthLabel, getMonthKey } from '../utils/formatters';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionItem[];
  currentDate: Date;
  userName: string;
  currencySymbol: string;
}

type ExportPeriod = 'MONTH' | 'YEAR' | 'CUSTOM' | 'ALL';

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  transactions,
  currentDate,
  userName,
  currencySymbol
}) => {
  const [period, setPeriod] = useState<ExportPeriod>('MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  if (!isOpen) return null;

  const currentMonthKey = getMonthKey(currentDate);
  const currentYear = currentDate.getFullYear();

  const handleExport = () => {
    let filtered: TransactionItem[] = [];
    let periodTitle = '';

    if (period === 'MONTH') {
      periodTitle = getMonthLabel(currentDate);
      filtered = transactions.filter(t => getMonthKey(new Date(t.timestamp)) === currentMonthKey);
    } else if (period === 'YEAR') {
      periodTitle = `Year ${currentYear}`;
      filtered = transactions.filter(t => new Date(t.timestamp).getFullYear() === currentYear);
    } else if (period === 'CUSTOM') {
      if (!customStart || !customEnd) return;
      const startMs = new Date(customStart).getTime();
      const endMs = new Date(customEnd).getTime() + 86400000;
      periodTitle = `${customStart} to ${customEnd}`;
      filtered = transactions.filter(t => t.timestamp >= startMs && t.timestamp <= endMs);
    } else {
      periodTitle = 'All-Time Records';
      filtered = [...transactions];
    }

    generatePdfStatement(filtered, periodTitle, userName, currencySymbol);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileDown size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">Export PDF Statement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Generate a clean, high-resolution PDF financial report complete with KPI summaries, category allocations, and itemized transaction tables.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Select Export Range</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'MONTH', label: `Month (${getMonthLabel(currentDate).split(' ')[0]})` },
                { id: 'YEAR', label: `Year ${currentYear}` },
                { id: 'CUSTOM', label: 'Custom Range' },
                { id: 'ALL', label: 'All Records' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeriod(opt.id as ExportPeriod)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                    period === opt.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{opt.label}</span>
                  {period === opt.id && <CheckCircle2 size={15} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {period === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20"
            >
              <FileDown size={16} strokeWidth={2.5} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
