import Stripe from 'npm:stripe@^22';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY');
  const appUrl = Deno.env.get('LABORA_APP_URL')?.replace(/\/$/, '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publicKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeKey || !appUrl || !supabaseUrl || !publicKey || !serviceRole) {
    return json({ error: 'Billing is not configured on the server.' }, 503);
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

  const { data: billing, error: billingError } = await admin
    .from('billing_accounts')
    .select('stripe_customer_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (billingError) return json({ error: 'Unable to load billing account.' }, 500);
  if (!billing?.stripe_customer_id) return json({ error: 'No Stripe customer exists for this account.' }, 409);

  const stripe = new Stripe(stripeKey);
  const portal = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${appUrl}/?billing=portal`
  });

  return json({ url: portal.url });
});
