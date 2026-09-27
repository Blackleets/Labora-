import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

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

const removeUserFolder = async (
  admin: ReturnType<typeof createClient>,
  bucket: string,
  userId: string
) => {
  const paths: string[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(userId, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error) throw error;
    const batch = (data || []).filter((item) => item.name && item.id).map((item) => `${userId}/${item.name}`);
    paths.push(...batch);
    if (!data || data.length < limit) break;
    offset += limit;
  }

  if (paths.length > 0) {
    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) throw error;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401);

  const body = await req.json().catch(() => null);
  if (!body || body.confirmation !== 'DELETE_MY_ACCOUNT') {
    return json({ error: 'Explicit confirmation required', code: 'CONFIRMATION_REQUIRED' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Account deletion is not configured', code: 'DELETE_NOT_CONFIGURED' }, 503);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    // Remove private storage first. Database rows are removed through the
    // profiles -> auth.users ON DELETE CASCADE graph when Auth deletion succeeds.
    await removeUserFolder(admin, 'labora-documents', user.id);
    await removeUserFolder(admin, 'labora-identity', user.id);

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return json({ ok: true });
  } catch (error) {
    console.error('[LABORA_DELETE_ACCOUNT_FAILED]', error instanceof Error ? error.message : error);
    return json({ error: 'Account deletion failed', code: 'DELETE_FAILED' }, 500);
  }
});
