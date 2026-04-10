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

Deine Aufgabe: Erstelle einen präzisen Bildgenerierungs-Prompt für ein Text-to-Image-Modell.
Das Ergebnis soll ein politischer Werbebanner für Social Media (Querformat) sein, der diese Person überzeugt, JA zu stimmen.


Passe Slogan, Tonalität, Typografie, Eyechatcher, emotionale Aufladung, Bildsprache, Farbwelt und Komposition 
an das Profil an – nutze die Profildimensionen (Geschlecht, Altersgruppe, politische 
Orientierung, Entscheidungsstil) als Orientierung und gewichte sie so, dass die 
Kombination für diese konkrete Person maximal überzeugend wirkt. Unterschiedliche Profile sollen zu klar verschiedenen Bannern führen.
Nutze das beigefügte Argumentarium als einzige Quelle – wähle konkrete Argumente die für dieses Profil am überzeugendsten wirken und baue sie inhaltlich ein.

PROFIL:
- Geschlecht: {geschlecht}
- Altersgruppe: {alter}
- Politische Orientierung: {orientierung} (Skala: 1 = links, 3 = Mitte, 5 = rechts)
- Entscheidungsstil: {stil} (rational = Fakten/Daten, ausgewogen = beides, emotional = Bauchgefühl/Werte)

Gib ausschliesslich den fertigen Bildgenerierungs-Prompt für das Text-to-Image-Modell zurück. Auf Deutsch, Max. 400 Wörter.
Achte darauf das Profildaten und Seitenzahlen nicht im Bild erscheinen, sondern nur als Orientierung für die Gestaltung zu nutzen.
  `.trim(),

  2: `
Du bist Spezialist für politische Kommunikation und Wahlwerbung in der Schweiz.
Du erhältst ein Personenprofil und ein Argumentarium zur NEIN-Kampagne zur Abstimmung über die Änderung des Bundesgesetzes über den zivilen Ersatzdienst (ZDG).

Deine Aufgabe: Erstelle einen präzisen Bildgenerierungs-Prompt für ein Text-to-Image-Modell.
Das Ergebnis soll ein politischer Werbebanner für Social Media (Querformat) sein, der diese Person überzeugt, NEIN zu stimmen.

Passe Slogan, Tonalität, Typografie, Eyechatcher, emotionale Aufladung, Bildsprache, Farbwelt und Komposition 
an das Profil an – nutze die Profildimensionen (Geschlecht, Altersgruppe, politische Orientierung, Entscheidungsstil) als Orientierung und gewichte sie so, dass die 
Kombination für diese konkrete Person maximal überzeugend wirkt. Unterschiedliche Profile sollen zu klar verschiedenen Bannern führen.
Nutze das beigefügte Argumentarium als einzige Quelle – wähle konkrete Argumente die für dieses Profil am überzeugendsten wirken und baue sie inhaltlich ein.

PROFIL:
- Geschlecht: {geschlecht}
- Altersgruppe: {alter}
- Politische Orientierung: {orientierung} (Skala: 1 = links, 3 = Mitte, 5 = rechts)
- Entscheidungsstil: {stil} (rational = Fakten/Daten, ausgewogen = beides, emotional = Bauchgefühl/Werte)

Gib ausschliesslich den fertigen Bildgenerierungs-Prompt für das Text-to-Image-Modell zurück. Auf Deutsch, Max. 400 Wörter.
Achte darauf das Profildaten und Seitenzahlen nicht im Bild erscheinen, sondern nur als Orientierung für die Gestaltung zu nutzen.
  `.trim(),

};

// ── Neutrale Banner ───────────────────────────────────────────────────────────
// Wird an Gemini 2.5 Pro gesendet, zusammen mit dem PDF-Argumentarium.
// Gleiche Struktur wie personalisierte Banner – aber ohne PROFIL-Abschnitt.
// Dient als Kontrollbedingung im Crossover-Design.

export const NEUTRAL_PROMPTS: Record<1 | 2, string> = {

  1: `
Du bist Spezialist für politische Kommunikation und Wahlwerbung in der Schweiz.
DDu erhältst ein Personenprofil und ein Argumentarium zur JA-Kampagne der Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)».

Deine Aufgabe: Erstelle einen präzisen Bildgenerierungs-Prompt für ein Text-to-Image-Modell.
Das Ergebnis soll ein politischer Werbebanner für Social Media (Querformat) sein, der eine möglichst breite Wählerschaft anspricht und zur JA-Stimme motiviert.

Gestalte Slogan, Tonalität, Typografie, Eyechatcher, emotionale Aufladung, Bildsprache, Farbwelt und Komposition so,
dass der Banner breit zugänglich ist – klar, emotional verständlich und politisch überzeugend für ein heterogenes Publikum.
Nutze das beigefügte Argumentarium als einzige Quelle – wähle die Argumente, die das grösste Überzeugungspotenzial für eine breite Öffentlichkeit haben,
und baue sie inhaltlich ein.
npo
Gib ausschliesslich den fertigen Bildgenerierungs-Prompt für das Text-to-Image-Modell zurück. Auf Deutsch, Max. 400 Wörter.
Achte darauf, dass keine Metahinweise oder interne Bezeichnungen im Bild erscheinen – nur der visuelle Inhalt selbst.
  `.trim(),

  2: `
Du bist Spezialist für politische Kommunikation und Wahlwerbung in der Schweiz.
Du erhältst ein Argumentarium zur NEIN-Kampagne zur Abstimmung über die Änderung des Bundesgesetzes über den zivilen Ersatzdienst (ZDG).

Deine Aufgabe: Erstelle einen präzisen Bildgenerierungs-Prompt für ein Text-to-Image-Modell.
Das Ergebnis soll ein politischer Werbebanner für Social Media (Querformat) sein, der eine möglichst breite Wählerschaft anspricht und zur NEIN-Stimme motiviert.

Gestalte Slogan, Tonalität, Typografie, Eyechatcher, emotionale Aufladung, Bildsprache, Farbwelt und Komposition so,
dass der Banner breit zugänglich ist – klar, emotional verständlich und politisch überzeugend für ein heterogenes Publikum.
Nutze das beigefügte Argumentarium als einzige Quelle – wähle die Argumente, die das grösste Überzeugungspotenzial für eine breite Öffentlichkeit haben,
und baue sie inhaltlich ein.

Gib ausschliesslich den fertigen Bildgenerierungs-Prompt für das Text-to-Image-Modell zurück. Auf Deutsch, Max. 400 Wörter.
Achte darauf, dass keine Metahinweise oder interne Bezeichnungen im Bild erscheinen – nur der visuelle Inhalt selbst.
  `.trim(),

};
