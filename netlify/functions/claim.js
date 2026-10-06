import { getStore } from '@netlify/blobs';

const AMOUNT = 300000; // must match pay.js

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const { reference } = await req.json().catch(() => ({}));
  if (!reference || !/^ukls_[a-f0-9]{32}$/.test(reference)) {
    return Response.json({ ok: false, error: 'Bad payment reference.' }, { status: 400 });
  }
  const store = getStore('paystack-claims');
  if (await store.get(reference)) {
    return Response.json({ ok: false, error: 'This payment was already used.' });
  }
  const r = await fetch('https://api.paystack.co/transaction/verify/' + reference, {
    headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY },
  });
  const d = await r.json();
  if (d.status && d.data && d.data.status === 'success' && d.data.amount >= AMOUNT) {
    await store.set(reference, '1');
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: "We couldn't confirm this payment yet." });
};

export const config = { path: '/api/claim' };
