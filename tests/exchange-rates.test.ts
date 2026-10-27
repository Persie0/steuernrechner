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
