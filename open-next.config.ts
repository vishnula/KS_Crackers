import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Static-first is what keeps this on the free tier: pre-rendered pages are served
// from the edge as assets and never invoke the Worker (PLAN.md section 9.5).
//
// The price list is the exception - the owner edits prices and stock in /admin,
// so it is ISR rather than fully static. The R2 cache holds the rendered page
// between revalidations, so a Worker runs only when the cache is stale or the
// admin publishes a change, not on every visit.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
