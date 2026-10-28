import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/exchange-rates/route.ts";

test("FX history retries after failure and is then reused for different report periods", async () => {
  const original = globalThis.fetch;
  let available = false;
  let historyRequests = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("eurofxref-hist.csv")) {
      historyRequests++;
      if (!available) throw new Error("Temporary upstream failure");
      return new Response("Date,GBP,\n2026-07-10,2,\n2026-07-09,3,\n");
    }
    return new Response("Unavailable", { status: 503 });
  };
  try {
    const failed = await GET(
      new Request(
        "http://localhost/api/exchange-rates?currencies=GBP&from=2026-07-09&to=2026-07-10",
      ),
    );
    assert.equal(failed.status, 502);
    available = true;
    const first = await GET(
      new Request(
        "http://localhost/api/exchange-rates?currencies=GBP&from=2026-07-09&to=2026-07-10",
      ),
    );
    assert.deepEqual((await first.json()).rates.GBP, [
      { date: "2026-07-09", rate: 3 },
      { date: "2026-07-10", rate: 2 },
    ]);
    const second = await GET(
      new Request(
        "http://localhost/api/exchange-rates?currencies=GBP&from=2026-07-10&to=2026-07-31",
      ),
    );
    assert.equal(second.status, 200);
    assert.equal(historyRequests, 2);
  } finally {
    globalThis.fetch = original;
  }
});

test("uses ECB first and Banca d’Italia for missing currencies with dated EUR convention", async () => {
  const original = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input); requests.push(url);
    if (url.includes("/service/data/EXR")) return new Response("not found", {status:404});
    if (url.includes("bancaditalia.it")) return Response.json({resultsInfo:{isoCode:"SAR"},rates:[{referenceDate:"2026-05-14",avgRate:"4.3883",exchangeConvention:"Foreign currency amount for 1 Euro."},{referenceDate:"2026-05-15",avgRate:"4.3605",exchangeConvention:"Foreign currency amount for 1 Euro."}]});
    return new Response("unavailable", {status:503});
  };
  try {
    const response = await GET(new Request("http://localhost/api/exchange-rates?currencies=GBP,SAR&from=2026-05-14&to=2026-05-15"));
    const data = await response.json();
    assert.equal(response.status,200);
    assert.equal(data.sources.SAR,"Banca d’Italia");
    assert.deepEqual(data.rates.SAR,[{date:"2026-05-14",rate:4.3883},{date:"2026-05-15",rate:4.3605}]);
    assert.ok(requests.some((url) => url.includes("baseCurrencyIsoCode=SAR")));
  } finally { globalThis.fetch = original; }
});

test("fetches authentic bank PDF as local proof and rejects non-PDF responses", async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input, init) => {
    calls.push(String(input));
    assert.equal((init?.headers as Record<string,string>).Accept,"application/pdf");
    return new Response("%PDF-1.4 test");
  };
  try {
    const response = await GET(new Request("http://localhost/api/exchange-rates?currencies=SAR&from=2026-05-14&to=2026-06-14&proof=pdf"));
    assert.equal(response.status, 200);
    assert.match(await response.text(), /^%PDF-/);
    assert.ok(calls[0].includes("startDate=2026-05-04"));
    globalThis.fetch = async () => new Response("not a pdf");
    const invalid = await GET(new Request("http://localhost/api/exchange-rates?currencies=SAR&from=2026-05-14&to=2026-06-14&proof=pdf"));
    assert.equal(invalid.status, 502);
  } finally { globalThis.fetch = original; }
});
