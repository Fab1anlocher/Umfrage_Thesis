/**
 * scripts/seed-banners.ts
 * ============================================================
 * Einmal-Skript zum Vorberechnen und Speichern aller Banner.
 *
 * Was dieses Skript tut:
 *  1. Liest .env.local (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *  2. Legt den Supabase-Storage-Bucket "banners" an (falls nicht vorhanden)
 *  3. Generiert SVG-Banner-Bilder für jede Kombination aus:
 *       - Vorlage (1 | 2)
 *       - Typ (neutral | personalisiert)
 *       - Altersgruppe (18-29 | 30-44 | 45-59 | 60+)
 *       - Politische Orientierung (1–5)
 *       - Entscheidungsstil (rational | emotional)
 *  4. Lädt jedes SVG in den Storage-Bucket hoch
 *  5. Schreibt die öffentlichen Bild-URLs in die Tabelle "banners"
 *
 * Ausführen (einmalig, lokal):
 *   npx tsx scripts/seed-banners.ts
 *
 * Voraussetzungen:
 *   - .env.local mit NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY
 *   - Supabase-Projekt läuft und Schema wurde eingespielt (supabase/schema.sql)
 *   - Storage-Bucket "banners" muss PUBLIC sein (anlegen oder über Dashboard aktivieren)
 * ============================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// ── 1. Umgebungsvariablen aus .env.local laden ─────────────────────────────

function loadEnvLocal(): void {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local nicht gefunden – Env-Vars müssen anderweitig gesetzt sein
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// Für Admin-Operationen (Upload, Bucket-Erstellung) wird der Service-Role-Key benötigt.
// Dieser Schlüssel ist NIEMALS im Frontend zu verwenden – nur in diesem Skript.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\n❌  Fehlende Umgebungsvariablen!\n' +
    '    Bitte folgende Variablen in .env.local setzen:\n' +
    '      NEXT_PUBLIC_SUPABASE_URL=...\n' +
    '      SUPABASE_SERVICE_ROLE_KEY=...\n' +
    '    Den Service-Role-Key findest du im Supabase-Dashboard unter:\n' +
    '    Project Settings → API → service_role (secret)\n'
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── 2. Datendefinitionen ───────────────────────────────────────────────────

const INITIATIVES = [1, 2] as const;
const AGE_GROUPS = ['18-29', '30-44', '45-59', '60+'] as const;
const POLITICAL_ORIENTATIONS = [1, 2, 3, 4, 5] as const;
const DECISION_STYLES = ['rational', 'emotional'] as const;

type InitiativeId = (typeof INITIATIVES)[number];
type AgeGroup = (typeof AGE_GROUPS)[number];
type PoliticalOrientation = (typeof POLITICAL_ORIENTATIONS)[number];
type DecisionStyle = (typeof DECISION_STYLES)[number];

// Grunddaten zu den Volksvorlagen
const INITIATIVE_META: Record<InitiativeId, { title: string; subtitle: string; icon: string }> = {
  1: {
    title: 'Volksinitiative',
    subtitle: 'Für ein Bedingungsloses Grundeinkommen',
    icon: '◎',
  },
  2: {
    title: 'Bundesgesetz',
    subtitle: 'Erneuerbare Energien & Klimaschutz 2050',
    icon: '◈',
  },
};

// Botschaften nach Vorlage, Entscheidungsstil, Altersgruppe und pol. Orientierung
type MessageConfig = { headline: string; body: string; cta: string };

/**
 * Gibt die auf die Zielgruppe zugeschnittene Botschaft zurück.
 * Die Personalisierung erfolgt auf drei Ebenen:
 *  – Entscheidungsstil  (rational → Fakten/Zahlen, emotional → Werte/Gefühle)
 *  – Altersgruppe       (altersspezifische Anliegen und Sprache)
 *  – Polit. Orientierung (links → Solidarität, rechts → Eigenverantwortung)
 */
