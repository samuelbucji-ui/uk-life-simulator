import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const uid = new URL(req.url).searchParams.get('uid');
  if (!uid || !/^[\w-]{10,64}$/.test(uid)) return Response.json({ ok: false }, { status: 400 });
  const store = getStore('boosts');
  const rec = await store.get(uid, { type: 'json' });
  if (rec && rec.sessions.length > rec.claimed) {
    rec.claimed += 1;
    await store.setJSON(uid, rec);
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, paid: !!(rec && rec.sessions.length) });
};

export const config = { path: '/api/claim' };
