# Sheet Clean

One-page tool for small shop owners: upload a product catalog or orders CSV, find duplicate SKUs and titles, trim whitespace, download a cleaned CSV.

All processing runs in the browser. Files never leave the device.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
```

Deploy later to Vercel Hobby (no custom domain required).

## $0 constraints

- Next.js App Router + TypeScript
- CSV parse / trim / duplicate detect / download are 100% client-side
- No backend AI, no Photoroom, no Replicate, no Fal, no OpenAI
- No paid APIs, no Stripe/Creem live charges
- Creem is a **stub only**: the "Unlock 10k rows — $9.9/mo (test mode, no charge)" button lifts the in-browser cap and does not charge. Search `CREEM PLUG-IN POINT` in `src/components/SheetCleaner.tsx` for where checkout can plug in later
- Free tier: first 100 rows cleaned in-browser
- No custom domain, no analytics SaaS
- English UI
- Do not commit secrets (none are used; do not add `.env` files with keys)

## What it does

1. Upload a `.csv`
2. See row count, duplicate SKU count, duplicate title count
3. Download a cleaned CSV (whitespace trimmed)
4. Optional stub unlock raises the cap from 100 to 10,000 rows

A tiny sample file lives at `public/sample-catalog.csv`.
