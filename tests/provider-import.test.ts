import assert from "node:assert/strict";
import test from "node:test";
import {
  createAppleToken,
  createGoogleAssertion,
} from "../app/lib/provider-auth.ts";
import {
  appleReportMonths,
  googleEarningsObjects,
  decodeReportText,
  gunzipReport,
  downloadAppleReports,
  downloadGoogleReports,
  downloadAppodealReport,
} from "../app/lib/provider-import.ts";
import { prepareProviderRequest } from "../app/lib/provider-relay.ts";
import { POST } from "../app/api/provider-reports/route.ts";
import { detectSource } from "../app/lib/quarterly.ts";
import { inspectFile, reportContribution } from "../app/lib/tax.ts";
import { gzipSync } from "node:zlib";
import JSZip from "jszip";
import { expandImportFiles } from "../app/lib/importer.ts";

const b64 = (value: Uint8Array) => Buffer.from(value).toString("base64");
const pem = (value: Uint8Array) =>
  `-----BEGIN PRIVATE KEY-----\n${b64(value)}\n-----END PRIVATE KEY-----`;
const decode = (value: string) =>
  JSON.parse(Buffer.from(value, "base64url").toString());

test("Apple JWT is signed in the browser with a short expiry", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const secret = pem(
    new Uint8Array(await crypto.subtle.exportKey("pkcs8", key.privateKey)),
  );
  const jwt = await createAppleToken(
    {
      issuerId: "issuer",
      keyId: "KEY123",
      privateKey: secret,
      vendor: "12345678",
    },
    1000,
  );
  const [head, body, signature] = jwt.split(".");
  assert.deepEqual(decode(head), { alg: "ES256", kid: "KEY123", typ: "JWT" });
  assert.equal(decode(body).iss, "issuer");
  assert.equal(decode(body).aud, "appstoreconnect-v1");
  assert.equal(decode(body).exp - decode(body).iat, 900);
  assert.equal(
    await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key.publicKey,
      Buffer.from(signature, "base64url"),
      new TextEncoder().encode(`${head}.${body}`),
    ),
    true,
  );
  assert.ok(!jwt.includes("PRIVATE KEY"));
});

test("Google JWT uses the read-only storage scope", async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const secret = pem(
    new Uint8Array(await crypto.subtle.exportKey("pkcs8", key.privateKey)),
  );
  const jwt = await createGoogleAssertion(
    {
      client_email: "test@example.iam.gserviceaccount.com",
      private_key: secret,
    },
    1000,
  );
  const [head, body, signature] = jwt.split(".");
  assert.equal(
    decode(body).scope,
    "https://www.googleapis.com/auth/devstorage.read_only",
  );
  assert.equal(decode(body).aud, "https://oauth2.googleapis.com/token");
  assert.equal(
    await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key.publicKey,
      Buffer.from(signature, "base64url"),
      new TextEncoder().encode(`${head}.${body}`),
    ),
    true,
  );
});

test("financial report selection includes both neighbouring months and handles year boundaries", () => {
  assert.deepEqual(appleReportMonths(2026, 4), [
    "2026-09",
    "2026-10",
    "2026-11",
    "2026-12",
    "2027-01",
  ]);
  assert.deepEqual(appleReportMonths(2026, 1), [
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
  ]);
});

test("Google selects the three official earnings object paths for the quarter", () => {
  assert.deepEqual(googleEarningsObjects(2026, 3), ["earnings/earnings_202607.zip", "earnings/earnings_202608.zip", "earnings/earnings_202609.zip"]);
});

test("Google UTF-16 reports and Apple gzip reports decode correctly", async () => {
  const utf16 = Buffer.concat([
    Buffer.from([255, 254]),
    Buffer.from("Name,Value\nTest,2\n", "utf16le"),
  ]);
  assert.match(decodeReportText(utf16), /Name,Value/);
  const data = gzipSync(Buffer.from("Start Date\t01/01/2026\n"));
  assert.match(
    new TextDecoder().decode(await gunzipReport(data)),
    /Start Date/,
  );
});

test("daily Apple summaries are recognized only as supporting data", async () => {
  const text =
    "Provider\tProvider Country\tCountry Code\tUnits\tDeveloper Proceeds\tCurrency of Proceeds\nTest\tUS\tDE\t1\t1\tEUR\n";
  const name = "S_D_12345678_20260930.txt";
  assert.equal(detectSource(name, text), "apple_sales");
  const { record } = await inspectFile("apple_sales", new File([text], name));
  assert.equal(record.level, "ok");
  assert.equal(reportContribution(record, 2026, 3).appleZm, 0);
});

