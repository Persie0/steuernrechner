"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROVIDER_STORAGE_KEY,
  type GoogleServiceAccount,
} from "../lib/provider-auth";
import {
  downloadAppleReports,
  downloadGoogleReports,
  downloadAppodealReport,
  configuredProviders,
  type ProviderCredentials as Credentials,
  type ProviderName as Provider,
} from "../lib/provider-import";
import type { UploadFeedback } from "../lib/importer";
import { buildProviderDebugZip, type ProviderDebug } from "../lib/provider-debug";

const empty = (): Credentials => ({
  apple: { issuerId: "", keyId: "", vendor: "", privateKey: "" },
  google: { bucket: "", serviceAccountJson: "" },
  appodeal: { apiKey: "", userId: "" },
});

export default function ProviderImportPanel({
  year,
  quarter,
  disabled,
  importFiles,
  cancelImport,
  onBusyChange,
  onImportFeedback,
  debug,
}: {
  year: number;
  quarter: number;
  disabled: boolean;
  importFiles: (files: File[]) => Promise<UploadFeedback[]>;
  cancelImport: () => void;
  onBusyChange: (busy: boolean) => void;
  onImportFeedback: (feedback: UploadFeedback[]) => void;
  debug: ProviderDebug;
}) {
  const [credentials, setCredentials] = useState<Credentials>(empty);
  const [running, setRunning] = useState<Provider | "all" | null>(null);
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [debugCount, setDebugCount] = useState(debug.events.length);
  const [debugDownloading, setDebugDownloading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => {
      if (!active) return;
      try {
        const saved = JSON.parse(
          localStorage.getItem(PROVIDER_STORAGE_KEY) || "{}",
        );
        const blank = empty();
        const loaded: Credentials = {
          apple: { ...blank.apple, ...saved.apple },
          google: { ...blank.google, ...saved.google },
          appodeal: { ...blank.appodeal, ...saved.appodeal },
        };
        setCredentials(loaded);
      } catch {
        setCredentials(empty());
      }
    };
    const cleared = () => {
      controller.current?.abort();
      setCredentials(empty());
      setDebugCount(0);
      setMessage("");
      setWarnings([]);
    };
    queueMicrotask(load);
    window.addEventListener("provider-credentials-cleared", cleared);
    return () => {
      active = false;
      controller.current?.abort();
      window.removeEventListener("provider-credentials-cleared", cleared);
    };
  }, []);
  function save(provider: Provider) {
    try {
      const saved = JSON.parse(
        localStorage.getItem(PROVIDER_STORAGE_KEY) || "{}",
      );
      localStorage.setItem(
        PROVIDER_STORAGE_KEY,
        JSON.stringify({ ...saved, [provider]: credentials[provider] }),
      );
      setMessage(
        `${provider === "apple" ? "Apple" : provider === "google" ? "Google" : "Appodeal"}-Zugang in diesem Browser gespeichert.`,
      );
      setWarnings([]);
    } catch {
      setMessage("Zugang konnte im Browser nicht gespeichert werden.");
    }
  }
  function remove(provider: Provider) {
    try {
      const saved = JSON.parse(
        localStorage.getItem(PROVIDER_STORAGE_KEY) || "{}",
      );
      delete saved[provider];
      if (Object.keys(saved).length)
        localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(saved));
      else localStorage.removeItem(PROVIDER_STORAGE_KEY);
      setCredentials((current) => ({
        ...current,
        [provider]: empty()[provider],
      }));
      setMessage("Zugang aus diesem Browser entfernt.");
      setWarnings([]);
    } catch {
      setMessage("Zugang konnte nicht entfernt werden.");
    }
  }
  const run = useCallback(async (providers: Provider[], access: Credentials) => {
    if (controller.current || disabled || !providers.length) return;
    const abort = new AbortController();
    controller.current = abort;
    setRunning(providers.length === 1 ? providers[0] : "all");
    onBusyChange(true);
    setWarnings([]);
    let count = 0;
    const allWarnings: string[] = [], allFeedback: UploadFeedback[] = [];
    const secrets = [access.apple.privateKey, access.google.serviceAccountJson, access.appodeal.apiKey];
    try {
      for (const provider of providers) {
        if (abort.signal.aborted) break;
        const label = provider === "apple" ? "Apple" : provider === "google" ? "Google" : "Appodeal";
        const options = {
          signal: abort.signal,
          progress: setMessage,
          debug,
          onDebug: () => { if (!abort.signal.aborted) setDebugCount(debug.events.length); },
        };
        try {
          let result;
          if (provider === "apple")
            result = await downloadAppleReports(access.apple, year, quarter, options);
          else if (provider === "google") {
            let serviceAccount: GoogleServiceAccount;
            try {
              serviceAccount = JSON.parse(access.google.serviceAccountJson);
            } catch {
              throw new Error("Bitte ein gültiges Google Service-Account-JSON auswählen.");
            }
            result = await downloadGoogleReports(
              { bucket: access.google.bucket.trim().replace(/^gs:\/\//, "").split("/")[0], serviceAccount },
              year, quarter, options,
            );
          } else
            result = await downloadAppodealReport(access.appodeal, year, quarter, options);
          if (abort.signal.aborted) break;
          allWarnings.push(...result.warnings.map((warning) => `${label}: ${warning}`));
          for (const warning of result.warnings) debug.addNote(provider, warning, secrets);
          if (result.files.length) {
            count += result.files.length;
            setMessage(`${label}: ${result.files.length} Dateien abgerufen; werden lokal importiert …`);
            const feedback = await importFiles(result.files);
            allFeedback.push(...feedback);
            for (const item of feedback) debug.addNote(provider, `Import: ${item.message}`, secrets);
            setDebugCount(debug.events.length);
            onImportFeedback([...allFeedback]);
            if (feedback.some((item) => item.level === "error"))
              allWarnings.push(`${label}: Beim lokalen Import sind Fehler aufgetreten. Bitte Importmeldungen prüfen.`);
          }
        } catch (error) {
          if (abort.signal.aborted) break;
          const message = error instanceof Error ? error.message : "Abruf fehlgeschlagen.";
          allWarnings.push(`${label}: ${message}`);
          debug.addNote(provider, `Fehler: ${message}`, secrets);
          setDebugCount(debug.events.length);
        }
      }
      setWarnings(allWarnings);
      setMessage(abort.signal.aborted
        ? "Abruf gestoppt; bereits verarbeitete Dateien bleiben gespeichert."
        : count
          ? `${count} Dateien abgerufen. Ergebnisse stehen unten bei den Importmeldungen.`
          : "Kein Bericht abgerufen. Hinweise unten prüfen.");
    } finally {
      if (controller.current === abort) controller.current = null;
      setRunning(null);
      onBusyChange(false);
    }
  }, [disabled, year, quarter, importFiles, onBusyChange, onImportFeedback, debug]);
  const locked = !!running || disabled;
  async function downloadDebug() {
    setDebugDownloading(true);
    try {
      const bytes = await buildProviderDebugZip(debug);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `api-debug-Q${quarter}-${year}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMessage("Debug-ZIP konnte nicht erstellt werden.");
    } finally {
      setDebugDownloading(false);
    }
  }
  const actions = (provider: Provider) => (
    <div className="providerActions">
      <button
        type="button"
        className="secondaryBtn"
        disabled={locked}
        onClick={() => save(provider)}
      >
        Zugang lokal speichern
      </button>
      <button
        type="button"
        className="secondaryBtn"
        disabled={locked}
        onClick={() => remove(provider)}
      >
        Zugang löschen
      </button>
      <button
        type="button"
        className="uploadBtn"
        disabled={locked}
        onClick={() => {
          save(provider);
          void run([provider], credentials);
        }}
      >
        Für Q{quarter}/{year} abrufen
      </button>
    </div>
  );
  return (
    <section
      className="providerPanel"
      aria-label="Automatischer Plattformabruf"
    >
      <h3>Apple und Google abrufen</h3>
      <button type="button" className="uploadBtn" disabled={locked} onClick={() => {
        const selected = configuredProviders(credentials).filter((provider) => provider === "apple" || provider === "google");
        if (selected.length !== 2) { setMessage("Bitte zuerst vollständige Zugänge für Apple und Google eingeben. Einzelabruf ist unten möglich."); return; }
        void run(selected, credentials);
      }}>Apple und Google für Q{quarter}/{year} abrufen</button>
      <p>Der Abruf startet nur, wenn du auf einen Abrufknopf klickst. Gespeicherte Zugänge bleiben in diesem Browser und können für das gewählte Quartal verwendet werden.</p>
      <p className="hint">
        Gespeicherte Zugangsdaten liegen nur in diesem Browser. Beim Abruf
        werden die Berichte über Vercel durchgeleitet: Apple und Google nutzen
        dafür kurzlebige Tokens; Appodeal überträgt seinen API-Schlüssel bei
        jeder Anfrage. Auf dem Server werden sie nicht gespeichert. Wer Zugriff
        auf diesen Browser hat, kann die gespeicherten Zugangsdaten auslesen.
      </p>
      <details>
        <summary>Apple App Store Connect</summary>
        <p>
          Benötigt einen Team API Key mit Finance-Berechtigung. Der Abruf
          enthält Financial Detailed und Tagesberichte am Quartalsende;
          Tagesberichte dienen nur dem Abgleich.{" "}
          <a
            href="https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api/"
            target="_blank"
            rel="noreferrer"
          >
            Apple-Anleitung
          </a>
        </p>
        <div className="providerFields">
          <label>
            Issuer-ID
            <input
              value={credentials.apple.issuerId}
              autoComplete="off"
              onChange={(e) =>
                setCredentials((c) => ({
                  ...c,
                  apple: { ...c.apple, issuerId: e.target.value.trim() },
                }))
              }
            />
          </label>
          <label>
            Key-ID
            <input
              value={credentials.apple.keyId}
              autoComplete="off"
              onChange={(e) =>
                setCredentials((c) => ({
                  ...c,
                  apple: { ...c.apple, keyId: e.target.value.trim() },
                }))
              }
            />
          </label>
          <label>
            Vendor-Nummer
            <input
              inputMode="numeric"
              value={credentials.apple.vendor}
              autoComplete="off"
              onChange={(e) =>
                setCredentials((c) => ({
                  ...c,
                  apple: { ...c.apple, vendor: e.target.value.trim() },
                }))
              }
            />
          </label>
          <label>
            Privater Team-Schlüssel (.p8)
            <input
              type="file"
              accept=".p8,.pem"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void file.text().then((privateKey) =>
                    setCredentials((c) => ({
                      ...c,
                      apple: { ...c.apple, privateKey },
                    })),
                  );
              }}
            />{" "}
            <small>
              {credentials.apple.privateKey
                ? "Schlüssel geladen"
                : "Noch kein Schlüssel geladen"}
            </small>
          </label>
        </div>
        {actions("apple")}
      </details>
      <details>
        <summary>Google Play Earnings</summary>
        <p>
          Benötigt die Cloud-Storage-URI aus Play Console → Berichte herunterladen → Finanzen (der Bucket kann pubsite_prod_… oder pubsite_prod_rev_… heißen) und einen Service
          Account mit den globalen Berechtigungen „Finanzdaten einsehen“ und
          „App-Informationen ansehen“.{" "}
          <a
            href="https://support.google.com/googleplay/android-developer/answer/6135870?hl=de"
            target="_blank"
            rel="noreferrer"
          >
            Google-Anleitung
          </a>
        </p>
        <div className="providerFields">
          <label>
            Cloud-Storage-Bucket
            <input
              value={credentials.google.bucket}
              placeholder="pubsite_prod_rev_…"
              autoComplete="off"
              onChange={(e) =>
                setCredentials((c) => ({
                  ...c,
                  google: { ...c.google, bucket: e.target.value.trim() },
                }))
              }
            />
          </label>
          <label>
            Service-Account-Schlüssel (.json)
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void file.text().then((serviceAccountJson) =>
                    setCredentials((c) => ({
                      ...c,
                      google: { ...c.google, serviceAccountJson },
                    })),
                  );
              }}
            />{" "}
            <small>
              {credentials.google.serviceAccountJson
                ? "Schlüssel geladen"
                : "Noch kein Schlüssel geladen"}
            </small>
          </label>
        </div>
        {actions("google")}
      </details>
      <details>
        <summary>Appodeal Reporting</summary>
        <p>
          API Key und User ID stehen in deinem{" "}
          <a
            href="https://app.appodeal.com/user_profile/edit/api_credentials"
            target="_blank"
            rel="noreferrer"
          >
            Appodeal-Profil unter API Credentials
          </a>
          . Die Statistik ersetzt den Auszahlungsbeleg nicht.
        </p>
        <div className="providerFields">
          <label>
            User ID
            <input
              inputMode="numeric"
              value={credentials.appodeal.userId}
              autoComplete="off"
              onChange={(e) =>
                setCredentials((c) => ({
                  ...c,
                  appodeal: { ...c.appodeal, userId: e.target.value.trim() },
                }))
              }
            />
          </label>
          <label>
            Reporting API Key
            <input
              type="password"
              autoComplete="off"
              value={credentials.appodeal.apiKey}
              onChange={(e) =>
                setCredentials((c) => ({
                  ...c,
                  appodeal: { ...c.appodeal, apiKey: e.target.value.trim() },
                }))
              }
            />
          </label>
        </div>
        {actions("appodeal")}
      </details>
      {!!message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
      {running && (
        <button
          className="secondaryBtn"
          type="button"
          onClick={() => {
            controller.current?.abort();
            cancelImport();
          }}
        >
          Abruf stoppen
        </button>
      )}
      {!!warnings.length && (
        <ul>
          {warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      )}
      <div className="providerDebug">
        <button type="button" className="secondaryBtn" disabled={!debugCount || locked || debugDownloading} onClick={() => void downloadDebug()}>
          Debug-ZIP herunterladen{debugCount ? ` · ${debugCount} Einträge` : ""}
        </button>
        <p className="hint">
          Enthält die unveränderten empfangenen Berichtsdateien und ein Protokoll
          dieser Sitzung. Die Dateien können vertrauliche Finanzdaten enthalten;
          Schlüssel, Tokens und Anmeldeantworten werden nicht protokolliert.
        </p>
      </div>
    </section>
  );
}
