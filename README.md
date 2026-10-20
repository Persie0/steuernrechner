# Steuernrechner Österreich

Browser-based bookkeeping and Austrian tax calculation tools for sole proprietors (Einzelunternehmen): income/expense records, VAT (UVA/ZM), annual reports, invoice imports, and FinanzOnline XML support.

## Hosting

This is a **Next.js 16** application configured for Git-based **Vercel** hosting.

- Production branch: `main`
- Framework preset: Next.js
- Build command: `npm run build` (`next build`)
- Install command: `npm ci`
- Output directory: Next.js default (do not set a custom output directory)
- No ChatGPT sign-in, ChatGPT Sites deployment, or Cloudflare Worker required
- Deployments of `main` can be handled automatically by Vercel's Git integration; no GitHub Actions deployment needed.

## Local development

Requires Node.js >=22.13.

```sh
npm ci
npm run dev
```

Browse to http://localhost:3000.

```sh
npm run build
npm run start
npm test
npm run lint
```

`npm test` builds Next.js and runs the bookkeeping regression tests.

## Privacy and persistence

The application has **no login system**. Financial and bookkeeping data is held in the browser's local storage/IndexedDB, not in a hosted user account. A fresh browser or device will not automatically have your bookkeeping data. Make regular backups in **Einstellungen & Backup**; clearing the browser's site data can permanently remove local records. When switching from ChatGPT Sites to a Vercel domain, export from the old site and import into the new site — browser storage does not transfer between origins.

The optional Gemini document-import tool sends the chosen document and the API key supplied by the user to Google. Other server-side endpoints retrieve public exchange rates.

## Deployment notes

Use a publicly reachable Vercel production domain; Vercel's default preview deployments may require Vercel authentication but production domains can remain public. If this website is used for a business, ensure your Vercel account has a plan permitting commercial use.

The application is a calculation and learning aid, not professional tax advice. Check results against current Austrian requirements and FinanzOnline records before filing.
