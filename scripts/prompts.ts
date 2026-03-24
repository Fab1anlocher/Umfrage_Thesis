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
Du erhältst Profildaten einer Person und ein Argumentarium.

Erstelle einen Bildgenerierungs-Prompt für einen politischen Werbebanner welcher überzeugen soll.
für die JA-Kampagne zur Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)».

Der Banner soll als Instagram-Post (16:9 Format) einsatzbereit sein.
Passe Slogan, Bildsprache, Farbwelt und Komposition eigenständig an das Profil an – jede Profildimension (Geschlecht, Altersgruppe, politische Orientierung, Entscheidungsstil) soll das visuelle Gesamtkonzept spürbar beeinflussen, sodass unterschiedliche Profile zu klar erkennbar verschiedenen Bannern führen.
Nutze das beigefügte Argumentarium als einzige Quelle für politische Argumente.

PROFIL:
- Geschlecht: {geschlecht}
- Altersgruppe: {alter}
- Politische Orientierung: {orientierung} (Skala: 1 = links, 5 = rechts)
- Entscheidungsstil: {stil} (rational = Fakten/Daten, ausgewogen = beides, emotional = Bauchgefühl/Werte)

Gib NUR den Bildgenerierungs-Prompt zurück – ein einziger Absatz auf Deutsch, max. 250 Wörter.
Keine Erklärungen, keine Überschriften, keine Aufzählungen. Nur der Prompt.
  `.trim(),

  2: `
Du bist Spezialist für politische Kommunikation und Werbung in der Schweiz.
Du erhältst Profildaten einer Person und ein Argumentarium.

Erstelle einen Bildgenerierungs-Prompt für einen politischen Werbebanner welcher überzeugen soll.
für die NEIN-Kampagne zur Änderung des Bundesgesetzes über den zivilen Ersatzdienst (ZDG).

Der Banner soll als Instagram-Post (16:9 Format) einsatzbereit sein.
Passe Slogan, Bildsprache, Farbwelt und Komposition eigenständig an das Profil an – jede Profildimension (Geschlecht, Altersgruppe, politische Orientierung, Entscheidungsstil) soll das visuelle Gesamtkonzept spürbar beeinflussen, sodass unterschiedliche Profile zu klar erkennbar verschiedenen Bannern führen.
Nutze das beigefügte Argumentarium als einzige Quelle für politische Argumente.

PROFIL:
- Geschlecht: {geschlecht}
- Altersgruppe: {alter}
- Politische Orientierung: {orientierung} (Skala: 1 = links, 5 = rechts)
- Entscheidungsstil: {stil} (rational = Fakten/Daten, ausgewogen = beides, emotional = Bauchgefühl/Werte)

Gib NUR den Bildgenerierungs-Prompt zurück – ein einziger Absatz auf Deutsch, max. 250 Wörter.
Keine Erklärungen, keine Überschriften, keine Aufzählungen. Nur der Prompt.
  `.trim(),

};

// ── Neutrale Banner ───────────────────────────────────────────────────────────
// Wird an Gemini 2.5 Pro gesendet, zusammen mit dem PDF-Argumentarium.
// Gleiche Struktur wie personalisierte Banner – aber ohne PROFIL-Abschnitt.
// Dient als Kontrollbedingung im Crossover-Design.

export const NEUTRAL_PROMPTS: Record<1 | 2, string> = {

  1: `
Du bist Spezialist für politische Kommunikation und Werbung in der Schweiz.

Erstelle einen Bildgenerierungs-Prompt für einen politischen Werbebanner
für die JA-Kampagne zur Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)».

Der Banner soll als Instagram-Post (16:9 Format) einsatzbereit sein, allgemein ansprechend, ohne spezifische Zielgruppe.
Nutze das beigefügte Argumentarium als einzige Quelle für politische Argumente.

Gib NUR den Bildgenerierungs-Prompt zurück – ein einziger Absatz auf Deutsch, max. 200 Wörter.
Keine Erklärungen, keine Überschriften, keine Aufzählungen. Nur der Prompt.
  `.trim(),

  2: `
Du bist Spezialist für politische Kommunikation und Werbung in der Schweiz.

Erstelle einen Bildgenerierungs-Prompt für einen politischen Werbebanner
für die NEIN-Kampagne zur Änderung des Bundesgesetzes über den zivilen Ersatzdienst (Zivildienstgesetz, ZDG).

Der Banner soll als Instagram-Post (16:9 Format) einsatzbereit sein, allgemein ansprechend, ohne spezifische Zielgruppe.
Nutze das beigefügte Argumentarium als einzige Quelle für politische Argumente.

Gib NUR den Bildgenerierungs-Prompt zurück – ein einziger Absatz auf Deutsch, max. 200 Wörter.
Keine Erklärungen, keine Überschriften, keine Aufzählungen. Nur der Prompt.
  `.trim(),

};
