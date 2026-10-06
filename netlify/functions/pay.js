import { getStore } from '@netlify/blobs';

const AMOUNT = 300000; // in kobo: 300000 = ₦3,000. Change here AND in index.html (PRICE).

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const { email, uid } = await req.json().catch(() => ({}));
  if (!email || !uid || !/^[\w-]{10,64}$/.test(uid)) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }
  const reference = 'ukls_' + crypto.randomUUID().replace(/-/g, '');
  const site = new URL(req.url).origin;
  const r = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, amount: AMOUNT, reference, callback_url: site + '/', metadata: { uid } }),
  });
  const d = await r.json();
  if (!d.status) return Response.json({ error: d.message }, { status: 502 });
  return Response.json({ url: d.data.authorization_url, reference });
};

export const config = { path: '/api/pay' };
