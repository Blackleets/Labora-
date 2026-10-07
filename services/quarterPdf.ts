/**
 * Versión PDF del pack trimestral para la gestoría. Mismos datos y cabeceras que el
 * CSV (`quarterExport.ts`): no añade cálculos fiscales ni cifras oficiales.
 * jsPDF se carga bajo demanda para no engordar el bundle inicial.
 */
import type { Expense, Income } from '../types';
import { exportFile } from './fileExport';
import {
  type CsvRow,
  type QuarterClientInfo,
  EXPENSE_HEADER,
  INCOME_HEADER,
  buildExpenseRows,
  buildIncomeRows,
  money,
  quarterExportFilename,
  quarterTotals
} from './quarterExport';

export interface QuarterPdfModel {
  title: string;
  meta: Array<[string, string]>;
  disclaimer: string;
  summary: Array<[string, string]>;
  expenses: { head: string[]; body: string[][] };
  incomes: { head: string[]; body: string[][] };
}

const cells = (row: CsvRow) => row.map((value) => (value === null || value === undefined ? '' : String(value)));
const pad = (value: number) => String(value).padStart(2, '0');

/** Modelo puro del PDF: metadatos, resumen y tablas de gastos/ingresos del trimestre. */
export const buildQuarterPdfModel = (
  client: QuarterClientInfo,
  quarter: string,
  expenses: Expense[],
  incomes: Income[],
  generatedAt: Date
): QuarterPdfModel => {
  const totals = quarterTotals(expenses, incomes, quarter);
  const stamp = `${generatedAt.getFullYear()}-${pad(generatedAt.getMonth() + 1)}-${pad(generatedAt.getDate())} ${pad(generatedAt.getHours())}:${pad(generatedAt.getMinutes())}`;
  const countAmount = (entry: { count: number; amount: number }) => `${entry.count} · ${money(entry.amount)} €`;
  return {
    title: `Exportación trimestral ${quarter}`,
    meta: [
      ['Cliente', client.name],
      ['NIF', client.nif || '—'],
      ['Email', client.email || '—'],
      ['Trimestre', quarter],
      ['Generado', stamp]
    ],
    disclaimer: 'Datos registrados en Labora+ por el autónomo y, en su caso, revisados por la gestoría. No es una autoliquidación ni un cálculo oficial.',
    summary: [
      ['Ingresos (nº)', String(totals.incomeCount)],
      ['Ingresos brutos', `${money(totals.incomeGross)} €`],
      ['Retenciones', `${money(totals.incomeRetention)} €`],
      ['Ingresos pendientes de revisión (nº)', String(totals.incomePendingReview)],
      ['Gastos (nº)', String(totals.expenseCount)],
      ['Gastos importe total', `${money(totals.expenseTotal)} €`],
      ['Cuota IVA registrada', `${money(totals.expenseVat)} €`],
      ['Gastos validados (nº · importe)', countAmount(totals.byStatus.approved)],
      ['Gastos pendientes (nº · importe)', countAmount(totals.byStatus.pending_review)],
      ['Gastos a corregir (nº · importe)', countAmount(totals.byStatus.needs_fix)],
      ['Gastos no deducibles (nº · importe)', countAmount(totals.byStatus.rejected)],
      ['Importe validado × % asignado', `${money(totals.approvedDeductibleAmount)} €`],
      ['Gastos sin justificante (nº)', String(totals.missingReceipt)]
    ],
    expenses: { head: cells(EXPENSE_HEADER), body: buildExpenseRows(expenses, quarter).slice(1).map(cells) },
    incomes: { head: cells(INCOME_HEADER), body: buildIncomeRows(incomes, quarter).slice(1).map(cells) }
  };
};

export const quarterPdfFilename = (quarter: string, clientName?: string) =>
  quarterExportFilename('trimestre', quarter, clientName).replace(/\.csv$/, '.pdf');

const INK: [number, number, number] = [30, 42, 36];
const MUTED: [number, number, number] = [110, 120, 114];
const PRIMARY: [number, number, number] = [45, 90, 67];

/** Genera el documento PDF (A4 apaisado). */
export const renderQuarterPdf = async (model: QuarterPdfModel) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const margin = 36;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text('LABORA+', margin, margin);
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(model.title, margin, margin + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let y = margin + 38;
  for (const [label, value] of model.meta) {
    doc.setTextColor(...MUTED);
    doc.text(`${label}:`, margin, y);
    doc.setTextColor(...INK);
    doc.text(value, margin + 62, y);
    y += 12;
  }
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const disclaimer = doc.splitTextToSize(model.disclaimer, pageWidth - margin * 2);
  doc.text(disclaimer, margin, y + 4);
  y += 8 + disclaimer.length * 10;

  const tableDefaults = {
    margin: { left: margin, right: margin, bottom: 40 },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 3, textColor: INK, overflow: 'linebreak' as const },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: [246, 244, 239] as [number, number, number] }
  };
  const lastY = () => ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y);
  const sectionTitle = (text: string, at: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(text, margin, at);
    doc.setFont('helvetica', 'normal');
  };

  sectionTitle('Resumen', y + 8);
  autoTable(doc, { ...tableDefaults, startY: y + 14, body: model.summary, tableWidth: 380, columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } } });

  sectionTitle(`Gastos (${model.expenses.body.length})`, lastY() + 22);
  autoTable(doc, {
    ...tableDefaults,
    startY: lastY() + 28,
    head: [model.expenses.head],
    body: model.expenses.body.length ? model.expenses.body : [[{ content: 'Sin gastos en el trimestre.', colSpan: model.expenses.head.length }]],
    columnStyles: { 4: { halign: 'right' }, 6: { halign: 'right' } }
  });

  sectionTitle(`Ingresos (${model.incomes.body.length})`, lastY() + 22);
  autoTable(doc, {
    ...tableDefaults,
    startY: lastY() + 28,
    head: [model.incomes.head],
    body: model.incomes.body.length ? model.incomes.body : [[{ content: 'Sin ingresos en el trimestre.', colSpan: model.incomes.head.length }]],
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    const height = doc.internal.pageSize.getHeight();
    doc.text(`${model.title} · ${model.meta[0]?.[1] || ''}`, margin, height - 20);
    doc.text(`Página ${page} de ${pages}`, pageWidth - margin, height - 20, { align: 'right' });
  }
  return doc;
};

/** Generates identical PDF bytes for web and native Save As. */
export const downloadQuarterPdf = async (model: QuarterPdfModel, filename: string) => {
  const doc = await renderQuarterPdf(model);
  return exportFile(filename, doc.output('blob'));
};
