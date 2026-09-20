// Generates the VAPID key pair for web push notifications.
//   npm run push:keys
// Public key goes in NEXT_PUBLIC_VAPID_PUBLIC_KEY (build time, the browser needs
// it to subscribe). Private key goes in VAPID_PRIVATE_KEY as a Worker secret.

import { webcrypto } from "node:crypto";

const b64url = (buffer) =>
  Buffer.from(buffer).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const pair = await webcrypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);

// The browser expects the raw uncompressed point (65 bytes, 0x04 prefix).
const publicRaw = await webcrypto.subtle.exportKey("raw", pair.publicKey);
const privateJwk = await webcrypto.subtle.exportKey("jwk", pair.privateKey);

// The whole JWK is kept, not just d: importing an ECDSA key needs x and y too.
const privateBlob = b64url(
  Buffer.from(JSON.stringify({ d: privateJwk.d, x: privateJwk.x, y: privateJwk.y })),
);

console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${b64url(publicRaw)}`);
console.log(`VAPID_PRIVATE_KEY=${privateBlob}`);
console.log("");
console.log("Public key is a build-time variable - put it in .env.local.");
console.log("Private key is a secret - npx wrangler secret put VAPID_PRIVATE_KEY");
