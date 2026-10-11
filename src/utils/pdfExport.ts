import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransactionItem } from '../types/finance';
import { formatCurrency, formatDate, CATEGORY_METADATA, PAYMENT_METHOD_LABELS } from './formatters';

export function generatePdfStatement(
  transactions: TransactionItem[],
  periodTitle: string,
  userName: string,
  currencySymbol = '₹'
): void {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PAISA', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Personal Financial Statement & Record', 14, 28);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Account Holder: ${userName}`, 200, 18, { align: 'right' });
  doc.text(`Period: ${periodTitle}`, 200, 26, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 200, 34, { align: 'right' });

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Financial Summary Cards
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 46, 182, 30, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // slate-500

  doc.text('TOTAL INCOME', 22, 54);
  doc.text('TOTAL EXPENSE', 68, 54);
  doc.text('NET SAVINGS', 114, 54);
  doc.text('SAVINGS RATE', 160, 54);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');

  // Income
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(formatCurrency(totalIncome, currencySymbol), 22, 64);

  // Expense
  doc.setTextColor(239, 68, 68); // red-500
  doc.text(formatCurrency(totalExpense, currencySymbol), 68, 64);

  // Net Savings
  doc.setTextColor(netSavings >= 0 ? 16 : 239, netSavings >= 0 ? 185 : 68, netSavings >= 0 ? 129 : 68);
  doc.text(formatCurrency(netSavings, currencySymbol), 114, 64);

  // Savings Rate
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`${savingsRate.toFixed(1)}%`, 160, 64);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`${transactions.length} Total Transactions Recorded`, 22, 72);

  // Transaction Table Data
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  const rows = sorted.map(t => {
    const cat = CATEGORY_METADATA[t.category]?.label || t.category;
    const method = PAYMENT_METHOD_LABELS[t.paymentMethod] || t.paymentMethod;
    const isInc = t.type === 'INCOME';
    const amountStr = `${isInc ? '+' : '-'}${formatCurrency(t.amount, currencySymbol)}`;
    return [
      formatDate(t.timestamp, 'short'),
      t.title,
      cat,
      method,
      t.type,
      amountStr
    ];
  });

  autoTable(doc, {
    startY: 84,
    head: [['Date', 'Description', 'Category', 'Payment Method', 'Type', 'Amount']],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 55 },
      2: { cellWidth: 38 },
      3: { cellWidth: 32 },
      4: { cellWidth: 18 },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    }
  });

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Paisa Tracker • Page ${i} of ${pageCount} • Zero Telemetry & Private`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Trigger download
  doc.save(`Paisa_Statement_${periodTitle.replace(/\s+/g, '_')}.pdf`);
}
