/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

// Cloudflare Workers environment bindings (Astro v6 style)
interface Env {
  NUZLOCKE_KV: KVNamespace;
}

// Make App.Locals aware of the Cloudflare runtime context
declare namespace App {
  interface Locals {
    runtime: {
      ctx: ExecutionContext;
      caches: CacheStorage & { default: Cache };
    };
  }
}