test("relay only creates allowlisted provider requests and never forwards private keys", () => {
  const apple = prepareProviderRequest({
    kind: "apple_finance",
    vendor: "12345678",
    date: "2026-09",
    token: "abc.def.ghi",
  });
  const url = new URL(apple.url);
  assert.equal(url.origin, "https://api.appstoreconnect.apple.com");
  assert.equal(url.searchParams.get("filter[reportType]"), "FINANCE_DETAIL");
  assert.equal(url.searchParams.get("filter[regionCode]"), "Z1");
  assert.ok(!apple.url.includes("abc.def.ghi"));
  assert.throws(() =>
    prepareProviderRequest({
      kind: "google_file",
      bucket: "example.com",
      object: "earnings/a.zip",
      token: "abc",
    }),
  );
  assert.throws(() =>
    prepareProviderRequest({
      kind: "google_file",
      bucket: "pubsite_prod_rev_123",
      object: "../../private",
      token: "abc",
    }),
  );
  assert.throws(() =>
    prepareProviderRequest({
      kind: "apple_finance",
      vendor: "12345678",
      date: "2026-09",
      token: "abc",
      privateKey: "secret",
    }),
  );
});

test("relay rejects foreign origins and never returns provider errors containing secrets", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response("secret from provider", { status: 403 });
  };
  try {
    const payload = JSON.stringify({
      kind: "apple_finance",
      vendor: "12345678",
      date: "2026-09",
      token: "test.token.value",
    });
    const forbidden = await POST(
      new Request("https://example.test/api/provider-reports", {
        method: "POST",
        headers: { origin: "https://other.test" },
        body: payload,
      }),
    );
    assert.equal(forbidden.status, 403);
    assert.equal(calls, 0);
    const response = await POST(
      new Request("https://example.test/api/provider-reports", {
        method: "POST",
        headers: { origin: "https://example.test" },
        body: payload,
      }),
    );
    assert.equal(response.status, 403);
    assert.doesNotMatch(await response.text(), /secret|test\.token/);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
  } finally {
    globalThis.fetch = original;
  }
});

test("Apple download imports available reports and keeps missing months explicit", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const privateKey = pem(
    new Uint8Array(await crypto.subtle.exportKey("pkcs8", key.privateKey)),
  );
  const original = globalThis.fetch;
  const bodies: string[] = [];
  globalThis.fetch = async (_url, init) => {
    const body = String(init?.body);
    bodies.push(body);
    const request = JSON.parse(body);
    if (request.kind === "apple_finance" && request.date === "2026-07")
      return new Response(
        gzipSync(
          Buffer.from(
            "Start Date\t06/28/2026\nEnd Date\t08/01/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n07/03/2026\t07/03/2026\tDE\t1\t3\t3\tEUR\tS\n",
          ),
        ),
      );
    if (request.kind === "apple_sales" && request.date === "2026-09-30")
      return new Response(
        gzipSync(
          Buffer.from(
            "Provider\tProvider Country\tCountry Code\tUnits\tDeveloper Proceeds\tCurrency of Proceeds\nTest\tUS\tDE\t1\t1\tEUR\n",
          ),
        ),
      );
    return Response.json({ error: "nicht verfügbar" }, { status: 404 });
  };
  try {
    const result = await downloadAppleReports(
      { issuerId: "issuer", keyId: "KEY", vendor: "12345678", privateKey },
      2026,
      3,
    );
    assert.deepEqual(
      result.files.map((file) => file.name),
      ["FD_12345678_0726.txt", "S_D_12345678_20260930.txt"],
    );
    assert.equal(result.warnings.length, 10);
    assert.equal(bodies.length, 12);
    assert.ok(
      bodies.every(
        (body) => !body.includes("PRIVATE KEY") && !body.includes(privateKey),
      ),
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("Apple download crosses the real relay and forwards no private key", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const privateKey = pem(
    new Uint8Array(await crypto.subtle.exportKey("pkcs8", key.privateKey)),
  );
  const original = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input) === "/api/provider-reports") {
      assert.doesNotMatch(String(init?.body), /PRIVATE KEY/);
      return POST(
        new Request("https://calculator.test/api/provider-reports", {
          ...init,
          headers: {
            "content-type": "application/json",
            origin: "https://calculator.test",
          },
        }),
      );
    }
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api.appstoreconnect.apple.com");
    assert.doesNotMatch(url.toString(), /PRIVATE|Bearer/);
    assert.match(
      new Headers(init?.headers).get("Authorization") || "",
      /^Bearer /,
    );
    upstreamCalls++;
    if (
      url.pathname === "/v1/financeReports" &&
      url.searchParams.get("filter[reportDate]") === "2026-07"
    ) {
      return new Response(
        gzipSync(
          Buffer.from(
            "Start Date\t06/28/2026\nEnd Date\t08/01/2026\nTransaction Date\tSettlement Date\tCountry of Sale\tQuantity\tPartner Share\tExtended Partner Share\tPartner Share Currency\tSale or Return\n07/03/2026\t07/03/2026\tDE\t1\t3\t3\tEUR\tS\n",
          ),
        ),
      );
    }
    return new Response("not found", { status: 404 });
  };
  try {
    const result = await downloadAppleReports(
      { issuerId: "issuer", keyId: "KEY", vendor: "12345678", privateKey },
      2026,
      3,
    );
    assert.equal(result.files.length, 1);
    assert.equal(upstreamCalls, 12);
    const inspected = await inspectFile("apple_financial", result.files[0]);
    assert.equal(reportContribution(inspected.record, 2026, 3).appleZm, 3);
  } finally {
    globalThis.fetch = original;
  }
});

