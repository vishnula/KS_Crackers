import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// Static-first is what keeps this on the free tier: pre-rendered pages are served
// from the edge as assets and never invoke the Worker (PLAN.md section 9.5).
//
// The price list is the exception - the owner edits prices and stock in /admin,
// so it is ISR rather than fully static. The cache holds the rendered page
// between revalidations, so a Worker runs only when the cache is stale or the
// admin publishes a change, not on every visit.
//
// KV rather than R2: R2 requires a card on file, and this project has no need
// for object storage until the client sends product photos. Swap back to
// r2-incremental-cache then - it is a one-line change plus the binding.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
