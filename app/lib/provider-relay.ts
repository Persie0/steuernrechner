type Payload = Record<string, unknown>;
type Upstream = { url: string; init: RequestInit };

function field(payload: Payload, key: string, pattern: RegExp, max = 2048) {
  const value = payload[key];
  if (typeof value !== "string" || value.length > max || !pattern.test(value))
    throw new Error("Ungültige Angaben.");
  return value;
}
function fields(payload: Payload, allowed: string[]) {
  if (Object.keys(payload).some((key) => !allowed.includes(key)))
    throw new Error("Unerwartete Angaben.");
}
const secret = (payload: Payload, key: string) =>
  field(payload, key, /^[^\s\x00-\x1f]+$/, 12000);
const digits = (payload: Payload, key: string) =>
  field(payload, key, /^\d{1,32}$/);
const date = (payload: Payload, key: string, monthly = false) => {
  const value = field(
    payload,
    key,
    monthly ? /^20\d{2}-(0[1-9]|1[0-2])$/ : /^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/,
  );
  if (!monthly) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    )
      throw new Error("Ungültiges Datum.");
  }
  return value;
};

export function prepareProviderRequest(payload: Payload): Upstream {
  const kind = payload.kind;
  if (kind === "apple_finance" || kind === "apple_sales") {
    fields(payload, ["kind", "vendor", "date", "token"]);
    const url = new URL(
      `https://api.appstoreconnect.apple.com/v1/${kind === "apple_finance" ? "financeReports" : "salesReports"}`,
    );
    url.searchParams.set("filter[vendorNumber]", digits(payload, "vendor"));
    url.searchParams.set(
      "filter[reportDate]",
      date(payload, "date", kind === "apple_finance"),
    );
    if (kind === "apple_finance") {
      url.searchParams.set("filter[reportType]", "FINANCE_DETAIL");
      url.searchParams.set("filter[regionCode]", "Z1");
    } else {
      url.searchParams.set("filter[reportType]", "SALES");
      url.searchParams.set("filter[reportSubType]", "SUMMARY");
      url.searchParams.set("filter[frequency]", "DAILY");
      url.searchParams.set("filter[version]", "1_0");
    }
    return {
      url: url.toString(),
      init: {
        headers: {
          Authorization: `Bearer ${secret(payload, "token")}`,
          Accept: "application/a-gzip",
        },
        redirect: "error",
        cache: "no-store",
      },
    };
  }
  if (kind === "google_token") {
    fields(payload, ["kind", "assertion"]);
    return {
      url: "https://oauth2.googleapis.com/token",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: secret(payload, "assertion"),
        }).toString(),
        redirect: "error",
        cache: "no-store",
      },
    };
  }
  if (kind === "google_list") {
    fields(payload, ["kind", "bucket", "token", "pageToken"]);
    const bucket = field(payload, "bucket", /^pubsite_prod_(?:rev_)?\d{4,32}$/);
    const url = new URL(`https://storage.googleapis.com/storage/v1/b/${bucket}/o`);
    url.searchParams.set("prefix", "earnings/earnings_");
    url.searchParams.set("fields", "items(name),nextPageToken");
    url.searchParams.set("maxResults", "1000");
    if (payload.pageToken !== undefined)
      url.searchParams.set("pageToken", field(payload, "pageToken", /^[A-Za-z0-9_+=\/-]+$/, 2048));
    return { url: url.toString(), init: { headers: { Authorization: `Bearer ${secret(payload, "token")}` }, redirect: "error", cache: "no-store" } };
  }
  if (kind === "google_file") {
    fields(payload, ["kind", "bucket", "token", "object"]);
    const bucket = field(payload, "bucket", /^pubsite_prod_(?:rev_)?\d{4,32}$/);
    const object = field(
      payload,
      "object",
      /^earnings\/earnings_20\d{2}(0[1-9]|1[0-2])(?:_[A-Za-z0-9_-]{1,100})?\.zip$/,
    );
    const url = new URL(
      `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(object)}`,
    );
    url.searchParams.set("alt", "media");
    return {
      url: url.toString(),
      init: {
        headers: { Authorization: `Bearer ${secret(payload, "token")}` },
        redirect: "error",
        cache: "no-store",
      },
    };
  }
  if (
    kind === "appodeal_start" ||
    kind === "appodeal_status" ||
    kind === "appodeal_result"
  ) {
    fields(
      payload,
      kind === "appodeal_start"
        ? ["kind", "apiKey", "userId", "from", "to"]
        : ["kind", "apiKey", "userId", "taskId"],
    );
    const url = new URL(
      `https://api-services.appodeal.com/api/v2/${kind === "appodeal_start" ? "stats_api" : kind === "appodeal_status" ? "check_status" : "output_result"}`,
    );
    url.searchParams.set("api_key", secret(payload, "apiKey"));
    url.searchParams.set("user_id", digits(payload, "userId"));
    if (kind === "appodeal_start") {
      const from = date(payload, "from"),
        to = date(payload, "to");
      const duration =
        Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
      if (duration < 0 || duration > 370 * 86400000)
        throw new Error("Ungültiger Berichtszeitraum.");
      url.searchParams.set("date_from", from);
      url.searchParams.set("date_to", to);
      url.searchParams.set("detalisation[]", "date");
    } else
      url.searchParams.set(
        "task_id",
        field(payload, "taskId", /^[A-Za-z0-9_-]{1,200}$/),
      );
    return {
      url: url.toString(),
      init: { redirect: "error", cache: "no-store" },
    };
  }
  throw new Error("Unbekannter Anbieter.");
}
