import { prepareProviderRequest } from "../../lib/provider-relay.ts";
import { fetchWithTimeout } from "../../lib/network.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

async function requestText(request: Request) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new Error("Anfrage zu groß.");
    }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(result);
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return Response.json(
        { error: "Ungültige Herkunft." },
        { status: 403, headers },
      );
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 16384)
      return Response.json(
        { error: "Anfrage zu groß." },
        { status: 413, headers },
      );
    const raw = await requestText(request);
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      throw new Error("Ungültige Anfrage.");
    const upstream = prepareProviderRequest(payload);
    const response = await fetchWithTimeout(
      upstream.url,
      upstream.init,
      25_000,
    );
    if (!response.ok)
      return Response.json(
        {
          error:
            response.status === 404
              ? "Bericht nicht vorhanden oder noch nicht verfügbar."
              : `Anbieter antwortete mit HTTP ${response.status}. Berechtigungen und Angaben prüfen.`,
        },
        {
          status:
            response.status >= 400 && response.status < 600
              ? response.status
              : 502,
          headers,
        },
      );
    const lengthHeader = Number(response.headers.get("content-length") || 0);
    if (lengthHeader > 25 * 1024 * 1024)
      return Response.json(
        { error: "Bericht ist größer als 25 MB." },
        { status: 413, headers },
      );
    let size = 0;
    const body =
      response.body?.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, stream) {
            size += chunk.byteLength;
            if (size > 25 * 1024 * 1024) throw new Error("Bericht zu groß.");
            stream.enqueue(chunk);
          },
        }),
      ) || null;
    return new Response(body, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type":
          response.headers.get("content-type") || "application/octet-stream",
      },
    });
  } catch (error) {
    // Never expose request bodies, credentials, provider URLs or exception details.
    if (error instanceof Error && error.message === "Anfrage zu groß.")
      return Response.json(
        { error: "Anfrage zu groß." },
        { status: 413, headers },
      );
    if (
      error instanceof SyntaxError ||
      (error instanceof Error &&
        /Ungültig|Unerwartet|Unbekannt/.test(error.message))
    )
      return Response.json(
        { error: "Ungültige Abrufangaben." },
        { status: 400, headers },
      );
    return Response.json(
      { error: "Anbieter nicht erreichbar oder Abruf abgelaufen." },
      { status: 502, headers },
    );
  }
}
