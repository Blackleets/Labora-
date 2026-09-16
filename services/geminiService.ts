import { ExpenseCategory } from '../types';
import { CountryConfig } from '../modules/country-config/types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';

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

const getAccessToken = async (): Promise<string> => {
  if (!isSupabaseConfigured()) {
    throw new LaboraAIUnavailableError('El backend seguro de Labora+ todavía no está configurado.');
  }

  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw new LaboraAIUnavailableError('No se pudo validar tu sesión para usar la IA.');
  const token = data.session?.access_token;
  if (!token) throw new LaboraAIUnavailableError('Inicia sesión para usar la IA segura de Labora+.');
  return token;
};

async function callSecureAI<T>(action: AIAction, payload: Record<string, unknown>): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${getApiUrl()}/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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
 * Fiscal assistant. Spain 2026 is the only fiscal policy currently verified.
 * Missing/unsupported country context must fail closed instead of silently
 * inheriting Spanish tax guidance.
 */
export const getFiscalAdvice = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  countryConfig?: CountryConfig,
): Promise<string> => {
  if (!newMessage.trim()) throw new Error('Escribe una consulta fiscal.');
  const countryCode = countryConfig?.country_code?.trim().toUpperCase();
  if (!countryCode) {
    throw new LaboraAIUnavailableError('Selecciona tu país antes de usar el asistente fiscal.');
  }
  if (countryCode !== 'ES') {
    throw new LaboraAIUnavailableError('El asistente fiscal verificado está disponible actualmente solo para España. Puedes seguir usando Labora+ para control financiero, evidencias y asesoría humana.');
  }

  const result = await callSecureAI<{ text: string }>('fiscal_advice', {
    history,
    newMessage,
    countryCode,
    fiscalPolicyVersion: 'es-2026-v1',
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
