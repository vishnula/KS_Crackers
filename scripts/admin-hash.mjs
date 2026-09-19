// Generates the values for ADMIN_PASSWORD_HASH and SESSION_SECRET.
//   npm run admin:hash -- "the password"
// The plain password is never stored anywhere; only its SHA-256 goes in the env.

import { createHash, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('usage: npm run admin:hash -- "your password"');
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH=${createHash("sha256").update(password).digest("hex")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("hex")}`);