test("Google uses a signed assertion and imports only matching earnings files", async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const privateKey = pem(
    new Uint8Array(await crypto.subtle.exportKey("pkcs8", key.privateKey)),
  );
  const zip = new JSZip();
  zip.file("PlayApps_202607.csv", Buffer.concat([
    Buffer.from([255, 254]),
    Buffer.from("Transaction Date,Transaction Type,Buyer Country,Merchant Currency,Amount (Merchant Currency)\nJul 2,Charge,AT,EUR,100\n", "utf16le"),
  ]));
  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  const original = globalThis.fetch;
  const bodies: string[] = [];
  globalThis.fetch = async (_url, init) => {
    const body = String(init?.body);
    bodies.push(body);
    const request = JSON.parse(body);
    if (request.kind === "google_token")
      return Response.json({ access_token: "test-token" });
    if (request.kind === "google_file" && request.object.endsWith("202607.zip"))
      return new Response(zipBytes as BodyInit);
    if (request.kind === "google_file") return Response.json({error:"nicht verfügbar"}, {status:404});
    throw Error("Unexpected call");
  };
  try {
    const result = await downloadGoogleReports(
      {
        bucket: "pubsite_prod_rev_123456",
        serviceAccount: {
          client_email: "test@example.iam.gserviceaccount.com",
          private_key: privateKey,
        },
      },
      2026,
      3,
    );
    assert.equal(result.files.length, 1);
    const {files} = await expandImportFiles(result.files);
    const csvFile = files[0];
    assert.match(decodeReportText(await csvFile.arrayBuffer()), /Transaction Date/);
    const record = (await inspectFile("google", csvFile)).record;
    assert.equal(record.contribution.googleZm, 100);
    assert.ok(
      bodies.every(
        (body) => !body.includes("PRIVATE KEY") && !body.includes(privateKey),
      ),
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("Appodeal returns report rows without persisting its access credentials", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const request = JSON.parse(String(init?.body));
    if (request.kind === "appodeal_start")
      return Response.json({ task_id: "task-1" });
    if (request.kind === "appodeal_status") return Response.json({ code: 0 });
    if (request.kind === "appodeal_result")
      return Response.json({
        code: 0,
        data: [{ date: "2026-07-01", revenue: 12, api_key: "do-not-save" }],
      });
    throw Error("Unexpected call");
  };
  try {
    const result = await downloadAppodealReport(
      { apiKey: "do-not-save", userId: "12345" },
      2026,
      3,
    );
    const text = await result.files[0].text();
    assert.match(text, /2026-07-01/);
    assert.doesNotMatch(text, /do-not-save|api_key|userId/);
    assert.match(result.warnings[0], /keine zusätzliche UVA/);
    assert.match(result.warnings[1], /Dashboard-Umsatz: 12/);
  } finally {
    globalThis.fetch = original;
  }
});