function getMessage(
  initiativeId: InitiativeId,
  decisionStyle: DecisionStyle,
  ageGroup: AgeGroup,
  pol: PoliticalOrientation
): MessageConfig {
  // Hilfsfunktion: politische Rahmung (links / mitte / rechts)
  const frame = pol <= 2 ? 'left' : pol === 3 ? 'center' : 'right';

  // ── Initiative 1: Bedingungsloses Grundeinkommen ──────────────────────────
  if (initiativeId === 1) {
    if (decisionStyle === 'rational') {
      // Faktenbasierte Botschaft
      const headlines: Record<AgeGroup, string> = {
        '18-29': 'CHF 2 500 / Monat – Fakten zum BGE',
        '30-44': 'BGE und Familie: Die Zahlen stimmen',
        '45-59': 'Finanzierungsmodell BGE: Was Studien sagen',
        '60+':   'BGE und AHV: Eine Analyse',
      };
      const bodies: Record<typeof frame, string> = {
        left:   'OECD-Studie 2023: 73 % würden weiterarbeiten. Finanzierbar durch Umstrukturierung bestehender Sozialleistungen.',
        center: 'Modellrechnung zeigt: BGE konsolidiert 17 bestehende Sozialleistungen. Netto-Mehrkosten: 5 % des BIP.',
        right:  'Analyse HSG: BGE reduziert Bürokratie um 40 % und stärkt individuelle Eigenverantwortung.',
      };
      return {
        headline: headlines[ageGroup],
        body:     bodies[frame],
        cta:      'Ja zur Initiative',
      };
    } else {
      // Emotionale Botschaft
      const headlines: Record<AgeGroup, string> = {
        '18-29': 'Deine Freiheit. Deine Zukunft.',
        '30-44': 'Mehr Zeit für das, was zählt.',
        '45-59': 'Würde und Sicherheit für alle.',
        '60+':   'Ein Geschenk an unsere Enkelkinder.',
      };
      const bodies: Record<typeof frame, string> = {
        left:   'Stell dir vor: Kein Mensch in der Schweiz muss mehr aus Angst arbeiten. Solidarität wird Wirklichkeit.',
        center: 'Eine Gesellschaft, in der jede und jeder den Rücken frei hat – für Familie, Kreativität und Gemeinschaft.',
        right:  'Eigenverantwortung beginnt mit Sicherheit. Das BGE gibt dir die Freiheit, dein Leben selbst zu gestalten.',
      };
      return {
        headline: headlines[ageGroup],
        body:     bodies[frame],
        cta:      'Ja – für Würde und Freiheit',
      };
    }
  }

  // ── Initiative 2: Erneuerbare Energien ───────────────────────────────────
  if (decisionStyle === 'rational') {
    const headlines: Record<AgeGroup, string> = {
      '18-29': 'Erneuerbare Energien: Zahlen & Fakten',
      '30-44': 'Energiewende: Was sie wirklich kostet',
      '45-59': 'Versorgungssicherheit bis 2050: Die Daten',
      '60+':   'Klimaschutz – eine Frage der Zahlen',
    };
    const bodies: Record<typeof frame, string> = {
      left:   'Solar & Wind decken laut BFE bis 2035 bereits 60 % des Schweizer Stroms. Importabhängigkeit sinkt auf 8 %.',
      center: 'Investitionen von CHF 1,8 Mrd. / Jahr schaffen 42 000 neue Stellen – und sichern langfristig günstigere Strompreise.',
      right:  'Energieunabhängigkeit stärkt den Wirtschaftsstandort Schweiz. Modellrechnung: ROI positiv ab 2038.',
    };
    return {
      headline: headlines[ageGroup],
      body:     bodies[frame],
      cta:      'Ja zum Energiegesetz',
    };
  } else {
    const headlines: Record<AgeGroup, string> = {
      '18-29': 'Unsere Generation. Unsere Verantwortung.',
      '30-44': 'Saubere Luft für deine Kinder.',
      '45-59': 'Jetzt handeln – für das, was bleibt.',
      '60+':   'Was hinterlassen wir unseren Enkeln?',
    };
    const bodies: Record<typeof frame, string> = {
      left:   'Klimagerechtigkeit ist soziale Gerechtigkeit. Gemeinsam schaffen wir eine Schweiz, auf die wir stolz sein können.',
      center: 'Sonne, Wind und Wasser – die Kräfte der Natur für eine saubere, sichere Zukunft nutzen.',
      right:  'Eigenverantwortung heisst auch, der nächsten Generation eine intakte Umwelt zu übergeben. Jetzt anpacken.',
    };
    return {
      headline: headlines[ageGroup],
      body:     bodies[frame],
      cta:      'Ja – für unsere Zukunft',
    };
  }
}

