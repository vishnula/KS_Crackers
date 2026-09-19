import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Static-first is what keeps this on the free tier: pre-rendered pages are served
// from the edge as assets and never invoke the Worker. Only order/OTP/admin routes
// count against the 100k requests/day Functions allowance. See PLAN.md section 9.5.
export default defineCloudflareConfig();
