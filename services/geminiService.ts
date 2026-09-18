import { GoogleGenAI, Type } from "@google/genai";
import { ExpenseCategory } from '../types';
import { CountryConfig } from '../modules/country-config/types';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = (typeof process !== 'undefined' && (process.env.API_KEY || process.env.GEMINI_API_KEY)) ||
                 (typeof import.meta !== 'undefined' && import.meta.env && ((import.meta.env as any).VITE_GEMINI_API_KEY || (import.meta.env as any).VITE_API_KEY));
  if (apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  }
  return null;
}

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

export const analyzeReceipt = async (base64Image: string, mimeType = 'image/jpeg'): Promise<ReceiptAnalysis> => {
  const ai = getAIClient();
  if (!ai) throw new Error('OCR_NOT_CONFIGURED');

  const categoryList = Object.values(ExpenseCategory).join(", ");
  const supportedMimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) ? mimeType : 'image/jpeg';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: supportedMimeType, data: base64Image } },
          {
            text: `Actúa exclusivamente como OCR contable. Analiza SOLO lo que sea visible en este ticket o factura y no inventes datos.

Devuelve:
- merchantName: nombre visible del comercio. Si no es legible, "".
- date: fecha visible en YYYY-MM-DD. Si no puede determinarse con seguridad, "".
- amount: total visible. Si no puede determinarse, 0.
- category: una de [${categoryList}]. Si no es posible clasificar, "Otros".
- summary: descripción breve basada únicamente en información visible.
- confidence: número entre 0 y 1 que represente confianza global en la extracción.
- needsReview: true si confidence < 0.85 o si merchantName/date/amount no son claros.
- uncertainFields: lista de campos dudosos entre merchantName, date, amount, category, summary.

Reglas estrictas:
1. No completes fechas con la fecha actual.
2. No estimes litros, IVA, NIF, matrícula ni ningún dato no visible.
3. No sustituyas un comercio ilegible por una marca conocida.
4. Un valor dudoso debe marcarse en uncertainFields.
5. Responde únicamente con JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: { type: Type.STRING },
            date: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: Object.values(ExpenseCategory) },
            summary: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            needsReview: { type: Type.BOOLEAN },
            uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["merchantName", "date", "amount", "category", "summary", "confidence", "needsReview", "uncertainFields"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('OCR_EMPTY_RESPONSE');
    const parsed = JSON.parse(text) as ReceiptAnalysis;
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence || 0)));
    const uncertainFields = Array.isArray(parsed.uncertainFields) ? parsed.uncertainFields : [];
    const merchantName = String(parsed.merchantName || '').trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(parsed.date || '')) ? String(parsed.date) : '';
    const amount = Number(parsed.amount || 0);
    const needsReview = Boolean(parsed.needsReview || confidence < 0.85 || !merchantName || !date || amount <= 0);

    return {
      merchantName,
      date,
      amount: amount > 0 ? amount : 0,
      category: Object.values(ExpenseCategory).includes(parsed.category as ExpenseCategory) ? parsed.category : ExpenseCategory.OTROS,
      summary: String(parsed.summary || '').trim(),
      confidence,
      needsReview,
      uncertainFields
    };
  } catch (error) {
    console.error('Receipt OCR failed:', error);
    throw new Error('OCR_FAILED');
  }
};

export const getFiscalAdvice = async (
  history: { role: 'user' | 'model', text: string }[],
  newMessage: string,
  countryConfig?: CountryConfig
): Promise<string> => {
  const ai = getAIClient();
  const countryName = countryConfig?.display_name || "España";
  const taxEntity = countryConfig?.labor_advisor?.tax_entity_name || "Hacienda (AEAT)";

  if (!ai) {
    return `Puedo ayudarte a organizar la pregunta y los datos para tu gestoría en ${countryName}, pero el asistente fiscal IA no está configurado ahora mismo. No generaré una respuesta fiscal inventada.`;
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `Eres el asistente informativo de Labora+ para autónomos y gestorías en ${countryName}. Ayuda a explicar conceptos fiscales relacionados con ${taxEntity}, pero no inventes normas, porcentajes, artículos legales ni hechos del usuario. Distingue claramente cálculos estimativos de presentaciones oficiales. Si una regla depende del caso concreto o no estás seguro, indícalo y pide que la gestoría la confirme. Sé conciso y profesional.`
      },
      history: history.map((item) => ({ role: item.role, parts: [{ text: item.text }] }))
    });
    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "No se ha obtenido respuesta del modelo.";
  } catch (error) {
    console.error("Error in fiscal chat:", error);
    return "No he podido consultar el asistente fiscal en este momento. Revisa el dato con tu gestoría antes de tomar una decisión fiscal.";
  }
};

export const extractIncomeFromText = async (textData: string): Promise<{ platform: string; amount: number; date: string; retention: number }[]> => {
  const ai = getAIClient();
  if (!ai) throw new Error('INCOME_EXTRACTION_NOT_CONFIGURED');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extrae únicamente ingresos explícitamente presentes en el siguiente texto. No inventes plataformas, importes, fechas ni retenciones. Si un campo no está presente, usa 0 para retención y omite cualquier fila cuyo importe o fecha no puedan determinarse.\n\nTexto: "${textData}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              retention: { type: Type.NUMBER }
            },
            required: ["platform", "amount", "date", "retention"]
          }
        }
      }
    });
    const text = response.text;
    if (!text) return [];
    const rows = JSON.parse(text) as { platform: string; amount: number; date: string; retention: number }[];
    return rows.filter((row) => row.platform && row.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(row.date));
  } catch (error) {
    console.error("Error parsing income text:", error);
    throw new Error('INCOME_EXTRACTION_FAILED');
  }
};

export const extractIncomeFromDocument = async (
  base64Data: string,
  mimeType: string
): Promise<{ platform: string; amount: number; date: string; retention: number }[]> => {
  const ai = getAIClient();
  if (!ai) throw new Error('INCOME_EXTRACTION_NOT_CONFIGURED');

  const supportedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
  if (!supportedMimeTypes.has(mimeType)) throw new Error('INCOME_DOCUMENT_UNSUPPORTED');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          {
            text: `Actúa exclusivamente como extractor de ingresos. Lee SOLO datos visibles en esta liquidación, factura, captura o PDF y no inventes nada.

Devuelve una fila únicamente cuando puedas determinar:
- platform: plataforma/pagador visible;
- amount: importe bruto o ingreso visible mayor que 0;
- date: fecha visible en formato YYYY-MM-DD;
- retention: retención explícitamente visible; si no aparece, 0.

Reglas estrictas:
1. No uses la fecha actual para completar fechas ausentes.
2. No deduzcas una plataforma por colores, logos dudosos o contexto externo.
3. No sumes importes salvo que el documento muestre claramente un total de ingresos.
4. Si fecha o importe no son legibles, omite esa fila.
5. No interpretes gastos, saldo de cartera o propinas separadas como ingresos adicionales si ya forman parte de un total.
6. Responde únicamente con JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              retention: { type: Type.NUMBER }
            },
            required: ["platform", "amount", "date", "retention"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    const rows = JSON.parse(text) as { platform: string; amount: number; date: string; retention: number }[];
    return rows.filter((row) =>
      Boolean(row.platform?.trim())
      && Number(row.amount) > 0
      && /^\d{4}-\d{2}-\d{2}$/.test(String(row.date || ''))
      && Number(row.retention || 0) >= 0
    );
  } catch (error) {
    console.error('Income document extraction failed:', error);
    throw new Error('INCOME_EXTRACTION_FAILED');
  }
};

export const getRetentionExplanation = async (platform: string, amount: number, retention: number): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return 'No se puede explicar automáticamente la retención porque el asistente IA no está configurado.';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Explica en una frase la retención mostrada en este registro, sin asumir que es correcta ni atribuirle una causa legal no visible. Plataforma: ${platform}; importe: ${amount}; retención: ${retention}. Si faltan datos para identificar la causa, dilo explícitamente.`
    });
    return response.text || "No hay información suficiente para explicar la retención.";
  } catch (error) {
    console.error("Error explaining retention:", error);
    return "No se ha podido explicar la retención automáticamente.";
  }
};
