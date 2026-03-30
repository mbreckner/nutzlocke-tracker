import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export async function GET(_ctx: APIContext) {
  const kv = (env as Env).NUZLOCKE_KV;
  if (!kv) {
    return Response.json({});
  }
  const value = await kv.get('statuses');
  return new Response(value ?? '{}', {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request }: APIContext) {
  const kv = (env as Env).NUZLOCKE_KV;
  if (!kv) {
    return new Response('KV not available', { status: 503 });
  }
  const body = await request.text();
  try {
    JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  await kv.put('statuses', body);
  return new Response('ok');
}
