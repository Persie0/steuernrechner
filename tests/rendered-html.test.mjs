import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

const env = {
  ASSETS: {fetch: async () => new Response("Not found", {status:404})},
};
const ctx = {waitUntil() {}, passThroughOnException() {}};

test("renders development preview metadata", async () => {
  const worker = await loadWorker();

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    env, ctx,
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders persistent Gemini key and contact import controls", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/ki-import", {headers:{accept:"text/html"}}), env, ctx);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Gemini API-Key/);
  assert.match(html, /Kontakte/);
  assert.match(html, /Auf diesem Gerät gespeichert|Kein Key gespeichert/);
});

test("Gemini endpoint rejects requests without an API key", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/api/gemini-import", {
    method:"POST", headers:{"content-type":"application/json"},
    body:JSON.stringify({mode:"contacts",data:"abc",mimeType:"application/pdf"}),
  }), env, ctx);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {error:"Gemini API-Key fehlt."});
});

test("Gemini endpoint rejects unsupported contact-import files before external calls", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("http://localhost/api/gemini-import", {
    method:"POST", headers:{"content-type":"application/json"},
    body:JSON.stringify({mode:"contacts",apiKey:"test-key",data:"abc",mimeType:"text/plain"}),
  }), env, ctx);
  assert.equal(response.status, 415);
  assert.deepEqual(await response.json(), {error:"Nur PDF, JPG, PNG oder WebP werden unterstützt."});
});
