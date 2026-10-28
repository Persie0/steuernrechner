"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoredNotice, useUst } from "./UstProvider";
import { useBooks } from "./BookkeepingProvider";

const workflow = [
  { href: "/", label: "Übersicht" },
  { href: "/berechnung", label: "Quartalsdurchlauf" },
  { href: "/ausgaben", label: "Alle Ausgaben" },
  { href: "/dateien", label: "Alle Dateien" },
  { href: "/appodeal", label: "Appodeal" },
  { href: "/finanzonline", label: "UVA/ZM · Abgabe" },
  { href: "/breakdown", label: "Berechnungsdetails" },
  { href: "/einstellungen", label: "Einstellungen & Backup" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { reset } = useUst();
  const { clearBooks } = useBooks();
  async function resetAll() {
    if (
      !confirm(
        "Alle lokal gespeicherten Buchungen, Dateien, Einstellungen und API-Zugänge löschen?",
      )
    )
      return;
    clearBooks();
    localStorage.removeItem("steuernrechner-gemini-key-v1");
    await reset(true);
  }
  const navLink = (item: { href: string; label: string }) => (
    <Link
      className={
        path === item.href
          ? "active"
          : ""
      }
      href={item.href}
      key={item.href}
    >
      {item.label}
    </Link>
  );

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="mark">§</span>
          <span>
            Steuernrechner <b>Österreich</b>
          </span>
        </Link>
        <StoredNotice />
        <button className="ghost danger" onClick={() => void resetAll()}>
          Lokale Daten löschen
        </button>
      </header>
      <div className="appFrame">
        <aside className="sidebar">
          <div className="navGroup">
            <p>DEINE QUARTALSMELDUNG</p>
            {workflow.map(navLink)}
          </div>
          <div className="localBox">
            <b>Lokal gespeichert</b>
            <span>
              Gespeicherte Buchhaltungsdaten bleiben in diesem Browser. Beim
              optionalen Gemini-Import geht der gewählte Beleg an Google. Beim
              Plattformabruf werden Berichte und Zugangsdaten beziehungsweise
              Tokens über Vercel durchgeleitet.
            </span>
          </div>
        </aside>
        <div className="content">
          {children}
          <footer>
            <p>
              Rechen- und Lernhilfe, keine Steuerberatung. Vor Abgabe Werte und
              FinanzOnline-Protokoll kontrollieren.
            </p>
            <div>
              <a
                href="https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller/softwarehersteller-erklarungen-und-antraege.html"
                target="_blank"
              >
                BMF XML
              </a>
              <a
                href="https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick.html"
                target="_blank"
              >
                USP Umsatzsteuer
              </a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
