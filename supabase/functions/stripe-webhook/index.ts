import Stripe from 'npm:stripe@^22';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_API_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRole) {
  console.error('Stripe webhook is missing required server secrets.');
}

const stripe = new Stripe(stripeKey || 'sk_missing');
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = supabaseUrl && serviceRole
  ? createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } })
  : null;

const unixToIso = (value?: number | null) =>
  value ? new Date(value * 1000).toISOString() : null;

const resolveUserId = async (subscription: Stripe.Subscription) => {
  const metadataUserId = subscription.metadata?.labora_user_id;
  if (metadataUserId) return metadataUserId;
  if (!admin) return null;

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;

  if (!customerId) return null;

  const { data } = await admin
    .from('billing_accounts')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.user_id || null;
};

const syncSubscription = async (subscription: Stripe.Subscription, eventId: string) => {
  if (!admin) throw new Error('Supabase admin client unavailable');

  const userId = await resolveUserId(subscription);
  if (!userId) throw new Error('Unable to resolve Labora+ user for Stripe subscription');

  const firstItem = subscription.items?.data?.[0];
  const priceId = firstItem?.price?.id || null;
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id || null;

  const terminal = ['canceled', 'incomplete_expired'].includes(subscription.status);
  const plan = terminal ? 'free' : 'pro';

  const { error } = await admin
    .from('billing_accounts')
    .upsert({
      user_id: userId,
      plan,
      status: subscription.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_start: unixToIso(firstItem?.current_period_start),
      current_period_end: unixToIso(firstItem?.current_period_end),
      trial_end: unixToIso(subscription.trial_end),
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      last_stripe_event_id: eventId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) throw error;
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!stripeKey || !webhookSecret || !admin) return json({ error: 'Webhook not configured' }, 503);

  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return json({ error: 'Missing Stripe signature' }, 400);

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (error: any) {
    console.error('Stripe signature verification failed', error?.message);
    return json({ error: 'Invalid Stripe signature' }, 400);
  }

  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('processed_at')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existing?.processed_at) return json({ ok: true, duplicate: true });

  if (!existing) {
    const { error: eventInsertError } = await admin.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      livemode: event.livemode,
      created_at: new Date(event.created * 1000).toISOString()
    });
    if (eventInsertError && eventInsertError.code !== '23505') throw eventInsertError;
  }

  try {
    if (
      event.type === 'customer.subscription.created'
      || event.type === 'customer.subscription.updated'
      || event.type === 'customer.subscription.deleted'
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription, event.id);
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.labora_user_id;
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

      if (userId && customerId) {
        const { error } = await admin
          .from('billing_accounts')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            last_stripe_event_id: event.id,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        if (error) throw error;
      }
    }

    const { error: processedError } = await admin
      .from('stripe_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', event.id);

    if (processedError) throw processedError;
    return json({ ok: true });
  } catch (error: any) {
    console.error('Stripe webhook processing failed', event.id, error?.message);
    return json({ error: 'Webhook processing failed' }, 500);
  }
});
