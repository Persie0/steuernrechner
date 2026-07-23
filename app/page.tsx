"use client";

import Link from "next/link";
import {Q2Status, useUst} from "./components/UstProvider";
import {money} from "./lib/tax";

export default function Home() {
  const {values, rows, reports} = useUst();
  const balance = values.kz000 + values.kz057 - values.kz060 - values.kz066;
  return (
    <>
      <section className="pageHero">
        <div>
          <p className="eyebrow">Von Dateien zu FinanzOnline</p>
          <h1>Eine Berechnung. <em>Ein klarer Ablauf.</em></h1>
          <p>Lade Google-, Apple-, Appodeal- und Kalkül-Dateien hoch. Der Assistent prüft sie, berechnet die Werte und führt dich bis zur XML-Erstellung.</p>
          <div className="heroActions">
            <Link className="primary" href="/berechnung">Berechnung starten</Link>
            <Link className="secondaryBtn" href="/lernen">Wissen & Quellen</Link>
          </div>
        </div>
        <aside>
          <b>Q2 / 2026</b>
          <span>Zeitraum: 1. April–30. Juni</span>
          <span>{reports.length} Originaldateien lokal gespeichert</span>
          <span>Der Upload verlässt deinen Browser nicht</span>
        </aside>
      </section>

      <section className="workflowIntro">
        <article><b>1</b><div><h2>Hochladen</h2><p>Alle Berichte in einem Schritt. Pflichtdateien werden automatisch erkannt.</p></div></article>
        <article><b>2</b><div><h2>Prüfen & berechnen</h2><p>Summen übernehmen, UVA- und ZM-Werte kontrollieren und bei Bedarf korrigieren.</p></div></article>
        <article><b>3</b><div><h2>XML & Abgabe</h2><p>U30, U13 und Prüfbericht erstellen. Das Protokoll in FinanzOnline kontrollieren.</p></div></article>
      </section>

      <section className="dashboardGrid">
        <div className="card">
          <div className="cardKicker">AKTUELLER STAND</div>
          <h2>Dateivollständigkeit</h2>
          <Q2Status />
          <Link className="textLink" href="/berechnung">Im Assistenten fortsetzen →</Link>
        </div>
        <div className="card">
          <div className="cardKicker">VORLÄUFIG</div>
          <h2>Berechnung</h2>
          <div className="metricGrid">
            <div><span>KZ057</span><b>{money(values.kz057)}</b></div>
            <div><span>KZ060</span><b>{money(values.kz060)}</b></div>
            <div><span>KZ066</span><b>{money(values.kz066)}</b></div>
            <div className={balance < 0 ? "good" : ""}><span>UVA-Kontrolle</span><b>{money(balance)}</b></div>
          </div>
          <div className="miniZm">{rows.map((row) => <p key={row.uid}><span>{row.name}</span><b>{money(row.exact)}</b></p>)}</div>
          <Link className="textLink" href="/berechnung">Werte öffnen →</Link>
        </div>
      </section>

      <section className="knowledgeTeaser">
        <div>
          <p className="eyebrow">Separater Wissensbereich</p>
          <h2>Erklärungen dann, wenn du sie brauchst</h2>
          <p>Steuerlogik, Quellen und plattformspezifische Details sind aus dem Berechnungsablauf ausgelagert und bleiben jederzeit erreichbar.</p>
        </div>
        <Link className="secondaryBtn" href="/lernen">Zum Wissen & zu den Quellen</Link>
      </section>
    </>
  );
}
