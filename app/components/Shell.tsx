"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {StoredNotice, useUst} from "./UstProvider";

const workflow = [
  {href: "/", label: "Übersicht"},
  {href: "/berechnung", label: "Berechnung starten"},
  {href: "/finanzonline", label: "XML & Abgabe"},
];
const knowledge = [
  {href: "/lernen", label: "Grundlagen"},
  {href: "/google", label: "Google"},
  {href: "/apple", label: "Apple"},
  {href: "/appodeal", label: "Appodeal"},
  {href: "/kalkuel", label: "Kalkül"},
];

export default function Shell({children}: {children: React.ReactNode}) {
  const path = usePathname();
  const {reset} = useUst();
  const navLink = (item: {href: string; label: string}) => (
    <Link
      className={path === item.href || (item.href === "/berechnung" && path === "/dateien") ? "active" : ""}
      href={item.href}
      key={item.href}
    >
      {item.label}
    </Link>
  );

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><span className="mark">§</span><span>USt-Assistent <b>Österreich</b></span></Link>
        <StoredNotice />
        <button className="ghost danger" onClick={reset}>Lokale Daten löschen</button>
      </header>
      <div className="appFrame">
        <aside className="sidebar">
          <div className="navGroup">
            <p>ARBEITSBEREICH</p>
            {workflow.map(navLink)}
          </div>
          <div className="navGroup knowledgeGroup">
            <p>WISSEN & QUELLEN</p>
            {knowledge.map(navLink)}
          </div>
          <div className="localBox">
            <b>Privat & lokal</b>
            <span>Dateien bleiben in diesem Browser. Keine Übertragung an einen Server.</span>
          </div>
        </aside>
        <div className="content">
          {children}
          <footer>
            <p>Rechen- und Lernhilfe, keine Steuerberatung. Vor Abgabe Werte und FinanzOnline-Protokoll kontrollieren.</p>
            <div>
              <a href="https://www.bmf.gv.at/services/finanzonline/informationen-fuer-softwarehersteller/softwarehersteller-erklarungen-und-antraege.html" target="_blank">BMF XML</a>
              <a href="https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick.html" target="_blank">USP Umsatzsteuer</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
