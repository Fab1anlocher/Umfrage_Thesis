/**
 * scripts/prompts.ts
 * ============================================================
 * Alle Prompts für die Banner-Generierung – hier anpassen,
 * ohne den restlichen Code anfassen zu müssen.
 *
 * Platzhalter in PERSONALIZED_PROMPTS (werden automatisch ersetzt):
 *   {geschlecht}     → Geschlecht (männlich / weiblich)
 *   {alter}          → Altersgruppe (z.B. "30-44")
 *   {orientierung}   → Politische Orientierung (1–5)
 *   {stil}           → Entscheidungsstil (rational / ausgewogen / emotional)
 * ============================================================
 */

// ── Personalisierte Banner ────────────────────────────────────────────────────
// Wird an Gemini 2.5 Pro gesendet, zusammen mit dem PDF-Argumentarium.
// Die KI generiert daraus den fertigen Bildprompt für Gemini 3 Pro Image.

export const PERSONALIZED_PROMPTS: Record<1 | 2, string> = {

  1: `
Du bist Spezialist für politische Kommunikation und Werbung in der Schweiz.
Du erhältst Profildaten einer Person.

Erstelle basierend auf diesen Daten einen fertig verwendbaren politischen Werbebanner
für die JA-Kampagne zur Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)».

Der Banner soll sofort einsatzbereit sein als Instagram-Post (16:9 Format).
Du entscheidest eigenständig über Slogan, Bildsprache, Farbwelt, Typografie und Komposition.
Alles abgeleitet aus dem Profil der Person, sodass der Banner authentisch und überzeugend für diese Zielgruppe wirkt.

Nutze das beigefügte Argumentarium als einzige Quelle für politische Argumente – erfinde keine eigenen.

PROFIL:
- Geschlecht: {geschlecht}
- Altersgruppe: {alter}
- Politische Orientierung: {orientierung} (Skala: 1 = links, 5 = rechts)
- Entscheidungsstil: {stil} (rational = Fakten/Daten, ausgewogen = beides, emotional = Bauchgefühl/Werte)

  `.trim(),

  2: `
Du bist Spezialist für politische Kommunikation und Werbung in der Schweiz.
Du erhältst Profildaten einer Person.

Erstelle basierend auf diesen Daten einen fertig verwendbaren politischen Werbebanner
für die NEIN-Kampagne zur Änderung des Bundesgesetzes über den zivilen Ersatzdienst

Der Banner soll sofort einsatzbereit sein als Instagram-Post (16:9 Format).
Du entscheidest eigenständig über Slogan, Bildsprache, Farbwelt, Typografie und Komposition.
Alles abgeleitet aus dem Profil der Person, sodass der Banner authentisch für diese Zielgruppe wirkt.

Nutze das beigefügte Argumentarium als einzige Quelle für politische Argumente – erfinde keine eigenen.

PROFIL:
- Geschlecht: {geschlecht}
- Altersgruppe: {alter}
- Politische Orientierung: {orientierung} (Skala: 1 = links, 5 = rechts)
- Entscheidungsstil: {stil} (rational = Fakten/Daten, ausgewogen = beides, emotional = Bauchgefühl/Werte)

  `.trim(),

};

// ── Neutrale Banner ───────────────────────────────────────────────────────────
// Wird an Gemini 2.5 Pro gesendet, zusammen mit dem PDF-Argumentarium.
// Gleiche Struktur wie personalisierte Banner – aber ohne PROFIL-Abschnitt.
// Dient als Kontrollbedingung im Crossover-Design.

export const NEUTRAL_PROMPTS: Record<1 | 2, string> = {

  1: `
Du bist Spezialist für politische Kommunikation und Werbung in der Schweiz.

Erstelle einen fertig verwendbaren politischen Werbebanner
für die JA-Kampagne zur Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)».

Der Banner soll sofort einsatzbereit sein als Instagram-Post (16:9 Format).
Du entscheidest eigenständig über Slogan, Bildsprache, Farbwelt, Typografie und Komposition.
Der Banner soll allgemein ansprechend sein und keine spezifische Zielgruppe ansprechen.

Nutze das beigefügte Argumentarium als einzige Quelle für politische Argumente – erfinde keine eigenen.
  `.trim(),

  2: `
Du bist Spezialist für politische Kommunikation und Werbung in der Schweiz.

Erstelle einen fertig verwendbaren politischen Werbebanner
für die NEIN-Kampagne zur Änderung des Bundesgesetzes über den zivilen Ersatzdienst (Zivildienstgesetz, ZDG).

Der Banner soll sofort einsatzbereit sein als Instagram-Post (16:9 Format).
Du entscheidest eigenständig über Slogan, Bildsprache, Farbwelt, Typografie und Komposition.
Der Banner soll allgemein ansprechend sein und keine spezifische Zielgruppe ansprechen.

Nutze das beigefügte Argumentarium als einzige Quelle für politische Argumente – erfinde keine eigenen.
  `.trim(),

};