// ── 3. SVG-Generator ───────────────────────────────────────────────────────

/**
 * Gibt eine Hintergrundfarbe zurück, die politische Orientierung codiert:
 *  1–2 (links):  Rot-Töne
 *  3   (mitte):  Blaugrau
 *  4–5 (rechts): Dunkelblau
 */
function getPoliticalColor(pol: PoliticalOrientation): string {
  if (pol <= 2) return '#C1121F';
  if (pol === 3) return '#457B9D';
  return '#1D3557';
}

/** Hellere Akzentfarbe passend zur Hauptfarbe */
function getAccentColor(pol: PoliticalOrientation): string {
  if (pol <= 2) return '#FFCCD5';
  if (pol === 3) return '#A8DADC';
  return '#A8C5DA';
}

/**
 * Generiert ein SVG-Banner (1200×630 px) als String.
 * Das Design variiert nach politischer Orientierung und Entscheidungsstil.
 */
function generatePersonalizedSvg(
  initiativeId: InitiativeId,
  ageGroup: AgeGroup,
  pol: PoliticalOrientation,
  decisionStyle: DecisionStyle
): string {
  const meta = INITIATIVE_META[initiativeId];
  const msg = getMessage(initiativeId, decisionStyle, ageGroup, pol);
  const bg = getPoliticalColor(pol);
  const accent = getAccentColor(pol);
  const isEmotional = decisionStyle === 'emotional';

  // Zeilenumbruch für body-Text (max ~60 Zeichen pro Zeile)
  const bodyLines = wrapText(msg.body, 58);

  // Dekoratives Element: bei emotional = organische Kreise, bei rational = Raster
  const decoration = isEmotional
    ? `<circle cx="1100" cy="80" r="160" fill="${accent}" opacity="0.15"/>
       <circle cx="950"  cy="580" r="100" fill="${accent}" opacity="0.10"/>
       <circle cx="100"  cy="500" r="80"  fill="${accent}" opacity="0.08"/>`
    : `<line x1="0" y1="420" x2="1200" y2="420" stroke="${accent}" stroke-width="1" opacity="0.2"/>
       <line x1="0" y1="460" x2="1200" y2="460" stroke="${accent}" stroke-width="1" opacity="0.1"/>
       <rect x="80" y="80" width="4" height="260" fill="${accent}" opacity="0.4"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <!-- Hintergrund -->
  <rect width="1200" height="630" fill="${bg}"/>

  <!-- Dekorative Elemente (Stil: ${decisionStyle}) -->
  ${decoration}

  <!-- Obere Leiste -->
  <rect width="1200" height="8" fill="${accent}" opacity="0.6"/>

  <!-- Initiative-Badge -->
  <rect x="80" y="48" width="320" height="36" rx="18" fill="${accent}" opacity="0.2"/>
  <text x="100" y="72" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="14" font-weight="600" fill="${accent}" letter-spacing="1">
    ${meta.icon}  VORLAGE ${initiativeId} · ${ageGroup} · ${decisionStyle.toUpperCase()}
  </text>

  <!-- Hauptüberschrift -->
  <text x="80" y="180" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="52" font-weight="800" fill="white" letter-spacing="-1">
    ${escapeXml(msg.headline)}
  </text>

  <!-- Untertitel der Initiative -->
  <text x="80" y="230" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="18" font-weight="400" fill="${accent}" opacity="0.9">
    ${escapeXml(meta.subtitle)}
  </text>

  <!-- Body-Text -->
  ${bodyLines.map((line, i) => `
  <text x="80" y="${310 + i * 32}" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="20" font-weight="300" fill="white" opacity="0.9">
    ${escapeXml(line)}
  </text>`).join('')}

  <!-- CTA-Button -->
  <rect x="80" y="530" width="${Math.min(msg.cta.length * 14 + 60, 400)}" height="52" rx="26"
        fill="white" opacity="0.95"/>
  <text x="${80 + Math.min(msg.cta.length * 14 + 60, 400) / 2}" y="562"
        font-family="Helvetica Neue, Arial, sans-serif"
        font-size="18" font-weight="700" fill="${bg}"
        text-anchor="middle">
    ${escapeXml(msg.cta)}
  </text>

  <!-- Pol.-Orientierung-Indikator (Punkte) -->
  ${POLITICAL_ORIENTATIONS.map((p) => `
  <circle cx="${1080 + (p - 1) * 22}" cy="590" r="6"
          fill="${p === pol ? 'white' : accent}" opacity="${p === pol ? '1' : '0.3'}"/>`).join('')}
  <text x="1080" y="616" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="11" fill="${accent}" opacity="0.6">links</text>
  <text x="1158" y="616" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="11" fill="${accent}" opacity="0.6">rechts</text>
</svg>`;
}

