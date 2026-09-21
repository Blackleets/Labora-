import Stripe from 'npm:stripe@^22';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { corsHeaders, originAllowed } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const appUrl = Deno.env.get('LABORA_APP_URL')?.replace(/\/$/, '');
  const headers = corsHeaders(req, appUrl);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });

  if (!originAllowed(req, appUrl)) return json({ error: 'Origin not allowed' }, 403);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY');
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

  const user = authData.user;
  const body = await req.json().catch(() => ({}));
  const interval = body?.interval === 'year' ? 'year' : 'month';
  const priceId = interval === 'year'
    ? Deno.env.get('STRIPE_PRO_ANNUAL_PRICE_ID')
    : Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID');

  if (!priceId) return json({ error: 'Stripe price is not configured.' }, 503);

  const stripe = new Stripe(stripeKey);

  const { data: billing, error: billingError } = await admin
    .from('billing_accounts')
    .select('user_id,plan,status,stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (billingError) return json({ error: 'Unable to load billing account.' }, 500);

  let customerId = billing?.stripe_customer_id || null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { labora_user_id: user.id }
    });
    customerId = customer.id;

    const { error: customerSaveError } = await admin
      .from('billing_accounts')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (customerSaveError) return json({ error: 'Unable to save billing customer.' }, 500);
  }

  if (billing?.plan === 'pro' && ['active', 'trialing'].includes(billing.status)) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/?billing=portal`
    });
    return json({ url: portal.url, kind: 'portal' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${appUrl}/?billing=success`,
    cancel_url: `${appUrl}/?billing=cancelled`,
    metadata: {
      labora_user_id: user.id,
      plan: 'pro',
      interval
    },
    subscription_data: {
      metadata: {
        labora_user_id: user.id,
        plan: 'pro'
      }
    }
  });

  if (!session.url) return json({ error: 'Stripe did not return a checkout URL.' }, 502);
  return json({ url: session.url, kind: 'checkout' });
});
