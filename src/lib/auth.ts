// Admin session: a signed, httpOnly cookie. No session table, so it works the
// same on the Worker as it does locally, and there is nothing to clean up.

const COOKIE = "ks_admin";
const TTL_SECONDS = 12 * 60 * 60;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

// Length-independent comparison so a wrong guess leaks no timing information.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(
  input: string,
  expectedHash: string,
): Promise<boolean> {
  if (!expectedHash) return false;
  return timingSafeEqual(await sha256Hex(input), expectedHash.toLowerCase());
}

export async function createSessionToken(secret: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return `${expires}.${await sign(String(expires), secret)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token || !secret) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  return timingSafeEqual(signature, await sign(expires, secret));
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_MAX_AGE = TTL_SECONDS;
