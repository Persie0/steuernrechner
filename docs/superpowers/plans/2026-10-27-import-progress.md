# Quarterly import progress

Goal: show real progress during a ZIP or document import, identify slow work, and keep completed imports when the user stops the remaining files. Keep the existing tax calculation and export safeguards.

Implementation: use the existing sequential import, with progress callbacks for ZIP extraction, file recognition, exchange rates and local saving. Hash before parsing so copies do not repeat PDF/FX work. Reuse extracted PDF text. Bound network requests and cache the shared ECB history. Show completed/total files, current file, elapsed time, live results and a stop button. Keep verbose per-file currency details collapsed. Add a short explanation of the required quarterly inputs next to the uploader.

Files: `app/lib/importer.ts` (batch lifecycle), `app/lib/network.ts` (bounded fetch), `app/lib/tax.ts` (inspection progress and reused text), `app/components/UstProvider.tsx` (queue, persistence and progress state), `app/components/ImportProgressPanel.tsx` and `CalculationWizard.tsx` (accessible progress and requirements), `app/api/exchange-rates/route.ts` (bounded cached upstream calls), and focused tests.

- [ ] Write failing batch tests: progress before slow work, live results, duplicate copies skipped before parsing, errors do not hide later successes, cancellation preserves completed files, ZIP extraction progress.
- [ ] Implement the batch and provider integration; keep backup validation and tax rules intact.
- [ ] Test bounded fetch with a real local HTTP server; apply it to client FX and upstream requests.
- [ ] Add progress UI, elapsed time, cancellation and concise import requirements.
- [ ] Run all tests/build/lint, test the guided upload in the browser with the original ZIP, review the diff, publish and verify deployment.

Review focus: corrupt ZIP; errors while saving; cancel during FX; malformed/scanned PDFs; two queued imports with identical content. Original invoices, identifiers, report amounts and browser screenshots stay out of the repository.
