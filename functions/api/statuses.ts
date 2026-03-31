interface Env {
  NUZLOCKE_KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.NUZLOCKE_KV) {
    return new Response('KV binding NUZLOCKE_KV not found. Check dashboard bindings.', { status: 503 });
  }
  const value = await env.NUZLOCKE_KV.get('statuses');
  return new Response(value ?? '{}', {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.NUZLOCKE_KV) {
    return new Response('KV binding NUZLOCKE_KV not found. Check dashboard bindings.', { status: 503 });
  }
  const body = await request.text();
  try {
    JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  await env.NUZLOCKE_KV.put('statuses', body);
  return new Response('ok');
};
