
export interface AuditRecord {
  id: string;
  timestamp: string;
  user_id: string;
  organization_id?: string;
  country_code: string;
  module: string;
  action: string;
  request_id?: string; // Entity ID or Request ID
  summary: string;     // Replaces input_summary
  hash?: string;       // Replaces output_hash
  details: any;
  status?: 'success' | 'failure' | 'warning';
}

const STORAGE_KEY = 'labora_audit_log';

export const auditService = {
  /**
   * Legacy wrapper for Pricing Engine
   */
  logCalculation: (userId: string, countryCode: string, input: any, output: any) => {
    auditService.logEvent({
      user_id: userId,
      country_code: countryCode,
      module: 'pricing_engine',
      action: 'calculate_fare',
      summary: `D:${input.distance_km}km T:${input.duration_min}min`,
      hash: btoa(JSON.stringify(output)).substr(0, 16),
      details: { input, output },
      status: 'success'
    });
  },

  /**
   * General purpose event logger
   */
  logEvent: (params: Omit<AuditRecord, 'id' | 'timestamp'>) => {
    const record: AuditRecord = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...params
    };

    const existing = auditService.getLogs();
    const updated = [record, ...existing].slice(0, 200); // Keep last 200
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.debug('[AUDIT]', record);
  },

  getLogs: (): AuditRecord[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  clearLogs: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
