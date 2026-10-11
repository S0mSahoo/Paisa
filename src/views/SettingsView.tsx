import React, { useState } from 'react';
import { UserProfile, TransactionItem, BudgetModel, RecurringRule } from '../types/finance';
import {
  User,
  FileDown,
  Upload,
  Download,
  Check,
  RotateCcw
} from 'lucide-react';
import { generateSampleData } from '../utils/storage';

interface SettingsViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  transactions: TransactionItem[];
  budgets: BudgetModel[];
  recurring: RecurringRule[];
  onImportData: (data: {
    transactions: TransactionItem[];
    budgets: BudgetModel[];
    recurring: RecurringRule[];
    userProfile: UserProfile;
  }) => void;
  onResetSampleData: () => void;
  onClearAllData: () => void;
  onOpenExportPdf: () => void;
}

const CURRENCIES = [
  { symbol: '₹', code: 'INR', label: 'Indian Rupee (₹ INR)' },
  { symbol: '$', code: 'USD', label: 'US Dollar ($ USD)' },
  { symbol: '€', code: 'EUR', label: 'Euro (€ EUR)' },
  { symbol: '£', code: 'GBP', label: 'British Pound (£ GBP)' },
  { symbol: '¥', code: 'JPY', label: 'Japanese Yen (¥ JPY)' },
  { symbol: 'A$', code: 'AUD', label: 'Australian Dollar (A$ AUD)' },
  { symbol: 'C$', code: 'CAD', label: 'Canadian Dollar (C$ CAD)' },
  { symbol: 'AED', code: 'AED', label: 'UAE Dirham (AED)' },
  { symbol: 'S$', code: 'SGD', label: 'Singapore Dollar (S$ SGD)' }
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onUpdateProfile,
  transactions,
  budgets,
  recurring,
  onImportData,
  onResetSampleData,
  onClearAllData,
  onOpenExportPdf
}) => {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [currencySymbol, setCurrencySymbol] = useState(userProfile.currencySymbol);
  const [currencyCode, setCurrencyCode] = useState(userProfile.currencyCode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name: name.trim() || 'Som Sahoo',
      email: email.trim(),
      currencySymbol,
      currencyCode
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCurrencyChange = (sym: string, code: string) => {
    setCurrencySymbol(sym);
    setCurrencyCode(code);
    onUpdateProfile({
      ...userProfile,
      currencySymbol: sym,
      currencyCode: code
    });
  };

  // Export JSON Backup
  const handleExportJson = () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userProfile,
      transactions,
      budgets,
      recurring
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paisa_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions && Array.isArray(data.transactions)) {
          onImportData({
            transactions: data.transactions,
            budgets: data.budgets || [],
            recurring: data.recurring || [],
            userProfile: data.userProfile || userProfile
          });
          alert('Backup restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* User Profile Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Account &amp; Profile</h3>
            <p className="text-xs text-slate-400">Configure your personal credentials and regional display</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Som Sahoo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email.somsahoo@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Currency</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCurrencyChange(c.symbol, c.code)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                    currencyCode === c.code
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{c.label}</span>
                  {currencyCode === c.code && <Check size={14} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check size={14} /> Preferences updated
              </span>
            ) : (
              <span></span>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
            <Download size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Data Management &amp; Backup</h3>
            <p className="text-xs text-slate-400">Export or restore your full financial database</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onOpenExportPdf}
            className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition space-y-2"
          >
            <FileDown size={20} className="text-emerald-400" />
            <h4 className="text-xs font-bold text-white">PDF Statement</h4>
            <p className="text-[11px] text-slate-400">Download formatted financial statement</p>
          </button>

          <button
            onClick={handleExportJson}
            className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition space-y-2"
          >
            <Download size={20} className="text-cyan-400" />
            <h4 className="text-xs font-bold text-white">Export JSON</h4>
            <p className="text-[11px] text-slate-400">Save offline copy of all raw database records</p>
          </button>

          <label className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition space-y-2 cursor-pointer block">
            <Upload size={20} className="text-indigo-400" />
            <h4 className="text-xs font-bold text-white">Restore JSON</h4>
            <p className="text-[11px] text-slate-400">Import records from existing backup file</p>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <RotateCcw size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Maintenance &amp; Reset</h3>
            <p className="text-xs text-slate-400">Reset default demo items or purge database</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
          <div>
            <h5 className="text-xs font-bold text-white">Restore Sample Transactions</h5>
            <p className="text-[11px] text-slate-400">
              Repopulate sample salary, groceries, rent, and budget targets.
            </p>
          </div>
          <button
            onClick={onResetSampleData}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition shrink-0"
          >
            Reset Demo Data
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/20 mt-3">
          <div>
            <h5 className="text-xs font-bold text-rose-400">Erase All Financial Records</h5>
            <p className="text-[11px] text-rose-300/80">
              Permanently delete all transactions, budgets, and recurring rules.
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to permanently erase all financial records?')) {
                onClearAllData();
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition shrink-0"
          >
            Erase Everything
          </button>
        </div>
      </div>
    </div>
  );
};
