"use client";

import { useEffect, useState } from "react";
import type { ImportProgress, UploadFeedback } from "../lib/importer";

const titles: Record<ImportProgress["stage"], string> = {
  queued: "Import vorbereiten",
  unpacking: "ZIP entpacken",
  reading: "Belege lesen",
  exchange_rates: "Wechselkurse abrufen",
  saving: "Lokal speichern",
  done: "Import abgeschlossen",
  cancelled: "Import gestoppt",
  error: "Import mit Fehler beendet",
};

export function importIsActive(progress: ImportProgress | null) {
  return !!progress && !["done", "cancelled", "error"].includes(progress.stage);
}

export default function ImportProgressPanel({
  progress,
  feedback,
  onCancel,
}: {
  progress: ImportProgress | null;
  feedback: UploadFeedback[];
  onCancel: () => void;
}) {
  const [now, setNow] = useState(0);
  const active = importIsActive(progress);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active, progress?.startedAt]);
  if (!progress) return null;
  const time = active
    ? Math.max(now, progress.updatedAt || 0)
    : progress.updatedAt || 0;
  const elapsed = Math.max(
    0,
    Math.floor((time - (progress.startedAt || time)) / 1000),
  );
  const percent = progress.total
    ? Math.floor((progress.completed / progress.total) * 100)
    : 0;
  const slow = active && time - (progress.updatedAt || time) >= 15_000;
  return (
    <section
      className={`importProgress ${active ? "active" : progress.stage}`}
      aria-label="Importfortschritt"
    >
      <div className="importProgressHeading">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>{titles[progress.stage]}</strong>
          <span>
            {progress.total
              ? `${progress.completed} von ${progress.total} Dateien · ${percent} %`
              : active
                ? "Dateien werden ermittelt …"
                : "Keine Dateien verarbeitet"}
          </span>
        </div>
        <span className="importElapsed">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}{" "}
          verstrichen
        </span>
      </div>
      <progress
        aria-label="Dateifortschritt"
        max={progress.total || 1}
        {...(progress.total || !active ? { value: progress.completed } : {})}
      />
      {active && (
        <p className="importCurrentFile" title={progress.currentFile}>
          {progress.currentFile}
        </p>
      )}
      <p className="importDetail">{progress.detail}</p>
      {slow && (
        <p className="hint">
          Diese Datei benötigt etwas länger. Bereits erledigte Dateien sind
          gespeichert; du kannst den restlichen Import stoppen.
        </p>
      )}
      {!!feedback.length && (
        <ul className="importRecent" aria-label="Zuletzt bearbeitete Dateien">
          {feedback.slice(-3).map((item, index) => (
            <li
              className={item.level}
              key={`${feedback.length - 3 + index}-${item.message}`}
            >
              <span>
                {item.level === "error"
                  ? "Fehler"
                  : item.level === "warn"
                    ? "Prüfen"
                    : "Fertig"}
              </span>
              {item.message.length > 170
                ? `${item.message.slice(0, 170)} …`
                : item.message}
            </li>
          ))}
        </ul>
      )}
      {active && (
        <button className="secondaryBtn" onClick={onCancel}>
          Restlichen Import stoppen
        </button>
      )}
    </section>
  );
}
