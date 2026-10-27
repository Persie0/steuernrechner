import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import {
  expandImportFiles,
  importDocumentBatch,
  type ImportProgress,
} from "../app/lib/importer.ts";

const google = (name = "PlayApps_202607.csv") =>
  new File(
    [
      "Transaction Date,Transaction Type,Buyer Country,Merchant Currency,Amount (Merchant Currency)\nJul 2,Charge,AT,EUR,100\nJul 2,Google fee,AT,EUR,-15\n",
    ],
    name,
  );

test("batch reports a current file before saving and emits each result as it completes", async () => {
  const progress: ImportProgress[] = [];
  const feedback: string[] = [];
  const saved: string[] = [];
  const result = await importDocumentBatch(
    [google(), new File(["evidence"], "notes.xml")],
    {
      existingHashes: new Set(),
      onProgress: (p) => progress.push(p),
      onFeedback: (f) => feedback.push(f.message),
      save: async (record) => {
        assert.equal(progress.at(-1)?.stage, "saving");
        assert.equal(progress.at(-1)?.currentFile, record.name);
        assert.equal(feedback.length, saved.length);
        saved.push(record.name);
      },
    },
  );
  assert.equal(result.records.length, 2);
  assert.equal(result.records[0].contribution.googleZm, 85);
  assert.equal(feedback.length, 2);
  assert.equal(progress.at(-1)?.completed, 2);
  assert.equal(progress.at(-1)?.total, 2);
  assert.ok(progress.some((p) => p.stage === "reading" && p.completed === 0));
});

test("renamed duplicate PDFs are skipped before expensive PDF recognition", async () => {
  const file = new File(
    ["not a PDF: duplicate must not be decoded"],
    "Invoice-copy.pdf",
  );
  const hash = Buffer.from(
    await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
  ).toString("hex");
  let saved = 0;
  const result = await importDocumentBatch([file], {
    existingHashes: new Set([hash]),
    save: async () => {
      saved++;
    },
  });
  assert.equal(saved, 0);
  assert.equal(result.feedback[0].level, "warn");
  assert.match(result.feedback[0].message, /identischer Inhalt/);
});

test("an already imported file still shows its detected quarter on reimport", async () => {
  const first = await importDocumentBatch([google()], {
    existingHashes: new Set(),
    save: async () => {},
  });
  const record = first.records[0];
  const second = await importDocumentBatch([google()], {
    existingHashes: new Set([record.sha256!]),
    existingReports: [record],
    save: async () => {
      throw new Error("duplicate was saved again");
    },
  });
  assert.equal(second.records.length, 0);
  assert.match(second.feedback[0].message, /Q3\/2026/);
  assert.match(second.feedback[0].message, /identischer Inhalt/);
});

test("a save failure is reported while the following file still imports", async () => {
  const result = await importDocumentBatch(
    [google(), new File(["note"], "note.xml")],
    {
      existingHashes: new Set(),
      save: async (record) => {
        if (record.source === "google") throw new Error("Speicher voll");
      },
    },
  );
  assert.equal(result.feedback[0].level, "error");
  assert.match(result.feedback[0].message, /Speicher voll/);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].name, "note.xml");
});

test("stopping a batch preserves already saved files and does not start the next one", async () => {
  const controller = new AbortController();
  const result = await importDocumentBatch(
    [google(), new File(["later"], "later.xml")],
    {
      existingHashes: new Set(),
      signal: controller.signal,
      save: async () => {
        controller.abort();
      },
    },
  );
  assert.equal(result.records.length, 1);
  assert.equal(result.feedback.length, 1);
  assert.equal(result.cancelled, true);
});

test("ZIP extraction identifies the current entry and skips hidden system files", async () => {
  const zip = new JSZip();
  zip.file("reports/PlayApps_202607.csv", await google().text());
  zip.file("__MACOSX/._file", "hidden");
  zip.file(".DS_Store", "hidden");
  const updates: ImportProgress[] = [];
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const result = await expandImportFiles(
    [new File([bytes as BlobPart], "quarter.zip")],
    {
      onProgress: (p) => updates.push(p),
    },
  );
  assert.equal(result.files.length, 1);
  assert.equal(result.files[0].name, "PlayApps_202607.csv");
  assert.ok(
    updates.some(
      (p) =>
        p.stage === "unpacking" &&
        p.currentFile.includes("PlayApps_202607.csv"),
    ),
  );
  assert.equal(updates.at(-1)?.completed, 1);
});

test("a corrupt ZIP does not prevent other selected files from being imported", async () => {
  const result = await expandImportFiles([
    new File(["broken"], "broken.zip"),
    google(),
  ]);
  assert.equal(result.feedback[0].level, "error");
  assert.equal(result.files.length, 1);
});
