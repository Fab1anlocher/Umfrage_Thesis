/**
 * scripts/seed-banners.ts
 * ============================================================
 * Vorproduktions-Skript: Generiert alle Banner-Bilder via
 * Text-to-Image KI und speichert sie in Supabase.
 *
 * Konzept (wie eine Live-Umfrage, nur vorproduziert):
 *  → Live:     Teilnehmer füllt Formular aus → seine Daten →
 *              Gemini Flash liest Argumentarium → extrahiert
 *              passende Argumente → Image-Modell generiert Banner
 *  → Hier:     Wir iterieren durch ALLE Kombinationen und tun
 *              dasselbe für jede – Resultat: fertige Bilder in DB
 *
 * Zweistufiger KI-Prozess pro personalisiertem Banner:
 *  Stufe 1 – Gemini Flash (Text):
 *    PDF-Argumentarium + Demografiedaten → KI wählt selbst,
 *    welche Argumente für diese Zielgruppe am überzeugendsten sind
 *  Stufe 2 – Gemini Image:
 *    Basis-Bildprompt + KI-gewählte Argumente → personalisiertes Bild
 *
 * Neutrale Banner: Kein PDF-Zugriff – rein visuell, ohne Argumente.
 *
 * Ausführen (einmalig, lokal):
 *   npm run seed:banners
 *
 * Benötigte Env-Vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Project Settings → API → service_role)
 *   GEMINI_API_KEY              (aistudio.google.com → Get API Key)
 * ============================================================
 */

import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
//  KONFIGURATION – HIER ANPASSEN
//  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
// PDF_PATH: Pfad zum politischen Argumentarium (relativ zum Projektroot).
// Das Dokument wird einmalig hochgeladen und für alle personalisierten
// Banner als Wissensquelle verwendet.
// ─────────────────────────────────────────────────────────────────────────────

const PDF_PATH = join(process.cwd(), 'argumentarium.pdf');

// ─────────────────────────────────────────────────────────────────────────────
//  BILDPROMPTS – HIER ANPASSEN
//  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
// Diese zwei Objekte bestimmen, WAS auf den Bannern visuell zu sehen ist.
// content  → inhaltliche Beschreibung (Menschen, Motive, Szene)
// style    → visueller Stil, Qualität, Format
//
// Die demografischen Anpassungen (Alter, pol. Orientierung, Entscheidungsstil)
// sowie die KI-gewählten Argumente aus dem Argumentarium werden automatisch
// in buildPrompt() ergänzt.
// ─────────────────────────────────────────────────────────────────────────────

const INITIATIVE_PROMPTS = {
  /** Volksinitiative: Bedingungsloses Grundeinkommen */
  1: {
    content: `
      Swiss political campaign poster for a universal basic income referendum (BGE).
      Show diverse people from different walks of life – a young professional, a parent,
      a craftsperson – looking relaxed and confident, symbolising financial security
      and personal freedom. Subtle Swiss alpine background or clean urban Swiss setting.
      Leave a plain area at the bottom third for text overlay.
    `,
    style: `
      Professional Swiss political advertisement photography. Clean, trustworthy,
      optimistic mood. High contrast. Photorealistic. 16:9 banner format.
      No text, no logos, no watermarks in the image.
    `,
  },

  /** Bundesgesetz: Erneuerbare Energien & Klimaschutz 2050 */
  2: {
    content: `
      Swiss political campaign poster for a renewable energy and climate law referendum.
      Show Swiss renewable energy infrastructure – solar panels on a farm roof,
      wind turbines against Alpine peaks, or a hydropower dam in a valley.
      People optionally visible in background. Swiss landscape clearly recognisable.
      Leave a plain area at the bottom third for text overlay.
    `,
    style: `
      Professional Swiss political advertisement photography. Clean, forward-looking,
      hopeful mood. Vivid natural colours. Photorealistic. 16:9 banner format.
      No text, no logos, no watermarks in the image.
    `,
  },
} as const;

//  ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
//  Ende Konfigurationsbereich
// ─────────────────────────────────────────────────────────────────────────────

// ── Typen & Konstanten ────────────────────────────────────────────────────────

type InitiativeId = 1 | 2;
type AgeGroup = '18-29' | '30-44' | '45-59' | '60+';
type PoliticalOrientation = 1 | 2 | 3 | 4 | 5;
type DecisionStyle = 'rational' | 'ausgewogen' | 'emotional';

const INITIATIVES:             InitiativeId[]         = [1, 2];
const AGE_GROUPS:              AgeGroup[]             = ['18-29', '30-44', '45-59', '60+'];
const POLITICAL_ORIENTATIONS:  PoliticalOrientation[] = [1, 2, 3, 4, 5];
const DECISION_STYLES:         DecisionStyle[]        = ['rational', 'ausgewogen', 'emotional'];

