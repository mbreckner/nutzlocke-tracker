interface Env {
  NUZLOCKE_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const value = await env.NUZLOCKE_KV.get('games');
  return new Response(value ?? '[]', {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = await request.text();
  try {
    JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  await env.NUZLOCKE_KV.put('games', body);
  return new Response('ok');
};
