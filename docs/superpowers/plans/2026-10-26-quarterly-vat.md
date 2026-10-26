# Personal quarterly VAT workflow

Goal: one local, guided quarterly workflow for an Austrian app developer using Google Play, Apple and Appodeal. Keep the existing Next.js/Vercel deployment and existing bookkeeping records.

1. Correct and regression-test the shared platform calculation: Google resale margin versus purchased services, Apple calendar transaction dates, documented currency conversion, expenses by their own tax dates, net taxable turnover versus output VAT.
2. Accept a whole ZIP or individual original files locally, retain originals, deduplicate by content, classify unsupported files as attachments rather than silently treating them as income. Import expense drafts with explicit tax treatment, dates, private shares and confirmation; avoid counting CSV exports and receipts twice.
3. Replace the optional import screen with a quarterly flow: period, reports, expenses, checks, result. Persist each quarter's answers separately, show missing Apple boundary reports and recurring invoices, preserve manual corrections by period, and gate exports when unresolved items remain.
4. Review the related tax/export pages, run the complete local tests and production build, exercise the browser flow, publish the tested source to the existing repository, verify the Vercel deployment. No GitHub Actions needed.

Checks: renamed duplicate files; Apple July reports containing June rows; Q3 without the next October report; missing/indicative FX; expense exports already reduced for private use; changing quarters; RC before payment versus ordinary paid input VAT; domestic turnover at 20%; XML escaping and grouped ZM truncation.

Tax assumptions must be visible and confirmed. Do not commit uploaded invoices, taxpayer identifiers, financial source records, or calculated personal reports to the public repository. The report accompanying the change distinguishes computable values from incomplete filing values.
