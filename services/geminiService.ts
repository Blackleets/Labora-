import { ExpenseCategory } from '../types';
import { CountryConfig } from '../modules/country-config/types';
import { supabase } from './supabaseClient';

export type ReceiptAnalysis = {
  merchantName: string;
  date: string;
  amount: number;
  category: string;
  summary: string;
  confidence: number;
  needsReview: boolean;
  uncertainFields: string[];
};

type AIAction =
  | 'analyze_receipt'
  | 'fiscal_advice'
  | 'extract_income_text'
  | 'extract_income_document'
  | 'retention_explanation';

const invokeAI = async <T>(action: AIAction, payload: Record<string, unknown> = {}): Promise<T> => {
  const { data, error } = await supabase.functions.invoke('labora-ai', {
    body: { action, ...payload }
  });

  if (error) {
    let code = 'AI_REQUEST_FAILED';
    const context = (error as any)?.context;
    if (typeof Response !== 'undefined' && context instanceof Response) {
      try {
        const responsePayload = await context.clone().json();
        if (responsePayload?.code) code = String(responsePayload.code);
      } catch {
        // Preserve the generic code when the Edge Function did not return JSON.
      }
    }
    throw new Error(code);
  }

  if (data?.error) {
    throw new Error(String(data.code || 'AI_REQUEST_FAILED'));
  }

  return data?.result as T;
};

export const analyzeReceipt = async (
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<ReceiptAnalysis> => {
  if (!base64Image) throw new Error('OCR_EMPTY_IMAGE');

  const result = await invokeAI<ReceiptAnalysis>('analyze_receipt', {
    base64Data: base64Image,
    mimeType
  });

  const confidence = Math.max(0, Math.min(1, Number(result?.confidence || 0)));
  const merchantName = String(result?.merchantName || '').trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(result?.date || ''))
    ? String(result.date)
    : '';
  const amount = Number(result?.amount || 0);
  const uncertainFields = Array.isArray(result?.uncertainFields)
    ? result.uncertainFields.map(String)
    : [];
  const category = Object.values(ExpenseCategory).includes(result?.category as ExpenseCategory)
    ? result.category
    : ExpenseCategory.OTROS;

  return {
    merchantName,
    date,
    amount: amount > 0 ? amount : 0,
    category,
    summary: String(result?.summary || '').trim(),
    confidence,
    needsReview: Boolean(
      result?.needsReview
      || confidence < 0.85
      || !merchantName
      || !date
      || amount <= 0
    ),
    uncertainFields
  };
};

export const getFiscalAdvice = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  countryConfig?: CountryConfig
): Promise<string> => {
  const countryName = countryConfig?.display_name || 'España';
  const taxEntity = countryConfig?.labor_advisor?.tax_entity_name || 'Hacienda (AEAT)';
  const fiscalQuestion = /\b(impuesto|irpf|iva|isr|tax|retenci[oó]n|declaraci[oó]n|modelo\s?\d|deducible|hacienda|aeat|sat|irs)\b/i.test(newMessage);

  if (fiscalQuestion && countryConfig?.knowledge.status !== 'verified') {
    return `La información fiscal de ${countryName} está en revisión documental. Puedo ayudarte a ordenar tus ingresos, gastos y preguntas para tu gestoría, pero no voy a darte tipos, modelos u obligaciones como si estuvieran verificados.`;
  }

  try {
    return await invokeAI<string>('fiscal_advice', {
      history,
      message: newMessage,
      countryName,
      taxEntity,
      knowledgeStatus: countryConfig?.knowledge.status || 'identity_only',
      officialSources: countryConfig?.knowledge.sources || []
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'AI_REQUEST_FAILED';
    console.error('[LABORA_FISCAL_AI_FAILED]', code);

    if (code === 'AI_NOT_CONFIGURED') {
      return `Puedo ayudarte a organizar la pregunta y los datos para tu gestoría en ${countryName}, pero el asistente fiscal IA no está configurado ahora mismo. No generaré una respuesta fiscal inventada.`;
    }

    return 'No he podido consultar el asistente fiscal en este momento. Revisa el dato con tu gestoría antes de tomar una decisión fiscal.';
  }
};

export const extractIncomeFromText = async (
  textData: string
): Promise<{ platform: string; amount: number; date: string; retention: number }[]> => {
  const rows = await invokeAI<any[]>('extract_income_text', { textData });
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      platform: String(row?.platform || '').trim(),
      amount: Number(row?.amount || 0),
      date: String(row?.date || ''),
      retention: Number(row?.retention || 0)
    }))
    .filter((row) =>
      Boolean(row.platform)
      && row.amount > 0
      && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
      && row.retention >= 0
    );
};

export const extractIncomeFromDocument = async (
  base64Data: string,
  mimeType: string
): Promise<{ platform: string; amount: number; date: string; retention: number }[]> => {
  const supportedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]);
  if (!supportedMimeTypes.has(mimeType)) throw new Error('INCOME_DOCUMENT_UNSUPPORTED');
  if (!base64Data) throw new Error('INCOME_EXTRACTION_EMPTY_DOCUMENT');

  const rows = await invokeAI<any[]>('extract_income_document', {
    base64Data,
    mimeType
  });
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      platform: String(row?.platform || '').trim(),
      amount: Number(row?.amount || 0),
      date: String(row?.date || ''),
      retention: Number(row?.retention || 0)
    }))
    .filter((row) =>
      Boolean(row.platform)
      && row.amount > 0
      && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
      && row.retention >= 0
    );
};

export const getRetentionExplanation = async (
  platform: string,
  amount: number,
  retention: number
): Promise<string> => {
  try {
    return await invokeAI<string>('retention_explanation', {
      platform,
      amount,
      retention
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'AI_REQUEST_FAILED';
    console.error('[LABORA_RETENTION_AI_FAILED]', code);
    return code === 'AI_NOT_CONFIGURED'
      ? 'No se puede explicar automáticamente la retención porque el asistente IA no está configurado.'
      : 'No se ha podido explicar la retención automáticamente.';
  }
};
