const schema = {
  type: "object",
  properties: {
    documentType: {type: "string", enum: ["expense_invoice", "income_invoice", "receipt", "credit_note", "other"]},
    kind: {type: "string", enum: ["income", "expense"]}, description: {type: "string"}, documentNumber: {type: "string"},
    issueDate: {type: "string", description: "YYYY-MM-DD or empty"}, serviceDate: {type: "string", description: "YYYY-MM-DD or empty"}, paymentDate: {type: "string", description: "YYYY-MM-DD or empty if not visible"},
    currency: {type: "string", description: "ISO 4217 code"}, net: {type: "number"}, vat: {type: "number"}, gross: {type: "number"}, vatRate: {type: "number"},
    vatCase: {type: "string", enum: ["domestic", "eu_b2b_service", "reverse_charge_eu", "reverse_charge_domestic", "intra_community_supply", "intra_community_acquisition", "export_supply", "import_vat", "foreign_vat", "third_country", "exempt"]},
    category: {type: "string", enum: ["revenue", "asset_sale", "goods", "staff", "depreciation", "travel", "rent", "advertising", "svs", "software", "fees", "other"]}, paid: {type: "boolean"},
    partner: {type: "object", properties: {company: {type: "string"}, firstName: {type: "string"}, lastName: {type: "string"}, email: {type: "string"}, phone: {type: "string"}, street: {type: "string"}, zip: {type: "string"}, city: {type: "string"}, country: {type: "string", description: "ISO alpha-2"}, uid: {type: "string"}}, required: ["company", "firstName", "lastName", "email", "phone", "street", "zip", "city", "country", "uid"]},
    lineItems: {type: "array", items: {type: "object", properties: {description: {type: "string"}, quantity: {type: "number"}, unit: {type: "string"}, netAmount: {type: "number"}, vatRate: {type: "number"}}, required: ["description", "quantity", "unit", "netAmount", "vatRate"]}},
    reverseChargeEvidence: {type: "string"}, confidence: {type: "number", description: "0 to 1"}, warnings: {type: "array", items: {type: "string"}},
  },
  required: ["documentType", "kind", "description", "documentNumber", "issueDate", "serviceDate", "paymentDate", "currency", "net", "vat", "gross", "vatRate", "vatCase", "category", "paid", "partner", "lineItems", "reverseChargeEvidence", "confidence", "warnings"],
};

const contactProperties = {
  kind: {type: "string", enum: ["customer", "supplier", "both"]},
  company: {type: "string"}, firstName: {type: "string"}, lastName: {type: "string"},
  email: {type: "string"}, phone: {type: "string"}, street: {type: "string"},
  zip: {type: "string"}, city: {type: "string"},
  country: {type: "string", description: "ISO alpha-2"}, uid: {type: "string"},
  paymentTerms: {type: "number", description: "Visible payment term in days, otherwise 14"},
  language: {type: "string", enum: ["de", "en"]}, notes: {type: "string"},
  confidence: {type: "number", description: "0 to 1"}, warnings: {type: "array", items: {type: "string"}},
};
const contactSchema = {
  type: "object",
  properties: {contacts: {type: "array", items: {type: "object", properties: contactProperties, required: Object.keys(contactProperties)}}},
  required: ["contacts"],
};

type GeminiResponse = {error?: {message?: string}; steps?: Array<{content?: Array<{text?: string}>}>; output_text?: string};

export async function POST(request: Request) {
  try {
    const body = await request.json() as {apiKey?: string; data?: string; mimeType?: string; fileName?: string; mode?: "receipt"|"contacts"};
    const key = body.apiKey?.trim();
    if (!key) return Response.json({error: "Gemini API-Key fehlt."}, {status: 400});
    if (!body.data || !body.mimeType) return Response.json({error: "Datei fehlt."}, {status: 400});
    if (body.data.length > 18_000_000) return Response.json({error: "Datei ist zu groß. Maximal etwa 12 MB."}, {status: 413});
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(body.mimeType)) return Response.json({error: "Nur PDF, JPG, PNG oder WebP werden unterstützt."}, {status: 415});
    const filePart = body.mimeType === "application/pdf"
      ? {type: "document", data: body.data, mime_type: body.mimeType}
      : {type: "image", data: body.data, mime_type: body.mimeType};
    const contactsMode = body.mode === "contacts";
    const prompt = contactsMode
      ? `Extrahiere alle sichtbaren Geschäftskontakte aus diesem Dokument. Erkenne Kunden und Lieferanten anhand der Rollen im Dokument. Gib jeden realen Geschäftspartner höchstens einmal zurück; das eigene Unternehmen des Nutzers nur dann, wenn seine Rolle nicht sicher als Absender/Eigentümer erkennbar ist, und füge dann eine Warnung hinzu. Erfinde keine Daten. Leere, nicht sichtbare Felder bleiben leer. UID und Land normalisieren, Zahlungsziel übernehmen falls sichtbar. Dateiname: ${String(body.fileName || "").slice(0,160)}.`
      : `Analysiere diesen österreichischen Buchhaltungsbeleg. Extrahiere nur sichtbare Fakten. Klassifiziere den Umsatzsteuerfall aus Sicht eines österreichischen Einzelunternehmers mit Regelbesteuerung. Reverse Charge nur wählen, wenn Leistungsart, Sitz/UID und Rechnungshinweis das tragen. Ausländische auf der Rechnung ausgewiesene USt ist foreign_vat, nicht österreichische Vorsteuer. Bei Unsicherheit Feld sinnvoll vorbelegen und Warnung hinzufügen. Beträge immer in Originalwährung. Dateiname: ${String(body.fileName || "").slice(0, 160)}.`;
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST", headers: {"content-type": "application/json", "x-goog-api-key": key},
      body: JSON.stringify({model: "gemini-3.6-flash", store: false, input: [filePart, {type: "text", text: prompt}], response_format: {type: "text", mime_type: "application/json", schema: contactsMode ? contactSchema : schema}}),
    });
    const json = await response.json() as GeminiResponse;
    if (!response.ok) return Response.json({error: json.error?.message || "Gemini-Anfrage fehlgeschlagen."}, {status: response.status});
    const step = [...(json.steps || [])].reverse().find((item) => item.content?.some((content) => typeof content.text === "string"));
    const text = step?.content?.find((content) => typeof content.text === "string")?.text || json.output_text;
    if (!text) throw new Error("Gemini hat keine strukturierten Daten zurückgegeben.");
    return Response.json({result: JSON.parse(text)});
  } catch (error) {
    return Response.json({error: error instanceof Error ? error.message : "Import fehlgeschlagen."}, {status: 500});
  }
}
