import type { D1Database } from "@cloudflare/workers-types";

// One row per browser the owner enabled alerts on. Endpoints only - no payload
// is ever encrypted or sent, so the keys a subscription carries are not needed.

async function getDb(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return ((env as { DB?: D1Database }).DB as D1Database) ?? null;
  } catch {
    return null;
  }
}

export async function addSubscription(endpoint: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, created_at) VALUES (?1, ?2)
       ON CONFLICT(endpoint) DO NOTHING`,
    )
    .bind(endpoint, new Date().toISOString())
    .run();
  return true;
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?1`).bind(endpoint).run();
}

export async function listSubscriptions(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db
      .prepare(`SELECT endpoint FROM push_subscriptions`)
      .all<{ endpoint: string }>();
    return rows.results.map((r) => r.endpoint);
  } catch {
    return [];
  }
}
