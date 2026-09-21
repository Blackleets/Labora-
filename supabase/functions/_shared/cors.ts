const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');

export const allowedOrigins = (appUrl?: string | null) => {
  const configured = (Deno.env.get('LABORA_ALLOWED_ORIGINS') || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  if (appUrl) configured.push(normalizeOrigin(appUrl));
  return new Set(configured);
};

export const originAllowed = (req: Request, appUrl?: string | null) => {
  const origin = req.headers.get('Origin');
  if (!origin) return true;
  return allowedOrigins(appUrl).has(normalizeOrigin(origin));
};

export const corsHeaders = (req: Request, appUrl?: string | null) => {
  const origin = req.headers.get('Origin');
  const allowed = origin && originAllowed(req, appUrl) ? normalizeOrigin(origin) : 'null';

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json'
  };
};
