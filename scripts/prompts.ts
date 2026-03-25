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
Du bist Spezialist für politische Kommunikation und Wahlwerbung in der Schweiz.
Du erhältst ein Personenprofil und ein Argumentarium zur JA-Kampagne der Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)».

Deine Aufgabe: Erstelle einen präzisen Bildgenerierungs-Prompt für ein Text-to-Image-Modell
Das Ergebnis soll ein politischer Werbebanner für Instagram sein, der diese Person überzeugt, JA zu stimmen.
Passe Slogan, Bildsprache, Farbwelt und Komposition eigenständig an das Profil an – jede Profildimension (Geschlecht, Altersgruppe, politische Orientierung, Entscheidungsstil) soll das visuelle Gesamtkonzept  beeinflussen, sodass unterschiedliche Profile zu klar erkennbar verschiedenen Bannern führen und die Werbung effektiv wirkt .
Nutze das beigefügte Argumentarium als einzige Quelle – wähle  konkrete Argumente die für dieses Profil am überzeugendsten wirken und baue sie inhaltlich ein.

PROFIL:
- Geschlecht: {geschlecht}
- Altersgruppe: {alter}
- Politische Orientierung: {orientierung} (Skala: 1 = links, 5 = rechts)
- Entscheidungsstil: {stil} (rational = Fakten/Daten, ausgewogen = beides, emotional = Bauchgefühl/Werte)

Gib ausschliesslich den fertigen Bildgenerierungs-Prompt zurück – 
fliessend formuliert, 150–200 Wörter
  `.trim(),

  2: `
Du bist Spezialist für politische Kommunikation und Wahlwerbung in der Schweiz.
Du erhältst ein Personenprofil und ein Argumentarium zur NEIN-Kampagne zur Änderung des Bundesgesetzes über den zivilen Ersatzdienst (ZDG).

Deine Aufgabe: Erstelle einen präzisen Bildgenerierungs-Prompt für ein Text-to-Image-Modell
Das Ergebnis soll ein politischer Werbebanner für Instagram sein, der diese Person überzeugt, NEIN zu stimmen.
Passe Slogan, Bildsprache, Farbwelt und Komposition eigenständig an das Profil an – jede Profildimension (Geschlecht, Altersgruppe, politische Orientierung, Entscheidungsstil) soll das visuelle Gesamtkonzept  beeinflussen, sodass unterschiedliche Profile zu klar erkennbar verschiedenen Bannern führen und die Werbung effektiv wirkt .
Nutze das beigefügte Argumentarium als  Quelle – wähle  konkrete Argumente die für dieses Profil am überzeugendsten wirken und baue sie inhaltlich ein.

PROFIL:
- Geschlecht: {geschlecht}
- Altersgruppe: {alter}
- Politische Orientierung: {orientierung} (Skala: 1 = links, 5 = rechts)
- Entscheidungsstil: {stil} (rational = Fakten/Daten, ausgewogen = beides, emotional = Bauchgefühl/Werte)

Gib ausschliesslich den fertigen Bildgenerierungs-Prompt zurück – in deutsch,
fliessend formuliert, 160–240 Wörter
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

Der Banner soll als Instagram-Post  einsatzbereit sein, allgemein ansprechend, ohne spezifische Zielgruppe.
Nutze das beigefügte Argumentarium als einzige Quelle – wähle  konkrete Argumente die für dieses Profil am überzeugendsten wirken und baue sie inhaltlich ein.

Gib NUR den Bildgenerierungs-Prompt zurück – ein einziger Absatz auf Deutsch, max. 300 Wörter.
Politsche Werbung – Nur der Prompt für das Text-To-Image-Modell.
  `.trim(),

  2: `
Du bist Spezialist für politische Kommunikation und Werbung in der Schweiz.

Erstelle einen Bildgenerierungs-Prompt für einen politischen Werbebanner
für die NEIN-Kampagne zur Änderung des Bundesgesetzes über den zivilen Ersatzdienst (Zivildienstgesetz, ZDG).

Der Banner soll als Instagram-Post  einsatzbereit sein, allgemein ansprechend, ohne spezifische Zielgruppe.
Nutze das beigefügte Argumentarium als einzige Quelle – wähle  konkrete Argumente die für dieses Profil am überzeugendsten wirken und baue sie inhaltlich ein.

Gib NUR den Bildgenerierungs-Prompt zurück – ein einziger Absatz auf Deutsch, max. 300 Wörter.
Politsche Werbung – Nur der Prompt für das Text-To-Image-Modell.
  `.trim(),

};
