import { GoogleGenAI, Type } from 'npm:@google/genai@1.30.0';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

const expenseCategories = [
  'Gasolina',
  'Mantenimiento',
  'Comida',
  'Móvil',
  'Cuota Autónomo',
  'Equipamiento',
  'Marketing',
  'Suscripciones Software',
  'Formación',
  'Peajes',
  'Impuestos No Reembolsables',
  'Seguros',
  'Otros'
] as const;

const approxDecodedBytes = (base64: string) =>
  Math.floor((base64.length * 3) / 4);

const getPublishableKey = () => {
  const direct = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  if (direct) return direct;

  const raw = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return parsed.default || '';
  } catch {
    return '';
  }
};

const requireUser = async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = getPublishableKey();

  if (!authHeader || !supabaseUrl || !publishableKey) return null;

  const client = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
};

const normalizeReceipt = (value: any) => {
  const confidence = Math.max(0, Math.min(1, Number(value?.confidence || 0)));
  const merchantName = String(value?.merchantName || '').trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value?.date || '')) ? String(value.date) : '';
  const amount = Number(value?.amount || 0);
  const uncertainFields = Array.isArray(value?.uncertainFields)
    ? value.uncertainFields.map((item: unknown) => String(item))
    : [];
  const category = expenseCategories.includes(value?.category)
    ? value.category
    : 'Otros';

  return {
    merchantName,
    date,
    amount: amount > 0 ? amount : 0,
    category,
    summary: String(value?.summary || '').trim(),
    confidence,
    needsReview: Boolean(value?.needsReview || confidence < 0.85 || !merchantName || !date || amount <= 0),
    uncertainFields
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);

  const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) return json({ error: 'AI is not configured on the server', code: 'AI_NOT_CONFIGURED' }, 503);

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > 16 * 1024 * 1024) {
    return json({ error: 'Request is too large', code: 'AI_PAYLOAD_TOO_LARGE' }, 413);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') {
    return json({ error: 'Invalid request', code: 'INVALID_REQUEST' }, 400);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    if (body.action === 'analyze_receipt') {
      const base64Data = String(body.base64Data || '');
      const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(body.mimeType)
        ? body.mimeType
        : 'image/jpeg';

      if (!base64Data || approxDecodedBytes(base64Data) > 10 * 1024 * 1024) {
        return json({ error: 'Receipt image is too large', code: 'AI_PAYLOAD_TOO_LARGE' }, 413);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            {
              text: `Actúa exclusivamente como OCR contable. Analiza SOLO lo que sea visible en este ticket o factura y no inventes datos.

Devuelve:
- merchantName: nombre visible del comercio. Si no es legible, "".
- date: fecha visible en YYYY-MM-DD. Si no puede determinarse con seguridad, "".
- amount: total visible. Si no puede determinarse, 0.
- category: una de [${expenseCategories.join(', ')}]. Si no es posible clasificar, "Otros".
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
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              merchantName: { type: Type.STRING },
              date: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING, enum: [...expenseCategories] },
              summary: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              needsReview: { type: Type.BOOLEAN },
              uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['merchantName', 'date', 'amount', 'category', 'summary', 'confidence', 'needsReview', 'uncertainFields']
          }
        }
      });

      if (!response.text) return json({ error: 'Empty AI response', code: 'AI_EMPTY_RESPONSE' }, 502);
      return json({ result: normalizeReceipt(JSON.parse(response.text)) });
    }

    if (body.action === 'fiscal_advice') {
      const history = Array.isArray(body.history)
        ? body.history.slice(-12).map((item: any) => ({
            role: item?.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(item?.text || '').slice(0, 4000) }]
          }))
        : [];
      const message = String(body.message || '').trim().slice(0, 6000);
      const countryName = String(body.countryName || 'España').slice(0, 120);
      const taxEntity = String(body.taxEntity || 'Hacienda (AEAT)').slice(0, 160);

      if (!message) return json({ error: 'Message is required', code: 'INVALID_REQUEST' }, 400);

      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `Eres el asistente informativo de Labora+ para autónomos y gestorías en ${countryName}. Ayuda a explicar conceptos fiscales relacionados con ${taxEntity}, pero no inventes normas, porcentajes, artículos legales ni hechos del usuario. Distingue claramente cálculos estimativos de presentaciones oficiales. Si una regla depende del caso concreto o no estás seguro, indícalo y pide que la gestoría la confirme. Sé conciso y profesional.`
        },
        history
      });
      const result = await chat.sendMessage({ message });
      return json({ result: result.text || 'No se ha obtenido respuesta del modelo.' });
    }

    if (body.action === 'extract_income_text') {
      const textData = String(body.textData || '').trim().slice(0, 20000);
      if (!textData) return json({ result: [] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extrae únicamente ingresos explícitamente presentes en el siguiente texto. No inventes plataformas, importes, fechas ni retenciones. Si un campo no está presente, usa 0 para retención y omite cualquier fila cuyo importe o fecha no puedan determinarse.

Texto: "${textData}"`,
        config: {
          responseMimeType: 'application/json',
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
              required: ['platform', 'amount', 'date', 'retention']
            }
          }
        }
      });

      const rows = response.text ? JSON.parse(response.text) : [];
      const result = Array.isArray(rows)
        ? rows.filter((row: any) =>
            Boolean(String(row?.platform || '').trim())
            && Number(row?.amount) > 0
            && /^\d{4}-\d{2}-\d{2}$/.test(String(row?.date || ''))
            && Number(row?.retention || 0) >= 0
          )
        : [];
      return json({ result });
    }

    if (body.action === 'extract_income_document') {
      const base64Data = String(body.base64Data || '');
      const mimeType = String(body.mimeType || '');
      const supported = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

      if (!supported.has(mimeType)) {
        return json({ error: 'Unsupported document type', code: 'INCOME_DOCUMENT_UNSUPPORTED' }, 400);
      }
      if (!base64Data || approxDecodedBytes(base64Data) > 10 * 1024 * 1024) {
        return json({ error: 'Document is too large for AI extraction', code: 'AI_PAYLOAD_TOO_LARGE' }, 413);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
          responseMimeType: 'application/json',
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
              required: ['platform', 'amount', 'date', 'retention']
            }
          }
        }
      });

      const rows = response.text ? JSON.parse(response.text) : [];
      const result = Array.isArray(rows)
        ? rows.filter((row: any) =>
            Boolean(String(row?.platform || '').trim())
            && Number(row?.amount) > 0
            && /^\d{4}-\d{2}-\d{2}$/.test(String(row?.date || ''))
            && Number(row?.retention || 0) >= 0
          )
        : [];
      return json({ result });
    }

    if (body.action === 'retention_explanation') {
      const platform = String(body.platform || '').slice(0, 160);
      const amount = Number(body.amount || 0);
      const retention = Number(body.retention || 0);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Explica en una frase la retención mostrada en este registro, sin asumir que es correcta ni atribuirle una causa legal no visible. Plataforma: ${platform}; importe: ${amount}; retención: ${retention}. Si faltan datos para identificar la causa, dilo explícitamente.`
      });
      return json({ result: response.text || 'No hay información suficiente para explicar la retención.' });
    }

    return json({ error: 'Unknown action', code: 'UNKNOWN_ACTION' }, 400);
  } catch (error) {
    console.error('[LABORA_AI_FAILED]', {
      userId: user.id,
      action: body.action,
      message: error instanceof Error ? error.message : String(error)
    });
    return json({ error: 'AI request failed', code: 'AI_REQUEST_FAILED' }, 502);
  }
});