// Menschlich lesbare Labels für den Argument-Extraktions-Prompt
const AGE_LABELS: Record<AgeGroup, string> = {
  '18-29': 'young adults aged 18–29',
  '30-44': 'adults aged 30–44, possibly with family',
  '45-59': 'middle-aged adults aged 45–59',
  '60+':   'older adults aged 60 and above',
};

const POL_LABELS: Record<PoliticalOrientation, string> = {
  1: 'far-left political orientation',
  2: 'centre-left political orientation',
  3: 'centrist political orientation',
  4: 'centre-right political orientation',
  5: 'far-right political orientation',
};

const STYLE_LABELS: Record<DecisionStyle, string> = {
  rational:   'rational decision-making style (prefers facts, data, logical arguments)',
  ausgewogen: 'balanced decision-making style (weighs both facts and personal values)',
  emotional:  'emotional decision-making style (prefers gut feeling, personal values, stories)',
};

const INITIATIVE_LABELS: Record<InitiativeId, string> = {
  1: 'Volksinitiative für ein bedingungsloses Grundeinkommen (BGE) in der Schweiz',
  2: 'Bundesgesetz über den Ausbau erneuerbarer Energien und Abkehr von fossilen Brennstoffen bis 2050',
};

// ── Argument-Extraktion via Gemini Flash ──────────────────────────────────────

/**
 * Schritt 1 des zweistufigen Prozesses:
 * Gemini Flash liest das hochgeladene PDF-Argumentarium und wählt
 * SELBST die überzeugendsten Argumente für die gegebene Zielgruppe aus.
 *
 * Genau so würde es in einer Live-Umfrage funktionieren:
 *   Teilnehmer-Daten → diese Funktion → Gemini Flash analysiert PDF →
 *   gibt zielgruppenspezifische Argumente zurück → fliessen in Bildprompt
 *
 * @param fileUri  URI des hochgeladenen PDFs (Gemini File API)
 * @param initiativeId  1 = BGE, 2 = Energie
 * @param ageGroup  Altersgruppe des Teilnehmers
 * @param pol  Politische Orientierung (1 links – 5 rechts)
 * @param decisionStyle  'rational' oder 'emotional'
 * @returns 2–3 Sätze mit den von der KI gewählten Kernargumenten
 */
async function extractArguments(
  fileUri: string,
  initiativeId: InitiativeId,
  ageGroup: AgeGroup,
  pol: PoliticalOrientation,
  decisionStyle: DecisionStyle,
): Promise<string> {
  const prompt = `
You are an expert political communication strategist.
Read the attached political document (Argumentarium) about the following Swiss referendum:
"${INITIATIVE_LABELS[initiativeId]}"

Your task: Identify the 2–3 most persuasive arguments from this document
for the following specific target audience:
- Age group: ${AGE_LABELS[ageGroup]}
- Political orientation: ${POL_LABELS[pol]}
- Decision-making style: ${STYLE_LABELS[decisionStyle]}

Return ONLY the selected arguments as 2–3 concise English sentences (max. 60 words total).
These will be used as visual storytelling cues for a campaign banner image.
Do not explain your reasoning. Do not use bullet points. Just the arguments as flowing text.
  `.trim();

  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { fileData: { fileUri, mimeType: 'application/pdf' } },
          { text: prompt },
        ],
      },
    ],
  });

  return response.text?.trim() ?? '';
}

// ── Prompt-Builder ─────────────────────────────────────────────────────────────

/**
 * Schritt 2 des zweistufigen Prozesses:
 * Baut den finalen Bild-Prompt aus dem Basis-Prompt + demografischen Modifikatoren
 * + den von der KI extrahierten Argumenten.
 *
 * @param extractedArguments  Ausgabe von extractArguments() – KI-gewählte Argumente
 */
