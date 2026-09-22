export interface PayoutExportRow {
  trip_id: string;
  date: string;
  gross: number;
  commission: number;
  fees: number;
  taxes: number;
  payout: number;
  currency: string;
}

const escapeCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export const exportService = {
  generatePayoutsCSV: async (_userId: string, _countryCode: string, data: PayoutExportRow[] = []) => {

    const headers = ['trip_id', 'date', 'gross', 'commission', 'fees', 'taxes', 'payout', 'currency'];
    const rows = data.map((row) => headers.map((header) => escapeCell(row[header as keyof PayoutExportRow])).join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    return blob;
  },

  downloadBlob: (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
