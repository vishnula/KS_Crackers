import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

// Exposes the Cloudflare bindings (D1) to `next dev`, so the app talks to the
// same local database in development as it does on Workers.
void initOpenNextCloudflareForDev();

export default nextConfig;