function buildPrompt(
  initiativeId: InitiativeId,
  ageGroup: AgeGroup,
  pol: PoliticalOrientation,
  decisionStyle: DecisionStyle,
  extractedArguments: string,
): string {
  const base = INITIATIVE_PROMPTS[initiativeId];

  // Altersgruppe → welche Menschen im Bild zu sehen sind
  const ageModifier: Record<AgeGroup, string> = {
    '18-29': 'The people shown are primarily young adults in their early twenties.',
    '30-44': 'The people shown are primarily adults in their thirties, possibly with family.',
    '45-59': 'The people shown are primarily middle-aged adults, established and confident.',
    '60+':   'The people shown are primarily older adults, experienced and dignified.',
  };

  // Politische Orientierung → Farbklima und visuelle Stimmung
  const polModifier: Record<PoliticalOrientation, string> = {
    1: 'Warm, solidarity-focused composition. Colour palette: reds, warm oranges, communal scenes.',
    2: 'Progressive, inclusive atmosphere. Colour palette: warm reds softened with neutral tones.',
    3: 'Balanced, pragmatic feel. Colour palette: calm blues and greens, trustworthy neutrals.',
    4: 'Orderly, reliable composition. Colour palette: deep blues, crisp whites, structured framing.',
    5: 'Traditional, individual-focused. Colour palette: dark blues, conservative, precise framing.',
  };

  // Entscheidungsstil → Bildkomposition und Stimmung
  const styleModifier: Record<DecisionStyle, string> = {
    rational:
      'Composed, structured framing. Emphasise clarity and precision. ' +
      'Clean lines, architectural or technical elements visible. Objective, factual mood.',
    ausgewogen:
      'Balanced composition blending structure and warmth. ' +
      'Mix of clear visual order and human elements. Neutral, broadly appealing mood.',
    emotional:
      'Warm, human-centred composition. Faces and emotions visible. ' +
      'Soft natural light, organic elements. Evokes hope, connection and belonging.',
  };

  // KI-gewählte Argumente aus dem Argumentarium → visuelle Botschaft
  const argumentSection = extractedArguments
    ? `Visual storytelling cue (derived from the official political document): ${extractedArguments}`
    : '';

  return [
    base.content,
    base.style,
    ageModifier[ageGroup],
    polModifier[pol],
    styleModifier[decisionStyle],
    argumentSection,
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Prompt für den neutralen (nicht personalisierten) Banner.
 * Kein PDF-Zugriff – rein visuell, ohne Zielgruppen-Argumente.
 */
function buildNeutralPrompt(initiativeId: InitiativeId): string {
  const base = INITIATIVE_PROMPTS[initiativeId];
  return [
    base.content,
    base.style,
    'Neutral, universal composition. No specific age group or demographic targeted. ' +
    'Balanced colour palette. Broadly appealing, factual and informative mood.',
  ]
    .map((s) => s.trim())
    .join('\n');
}

// ── Umgebungsvariablen ─────────────────────────────────────────────────────────

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
  } catch { /* .env.local nicht gefunden */ }
}

loadEnvLocal();

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error(`
❌  Fehlende Umgebungsvariablen in .env.local:

    NEXT_PUBLIC_SUPABASE_URL      → Supabase Dashboard → Project Settings → API
    SUPABASE_SERVICE_ROLE_KEY     → Supabase Dashboard → Project Settings → API → service_role
    GEMINI_API_KEY                → aistudio.google.com → Get API Key
  `);
  process.exit(1);
}

const genai    = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── PDF hochladen (Gemini File API) ───────────────────────────────────────────

/**
 * Lädt das Argumentarium einmalig in die Gemini File API hoch.
 * Die zurückgegebene URI wird für alle 80 personalisierten Banner wiederverwendet.
 * Dateien bleiben 48 Stunden verfügbar – ausreichend für einen Skript-Durchlauf.
 */
async function uploadPdf(pdfPath: string): Promise<string> {
  console.log(`📄  Lade Argumentarium hoch: ${pdfPath}`);
  const pdfBuffer = readFileSync(pdfPath);
  const pdfBlob   = new Blob([pdfBuffer], { type: 'application/pdf' });

  const uploaded = await genai.files.upload({
    file:   pdfBlob,
    config: { mimeType: 'application/pdf', displayName: 'Argumentarium' },
  });

  if (!uploaded.uri) throw new Error('Gemini File API hat keine URI zurückgegeben.');
  console.log(`✓  PDF hochgeladen → URI: ${uploaded.uri}\n`);
  return uploaded.uri;
}

// ── Bild generieren & hochladen ───────────────────────────────────────────────

/**
 * Sendet den fertigen Prompt an das Gemini Image-Modell, empfängt das
 * Base64-Bild und speichert es im Supabase-Storage-Bucket "banners".
 * Gibt die öffentliche URL zurück.
 */
