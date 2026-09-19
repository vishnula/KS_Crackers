# KS Crackers

Seasonal fireworks pricelist and order site. Next.js 16 · React 19 · Tailwind v4 · Postgres.

## The model

This is **not** a pay-now e-commerce site, and that is deliberate. Online sale of
firecrackers is restricted in India, and every major payment gateway bans the
category outright (Razorpay: "pyrotechnic devices, combustibles ... explosives and
related goods"). So the site captures orders; the sale is completed offline.

```
browse pricelist -> qty -> min-order gate -> mobile OTP -> place order
   -> saved to DB, owner alerted on WhatsApp + email
   -> owner confirms by phone
   -> customer pays by UPI intent / QR, enters UTR
   -> admin verifies, packs, dispatches by transport
```

Payment lives behind one module (`src/lib/upi.ts`) so a real gateway can be added
later if the client's merchant account is ever approved.

## Run

```bash
npm install
cp .env.example .env.local   # fill in
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run catalogue:template` | Regenerates `docs/catalogue-template.xlsx` for the client |
| `npm run cf:preview` | Build + run the Cloudflare Worker locally |
| `npm run cf:deploy` | Build + deploy to Cloudflare |

## Hosting

Cloudflare Workers via `@opennextjs/cloudflare`, on the **free** plan. Running cost
is the domain only (~Rs 1,000/yr); everything else sits inside free tiers.

That only holds because the site is **static-first**. Pre-rendered pages are served
from the edge as assets and never invoke the Worker. Only the order, OTP and admin
routes are dynamic, and those run per *order* rather than per pageview — a few
thousand requests a day against a 100,000/day allowance.

If you ever make the catalogue pages server-rendered per request, every visitor
becomes a Worker invocation and the free tier stops being viable during the Diwali
peak. Don't.

First deploy:

```bash
npx wrangler login
npm run cf:deploy
```

## Layout

```
src/
  app/          routes (public + /admin)
  lib/
    types.ts    domain model — mirrors the DB schema
    format.ts   INR formatting, order numbers, unique-paise reconciliation
    upi.ts      UPI intent links, WhatsApp links, UTR validation
scripts/        one-off tooling
docs/           catalogue template for the client
```

## Two details that matter

**Unique paise.** Every order total carries a distinct paise value (₹4,250.**37**)
derived from the order sequence, so an incoming UPI credit maps to exactly one
order and the admin never has to read a payment screenshot. See `src/lib/format.ts`.

**Server-side re-pricing.** Never trust the total the browser posts. Re-price the
cart from the DB and re-check the minimum order value before saving.

## Project plan

Full plan, scope, timeline, costing and client intake questionnaire live **outside**
this repo at `D:\crackers-website\PLAN.md` — they contain commercial terms that
should not ship in the codebase.
