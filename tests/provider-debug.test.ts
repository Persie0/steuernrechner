import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { createProviderDebug, buildProviderDebugZip } from "../app/lib/provider-debug.ts";

test("debug ZIP retains exact report bytes while excluding authentication responses and secrets", async () => {
  const debug = createProviderDebug();
  const raw = Uint8Array.from([0x1f, 0x8b, 0, 255, 17]);
  debug.capture({ kind: "apple_finance", date: "2026-10", token: "secret-token" }, 200, raw, 12);
  debug.capture({ kind: "google_token", assertion: "secret-assertion" }, 200, new TextEncoder().encode('{"access_token":"secret-token"}'), 2);
  debug.capture({ kind: "appodeal_result", apiKey: "secret-api-key", userId: "123", taskId: "task" }, 200, new TextEncoder().encode('{"api_key":"secret-api-key","data":[]}'), 3);
  debug.capture({ kind: "apple_finance", date: "2027-01", token: "secret-token" }, 404, undefined, 4);
  debug.addNote("appodeal", "Fehler: api_key=secret-api-key", ["secret-api-key"]);
  const zip = await JSZip.loadAsync(await buildProviderDebugZip(debug));
  const log = await zip.file("protokoll.json")!.async("string");
  assert.doesNotMatch(log, /secret-token|secret-api-key|secret-assertion/);
  assert.match(log, /2027-01/);
  assert.match(log, /404/);
  const files = Object.keys(zip.files).filter((name) => name.startsWith("berichte/") && !zip.files[name].dir);
  assert.equal(files.length, 1);
  assert.deepEqual(await zip.file(files[0])!.async("uint8array"), raw);
  debug.clear();
  assert.equal(debug.events.length, 0);
  assert.equal(debug.files.length, 0);
});