async function generateAndUpload(prompt: string, storagePath: string): Promise<string> {
  // 1. Bild bei Google Gemini generieren
  const response = await genai.models.generateImages({
    model:  'gemini-3-pro-image-preview',
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio:    '16:9', // Querformat – ideal für Banner
    },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) throw new Error('Gemini hat kein Bild zurückgegeben.');

  // 2. Base64 → Buffer (Gemini liefert das Bild direkt, kein Download nötig)
  const imageBuffer = Buffer.from(imageBytes, 'base64');

  // 3. In Supabase Storage hochladen
  const { error } = await supabase.storage
    .from('banners')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    });
  if (error) throw new Error(`Storage-Upload fehlgeschlagen: ${error.message}`);

  // 4. Permanente öffentliche URL zurückgeben
  const { data } = supabase.storage.from('banners').getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Hauptlogik ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🚀  Banner-Seed-Skript gestartet (Gemini Flash + Gemini Image)\n');

  // ── PDF prüfen & hochladen ───────────────────────────────────────────────────
  if (!existsSync(PDF_PATH)) {
    console.error(`❌  Argumentarium nicht gefunden: ${PDF_PATH}`);
    console.error('    → Lege das PDF unter diesem Pfad ab und starte das Skript erneut.');
    process.exit(1);
  }
  const pdfUri = await uploadPdf(PDF_PATH);

  // ── Supabase Storage Bucket sicherstellen ────────────────────────────────────
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === 'banners')) {
    const { error } = await supabase.storage.createBucket('banners', { public: true });
    if (error) {
      console.error('❌  Bucket "banners" konnte nicht erstellt werden:', error.message);
      console.error('    → Erstelle ihn manuell: Storage → New bucket → "banners" → Public ✓');
      process.exit(1);
    }
    console.log('✓  Bucket "banners" erstellt\n');
  }

  // ── Alte Einträge leeren ─────────────────────────────────────────────────────
  await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✓  Tabelle "banners" geleert\n');

  const totalPersonalized = INITIATIVES.length * AGE_GROUPS.length * POLITICAL_ORIENTATIONS.length * DECISION_STYLES.length;
  const totalNeutral = INITIATIVES.length;
  const total = totalPersonalized + totalNeutral;
  console.log(`📊  Zu generierende Banner: ${total} (${totalPersonalized} personalisiert + ${totalNeutral} neutral)`);
  console.log(`ℹ   Personalisierte Banner: 2 API-Calls pro Bild (Flash → Argumente, Image → Bild)\n`);

  let done = 0;
  const errors: string[] = [];

  // ── Neutrale Banner (kein PDF-Zugriff nötig) ─────────────────────────────────
  for (const initiativeId of INITIATIVES) {
    const label = `Neutral · Vorlage ${initiativeId}`;
    try {
      const prompt = buildNeutralPrompt(initiativeId);
      const path   = `initiative-${initiativeId}/neutral.png`;
      const url    = await generateAndUpload(prompt, path);

      const { error } = await supabase.from('banners').insert({
        initiative_id:         initiativeId,
        type:                  'neutral',
        age_group:             null,
        political_orientation: null,
        decision_style:        null,
        image_url:             url,
      });
      if (error) throw new Error(error.message);

      done++;
      console.log(`[${done}/${total}] ✓  ${label}`);
    } catch (err) {
      const msg = `${label}: ${err instanceof Error ? err.message : err}`;
      errors.push(msg);
      console.error(`[${done}/${total}] ✗  ${msg}`);
    }
  }

  // ── Personalisierte Banner (zweistufig: Flash → Argumente, Image → Bild) ─────
  for (const initiativeId of INITIATIVES) {
    for (const ageGroup of AGE_GROUPS) {
      for (const pol of POLITICAL_ORIENTATIONS) {
        for (const decisionStyle of DECISION_STYLES) {
          const label = `Vorlage ${initiativeId} · ${ageGroup} · pol${pol} · ${decisionStyle}`;
          try {
            // Stufe 1: KI wählt passende Argumente aus dem Argumentarium
            const extractedArgs = await extractArguments(pdfUri, initiativeId, ageGroup, pol, decisionStyle);

            // Stufe 2: Bild-Prompt aufbauen + Bild generieren
            const prompt = buildPrompt(initiativeId, ageGroup, pol, decisionStyle, extractedArgs);
            const path   = `initiative-${initiativeId}/personalized/${ageGroup}_pol${pol}_${decisionStyle}.png`;
            const url    = await generateAndUpload(prompt, path);

            const { error } = await supabase.from('banners').insert({
              initiative_id:         initiativeId,
              type:                  'personalized',
              age_group:             ageGroup,
              political_orientation: pol,
              decision_style:        decisionStyle,
              image_url:             url,
            });
            if (error) throw new Error(error.message);

            done++;
            console.log(`[${done}/${total}] ✓  ${label}`);
          } catch (err) {
            const msg = `${label}: ${err instanceof Error ? err.message : err}`;
            errors.push(msg);
            console.error(`[${done + 1}/${total}] ✗  ${msg}`);
          }
        }
      }
    }
  }

  // ── Zusammenfassung ──────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log(`✅  Erfolgreich: ${done} / ${total} Banner`);
  if (errors.length > 0) {
    console.log(`⚠   Fehler (${errors.length}):`);
    errors.forEach((e) => console.log(`    - ${e}`));
  }
  console.log('─'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\n💥  Unerwarteter Fehler:', err);
  process.exit(1);
});
