import { ExpenseCategory } from '../types';
import { CountryConfig } from '../modules/country-config/types';

export class LaboraAIUnavailableError extends Error {
  constructor(message = 'El servicio de IA segura de Labora+ no está configurado o no tiene una sesión válida.') {
    super(message);
    this.name = 'LaboraAIUnavailableError';
  }
}

type AIAction = 'receipt_ocr' | 'fiscal_advice' | 'income_extract' | 'retention_explain';

const getApiUrl = (): string => {
  const baseUrl = (import.meta.env.VITE_LABORA_API_URL as string | undefined)?.trim();
  if (!baseUrl) throw new LaboraAIUnavailableError();
  return baseUrl.replace(/\/$/, '');
};

const getAccessToken = (): string => {
  // Temporary bridge until Supabase Auth is wired on this branch.
  // Never place service-role/API secrets in Vite env or localStorage.
  const token = localStorage.getItem('labora_access_token');
  if (!token) throw new LaboraAIUnavailableError('Inicia sesión para usar la IA segura de Labora+.');
  return token;
};

async function callSecureAI<T>(action: AIAction, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${getApiUrl()}/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(errorBody?.error || `Error del servicio seguro (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export interface ReceiptAnalysis {
  merchantName: string;
  date: string;
  amount: number;
  category: ExpenseCategory | string;
  summary: string;
  confidence?: number;
  requiresManualReview?: boolean;
}

/**
 * Extracts receipt data through an authenticated server endpoint.
 * Truth invariant: this function never fabricates merchant, date or amount.
 */
export const analyzeReceipt = async (base64Image: string): Promise<ReceiptAnalysis> => {
  if (!base64Image?.trim()) throw new Error('No se recibió una imagen del ticket.');
  return callSecureAI<ReceiptAnalysis>('receipt_ocr', { base64Image });
};

/**
 * Fiscal assistant. The server is responsible for grounding the answer in
 * versioned fiscal rules and official sources. The browser contains no tax
 * fallback that can masquerade as verified advice.
 */
export const getFiscalAdvice = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  countryConfig?: CountryConfig,
): Promise<string> => {
  if (!newMessage.trim()) throw new Error('Escribe una consulta fiscal.');
  const result = await callSecureAI<{ text: string }>('fiscal_advice', {
    history,
    newMessage,
    countryCode: countryConfig?.country_code || 'ES',
  });
  return result.text;
};

/**
 * Extracts platform income only when evidence is present.
 * No AI/backend means no inferred income rows.
 */
export const extractIncomeFromText = async (
  textData: string,
): Promise<{ platform: string; amount: number; date: string; retention: number }[]> => {
  if (!textData.trim()) return [];
  const result = await callSecureAI<{ incomes: { platform: string; amount: number; date: string; retention: number }[] }>(
    'income_extract',
    { textData },
  );
  return Array.isArray(result.incomes) ? result.incomes : [];
};

export const getRetentionExplanation = async (
  platform: string,
  amount: number,
  retention: number,
): Promise<string> => {
  const result = await callSecureAI<{ text: string }>('retention_explain', {
    platform,
    amount,
    retention,
  });
  return result.text;
};
