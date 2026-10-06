import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response('Bad signature', { status: 400 });
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const uid = s.client_reference_id;
    if (uid && s.payment_status === 'paid') {
      const store = getStore('boosts');
      const rec = (await store.get(uid, { type: 'json' })) || { sessions: [], claimed: 0 };
      if (!rec.sessions.includes(s.id)) rec.sessions.push(s.id);
      await store.setJSON(uid, rec);
    }
  }
  return new Response('ok');
};

export const config = { path: '/api/stripe-webhook' };
