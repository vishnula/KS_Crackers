// Minimal Web Push sender, Web Crypto only.
//
// Deliberately sends notifications WITHOUT a payload. A payload would have to be
// encrypted per subscription (AES128GCM + ECDH), which needs a library that
// drags Node crypto into the Worker. A bare push just wakes the service worker,
// which then fetches the order details itself - same result, no dependency, and
// no customer data travelling through Google's push servers.

const encoder = new TextEncoder();

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
}

/** VAPID_PRIVATE_KEY holds the base64url'd JWK - ECDSA import needs d, x and y. */
async function importVapidKey(privateKeyBlob: string): Promise<CryptoKey> {
  const jwk = JSON.parse(b64urlDecode(privateKeyBlob)) as {
    d: string;
    x: string;
    y: string;
  };
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", ...jwk, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

/** Signed JWT proving to the push service which application is sending. */
async function buildVapidJwt(
  audience: string,
  subject: string,
  privateKey: CryptoKey,
): Promise<string> {
  const header = b64urlEncode(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64urlEncode(
    encoder.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    encoder.encode(`${header}.${claims}`),
  );

  return `${header}.${claims}.${b64urlEncode(signature)}`;
}

export type PushResult = { endpoint: string; status: number; gone: boolean };

export async function sendPush(
  endpoint: string,
  opts: { publicKey: string; privateKey: string; subject: string; ttlSeconds?: number },
): Promise<PushResult> {
  const audience = new URL(endpoint).origin;
  const key = await importVapidKey(opts.privateKey);
  const jwt = await buildVapidJwt(audience, opts.subject, key);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      TTL: String(opts.ttlSeconds ?? 3600),
      Urgency: "high",
      Authorization: `vapid t=${jwt}, k=${opts.publicKey}`,
      "Content-Length": "0",
    },
  });

  // 404/410 mean the browser dropped the subscription - stop sending to it.
  return {
    endpoint,
    status: response.status,
    gone: response.status === 404 || response.status === 410,
  };
}
