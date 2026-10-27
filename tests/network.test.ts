import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { fetchWithTimeout } from "../app/lib/network.ts";

test("a stalled network request rejects after its deadline", async () => {
  const server = createServer(() => {});
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("No test port");
    await assert.rejects(
      fetchWithTimeout(`http://127.0.0.1:${address.port}`, {}, 30),
      { name: "TimeoutError" },
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("network cancellation is preserved alongside the timeout", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchWithTimeout("http://127.0.0.1:1", { signal: controller.signal }),
    { name: "AbortError" },
  );
});