/**
 * Generiert ein neutrales SVG-Banner (nicht personalisiert, für alle gleich).
 */
function generateNeutralSvg(initiativeId: InitiativeId): string {
  const meta = INITIATIVE_META[initiativeId];
  const descriptions: Record<InitiativeId, { text1: string; text2: string }> = {
    1: {
      text1: 'Alle in der Schweiz wohnhaften Personen erhalten',
      text2: 'ein monatliches Grundeinkommen von CHF 2 500.',
    },
    2: {
      text1: 'Der Bund fördert den Ausbau erneuerbarer Energien',
      text2: 'und die Abkehr von fossilen Brennstoffen bis 2050.',
    },
  };
  const desc = descriptions[initiativeId];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <!-- Hintergrund (neutral: Hellgrau) -->
  <rect width="1200" height="630" fill="#F0F0F0"/>
  <rect width="1200" height="8" fill="#CCCCCC"/>

  <!-- Badge -->
  <rect x="80" y="48" width="200" height="36" rx="18" fill="#CCCCCC" opacity="0.5"/>
  <text x="100" y="72" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="14" font-weight="600" fill="#555" letter-spacing="1">
    VORLAGE ${initiativeId} · NEUTRAL
  </text>

  <!-- Icon -->
  <text x="80" y="190" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="64" fill="#999">
    ${meta.icon}
  </text>

  <!-- Titel -->
  <text x="80" y="280" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="42" font-weight="700" fill="#222">
    ${escapeXml(meta.subtitle)}
  </text>

  <!-- Beschreibungstext -->
  <text x="80" y="340" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="22" font-weight="300" fill="#444">
    ${escapeXml(desc.text1)}
  </text>
  <text x="80" y="372" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="22" font-weight="300" fill="#444">
    ${escapeXml(desc.text2)}
  </text>

  <!-- Neutrale Abstimmungsinfo -->
  <rect x="80" y="450" width="340" height="2" fill="#CCCCCC"/>
  <text x="80" y="480" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="16" fill="#888">
    Eidgenössische Abstimmung · Informationsbanner
  </text>

  <!-- CTA -->
  <rect x="80" y="520" width="200" height="52" rx="26" fill="#555"/>
  <text x="180" y="552" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="18" font-weight="600" fill="white" text-anchor="middle">
    Mehr erfahren
  </text>
</svg>`;
}

// ── 4. Hilfsfunktionen ─────────────────────────────────────────────────────

/** Escaped XML-Sonderzeichen für SVG-Text-Nodes */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Bricht einen Text an Wortgrenzen auf max. `maxLen` Zeichen pro Zeile um */
function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxLen) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Lädt einen SVG-String in den Supabase-Storage-Bucket hoch */
async function uploadSvg(
  path: string,
  svgContent: string
): Promise<string> {
  const buffer = Buffer.from(svgContent, 'utf-8');

  const { error } = await supabase.storage
    .from('banners')
    .upload(path, buffer, {
      contentType: 'image/svg+xml',
      upsert: true, // Überschreibt vorhandene Dateien (Idempotenz)
    });

  if (error) throw new Error(`Upload fehlgeschlagen (${path}): ${error.message}`);

  // Öffentliche URL aus dem Storage-Bucket ableiten
  const { data } = supabase.storage.from('banners').getPublicUrl(path);
  return data.publicUrl;
}

// ── 5. Hauptlogik ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🚀  Banner-Seed-Skript gestartet\n');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Service Key:  ${SERVICE_ROLE_KEY.slice(0, 20)}...`);

  // Storage-Bucket sicherstellen
  console.log('\n📦  Prüfe Storage-Bucket "banners"…');
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === 'banners');
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket('banners', { public: true });
    if (error) {
      console.error('❌  Bucket konnte nicht erstellt werden:', error.message);
      console.error('    → Erstelle den Bucket manuell im Supabase-Dashboard:');
      console.error('      Storage → New bucket → Name: "banners" → Public: ✓');
      process.exit(1);
    }
    console.log('   ✓ Bucket "banners" erstellt (public)');
  } else {
    console.log('   ✓ Bucket "banners" vorhanden');
  }

  // Bestehende Banner-Einträge löschen (Neustart)
  console.log('\n🗑   Bestehende Einträge in "banners" löschen…');
  const { error: deleteError } = await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.warn('   ⚠ Löschen fehlgeschlagen:', deleteError.message);
  } else {
    console.log('   ✓ Tabelle geleert');
  }

  let uploaded = 0;
  let inserted = 0;
  const errors: string[] = [];

  // ── Neutrale Banner (2 Stück, je einer pro Vorlage) ─────────────────────
  console.log('\n🎨  Generiere neutrale Banner…');
  for (const initiativeId of INITIATIVES) {
    const path = `initiative-${initiativeId}/neutral.svg`;
    try {
      const svg = generateNeutralSvg(initiativeId);
      const imageUrl = await uploadSvg(path, svg);
      uploaded++;

      const { error } = await supabase.from('banners').insert({
        initiative_id: initiativeId,
        type: 'neutral',
        age_group: null,
        political_orientation: null,
        decision_style: null,
        image_url: imageUrl,
      });
      if (error) throw new Error(error.message);
      inserted++;
      console.log(`   ✓ Neutral · Vorlage ${initiativeId}`);
    } catch (err) {
      const msg = `Neutral Vorlage ${initiativeId}: ${err instanceof Error ? err.message : err}`;
      errors.push(msg);
      console.error(`   ✗ ${msg}`);
    }
  }

  // ── Personalisierte Banner (80 Kombinationen) ─────────────────────────────
  console.log('\n🎨  Generiere personalisierte Banner…');
  const total = INITIATIVES.length * AGE_GROUPS.length * POLITICAL_ORIENTATIONS.length * DECISION_STYLES.length;
  let current = 0;

  for (const initiativeId of INITIATIVES) {
    for (const ageGroup of AGE_GROUPS) {
      for (const pol of POLITICAL_ORIENTATIONS) {
        for (const decisionStyle of DECISION_STYLES) {
          current++;
          const path = `initiative-${initiativeId}/personalized/${ageGroup}_pol${pol}_${decisionStyle}.svg`;
          try {
            const svg = generatePersonalizedSvg(initiativeId, ageGroup, pol, decisionStyle);
            const imageUrl = await uploadSvg(path, svg);
            uploaded++;

            const { error } = await supabase.from('banners').insert({
              initiative_id: initiativeId,
              type: 'personalized',
              age_group: ageGroup,
              political_orientation: pol,
              decision_style: decisionStyle,
              image_url: imageUrl,
            });
            if (error) throw new Error(error.message);
            inserted++;

            process.stdout.write(`\r   ✓ ${current}/${total} – Vorlage ${initiativeId} · ${ageGroup} · Pol ${pol} · ${decisionStyle}   `);
          } catch (err) {
            const msg = `Vorlage ${initiativeId} / ${ageGroup} / pol${pol} / ${decisionStyle}: ${err instanceof Error ? err.message : err}`;
            errors.push(msg);
          }
        }
      }
    }
  }
  console.log('');

  // ── Zusammenfassung ───────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('📊  Zusammenfassung');
  console.log(`   Hochgeladen:  ${uploaded} SVG-Dateien`);
  console.log(`   Eingetragen:  ${inserted} Datenbankeinträge`);
  if (errors.length > 0) {
    console.log(`\n⚠   ${errors.length} Fehler:`);
    errors.forEach((e) => console.log(`   - ${e}`));
  } else {
    console.log('\n✅  Alle Banner erfolgreich generiert und gespeichert!');
  }
  console.log('─'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\n💥  Unerwarteter Fehler:', err);
  process.exit(1);
});
