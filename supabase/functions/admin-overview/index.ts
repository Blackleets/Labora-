import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

const namedKey = (envName: string) => {
  const raw = Deno.env.get(envName);
  if (!raw) return undefined;
  try {
    const keys = JSON.parse(raw) as Record<string, string>;
    return keys.default || Object.values(keys)[0];
  } catch {
    return undefined;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publicKey = namedKey('SUPABASE_PUBLISHABLE_KEYS')
    || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
    || Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRole = namedKey('SUPABASE_SECRET_KEYS')
    || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !publicKey || !serviceRole) {
    return json({ error: 'Admin overview is not configured on the server.' }, 503);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Authentication required' }, 401);

  const userClient = createClient(supabaseUrl, publicKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  });
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Authentication required' }, 401);

  const { data: actor, error: actorError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (actorError) return json({ error: 'Unable to verify administrator role.' }, 500);
  if (actor?.role !== 'admin') return json({ error: 'Administrator access required.' }, 403);

  const [profiles, authUsers, documents, incomes, expenses, requirements, declarations] = await Promise.all([
    admin.from('profiles').select('id,name,email,role,country_code,manager_id'),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from('documents').select('*', { count: 'exact', head: true }),
    admin.from('incomes').select('*', { count: 'exact', head: true }),
    admin.from('expenses').select('*', { count: 'exact', head: true }),
    admin.from('requirements').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('tax_declarations').select('*', { count: 'exact', head: true }).neq('status', 'filed')
  ]);

  const firstError = [profiles, authUsers, documents, incomes, expenses, requirements, declarations]
    .find((result) => result.error)?.error;
  if (firstError) return json({ error: 'Unable to load administrative metrics.' }, 500);

  const roleCounts = { workers: 0, managers: 0, admins: 0 };
  const countries: Record<string, number> = {};
  for (const profile of profiles.data || []) {
    if (profile.role === 'rider') roleCounts.workers += 1;
    if (profile.role === 'manager') roleCounts.managers += 1;
    if (profile.role === 'admin') roleCounts.admins += 1;
    const country = String(profile.country_code || 'UNSET').toUpperCase();
    countries[country] = (countries[country] || 0) + 1;
  }

  const authById = new Map((authUsers.data?.users || []).map((user) => [user.id, user]));
  const directory = (profiles.data || []).map((profile) => {
    const authUser = authById.get(profile.id);
    return {
      id: profile.id,
      name: profile.name || 'Sin nombre',
      email: profile.email || authUser?.email || '',
      role: profile.role,
      countryCode: profile.country_code || 'UNSET',
      managerId: profile.manager_id || null,
      createdAt: authUser?.created_at || null,
      lastSignInAt: authUser?.last_sign_in_at || null,
      emailConfirmed: Boolean(authUser?.email_confirmed_at)
    };
  });

  return json({
    generatedAt: new Date().toISOString(),
    users: { total: profiles.data?.length || 0, ...roleCounts },
    records: {
      documents: documents.count || 0,
      incomes: incomes.count || 0,
      expenses: expenses.count || 0,
      pendingRequirements: requirements.count || 0,
      pendingDeclarations: declarations.count || 0
    },
    countries,
    directory,
    directoryTruncated: (authUsers.data?.users.length || 0) >= 200
  });
});
