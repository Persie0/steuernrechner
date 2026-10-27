"use client";

import { useEffect, useRef, useState } from "react";
import {
  PROVIDER_STORAGE_KEY,
  type AppleCredentials,
  type GoogleServiceAccount,
} from "../lib/provider-auth";
import {
  downloadAppleReports,
  downloadGoogleReports,
  downloadAppodealReport,
} from "../lib/provider-import";
import type { UploadFeedback } from "../lib/importer";

type Provider = "apple" | "google" | "appodeal";
type Credentials = {
  apple: AppleCredentials;
  google: { bucket: string; serviceAccountJson: string };
  appodeal: { apiKey: string; userId: string };
};
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
}: {
  year: number;
  quarter: number;
  disabled: boolean;
  importFiles: (files: File[]) => Promise<UploadFeedback[]>;
  cancelImport: () => void;
  onBusyChange: (busy: boolean) => void;
  onImportFeedback: (feedback: UploadFeedback[]) => void;
}) {
  const [credentials, setCredentials] = useState<Credentials>(empty);
  const [running, setRunning] = useState<Provider | null>(null);
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const load = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(PROVIDER_STORAGE_KEY) || "{}",
        );
        const blank = empty();
        setCredentials({
          apple: { ...blank.apple, ...saved.apple },
          google: { ...blank.google, ...saved.google },
          appodeal: { ...blank.appodeal, ...saved.appodeal },
        });
      } catch {
        setCredentials(empty());
      }
    };
    const cleared = () => {
      controller.current?.abort();
      setCredentials(empty());
      setMessage("");
      setWarnings([]);
    };
    queueMicrotask(load);
    window.addEventListener("provider-credentials-cleared", cleared);
    return () => {
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
  async function run(provider: Provider) {
    if (running || disabled) return;
    const abort = new AbortController();
    controller.current = abort;
    setRunning(provider);
    onBusyChange(true);
    setWarnings([]);
    try {
      const options = { signal: abort.signal, progress: setMessage };
      let result;
      if (provider === "apple")
        result = await downloadAppleReports(
          credentials.apple,
          year,
          quarter,
          options,
        );
      else if (provider === "google") {
        let serviceAccount: GoogleServiceAccount;
        try {
          serviceAccount = JSON.parse(credentials.google.serviceAccountJson);
        } catch {
          throw new Error(
            "Bitte ein gültiges Google Service-Account-JSON auswählen.",
          );
        }
        result = await downloadGoogleReports(
          {
            bucket: credentials.google.bucket
              .trim()
              .replace(/^gs:\/\//, "")
              .split("/")[0],
            serviceAccount,
          },
          year,
          quarter,
          options,
        );
      } else
        result = await downloadAppodealReport(
          credentials.appodeal,
          year,
          quarter,
          options,
        );
      if (abort.signal.aborted) return;
      setWarnings(result.warnings);
      if (result.files.length) {
        setMessage(
          `${result.files.length} Dateien abgerufen; werden lokal importiert …`,
        );
        const feedback = await importFiles(result.files);
        onImportFeedback(feedback);
        if (abort.signal.aborted) {
          setMessage(
            "Import gestoppt; bereits verarbeitete Dateien bleiben gespeichert.",
          );
          return;
        }
        if (feedback.some((item) => item.level === "error"))
          setWarnings((old) => [
            ...old,
            "Beim lokalen Import sind Fehler aufgetreten. Bitte Importmeldungen prüfen.",
          ]);
        setMessage(
          `${result.files.length} Dateien abgerufen. Ergebnisse stehen unten bei den Importmeldungen.`,
        );
      } else setMessage("Kein Bericht abgerufen. Hinweise unten prüfen.");
    } catch (error) {
      setMessage(
        abort.signal.aborted
          ? "Abruf gestoppt."
          : error instanceof Error
            ? error.message
            : "Abruf fehlgeschlagen.",
      );
    } finally {
      if (controller.current === abort) controller.current = null;
      setRunning(null);
      onBusyChange(false);
    }
  }
  const locked = !!running || disabled;
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
        onClick={() => void run(provider)}
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
      <h3>Berichte automatisch abrufen</h3>
      <p>
        Optional: Zugang einmal einrichten und Berichte für das gewählte Quartal
        abrufen. Du kannst Dateien weiterhin selbst hochladen.
      </p>
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
          Benötigt die Cloud-Storage-URI aus Play Console und einen Service
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
    </section>
  );
}
