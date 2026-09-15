export const exportService = {
  generatePayoutsCSV: async (userId: string, countryCode: string) => {
    // Simular fetch de datos enriquecidos del backend
    // En una app real, esto llamaría a GET /users/{id}/payouts/export
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Latency

    const mockData = Array.from({ length: 10 }).map((_, i) => ({
      trip_id: `trip_${Math.random().toString(36).substr(2, 6)}`,
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      gross: (15 + Math.random() * 20).toFixed(2),
      commission: (3 + Math.random() * 5).toFixed(2),
      fees: (0.50).toFixed(2),
      taxes: (1.20 + Math.random()).toFixed(2),
      payout: (10 + Math.random() * 15).toFixed(2),
      currency: countryCode === 'MX' ? 'MXN' : 'EUR'
    }));

    const headers = ['trip_id', 'date', 'gross', 'commission', 'fees', 'taxes', 'payout', 'currency'];
    const rows = mockData.map(row => headers.map(h => row[h as keyof typeof row]).join(','));
    
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