export type AppleCredentials = {
  issuerId: string;
  keyId: string;
  privateKey: string;
  vendor: string;
};
export type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  private_key_id?: string;
};
export const PROVIDER_STORAGE_KEY = "ust-assistent-provider-credentials-v1";

function base64url(data: Uint8Array) {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemBytes(pem: string) {
  const match = pem.match(
    /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/,
  );
  if (!match)
    throw new Error("Privater Schlüssel muss im PKCS#8-Format vorliegen.");
  try {
    return Uint8Array.from(atob(match[1].replace(/\s/g, "")), (char) =>
      char.charCodeAt(0),
    );
  } catch {
    throw new Error("Privater Schlüssel ist nicht lesbar.");
  }
}

async function signJwt(
  header: object,
  body: object,
  privateKey: string,
  type: "apple" | "google",
) {
  const data = new TextEncoder();
  const input = `${base64url(data.encode(JSON.stringify(header)))}.${base64url(data.encode(JSON.stringify(body)))}`;
  const algorithm =
    type === "apple"
      ? { name: "ECDSA", namedCurve: "P-256" }
      : { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBytes(privateKey) as BufferSource,
    algorithm,
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    type === "apple" ? { name: "ECDSA", hash: "SHA-256" } : "RSASSA-PKCS1-v1_5",
    key,
    data.encode(input),
  );
  return `${input}.${base64url(new Uint8Array(signature))}`;
}

export async function createAppleToken(
  config: AppleCredentials,
  now = Math.floor(Date.now() / 1000),
) {
  if (
    !config.issuerId ||
    !config.keyId ||
    !config.privateKey ||
    !/^\d{4,32}$/.test(config.vendor)
  )
    throw new Error(
      "Apple Issuer-ID, Key-ID, Vendor-Nummer und .p8-Schlüssel ausfüllen.",
    );
  return signJwt(
    { alg: "ES256", kid: config.keyId, typ: "JWT" },
    {
      iss: config.issuerId,
      iat: now,
      exp: now + 900,
      aud: "appstoreconnect-v1",
    },
    config.privateKey,
    "apple",
  );
}

export async function createGoogleAssertion(
  config: GoogleServiceAccount,
  now = Math.floor(Date.now() / 1000),
) {
  if (!config.client_email || !config.private_key)
    throw new Error(
      "Service-Account-JSON enthält keine gültige E-Mail und keinen privaten Schlüssel.",
    );
  return signJwt(
    {
      alg: "RS256",
      typ: "JWT",
      ...(config.private_key_id ? { kid: config.private_key_id } : {}),
    },
    {
      iss: config.client_email,
      scope: "https://www.googleapis.com/auth/devstorage.read_only",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    config.private_key,
    "google",
  );
}
