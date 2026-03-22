/**
 * scripts/seed-banners.ts
 * ============================================================
 * Vorproduktions-Skript: Generiert alle Banner-Bilder via
 * Text-to-Image KI und speichert sie in Supabase.
 *
 * Konzept (wie eine Live-Umfrage, nur vorproduziert):
 *  → Live:     Teilnehmer füllt Formular aus → seine Daten →
 *              API-Call an Bildgenerator → 1 personalisiertes Bild
 *  → Hier:     Wir iterieren durch ALLE Kombinationen und tun
 *              dasselbe für jede – Resultat: fertige Bilder in DB
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
import { readFileSync } from 'fs';
import { join } from 'path';

// ─────────────────────────────────────────────────────────────────────────────
//  PROMPTS – HIER ANPASSEN
//  ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
// Diese zwei Objekte bestimmen, WAS auf den Bannern zu sehen ist.
// content  → inhaltliche Beschreibung (Menschen, Motive, Szene)
// style    → visueller Stil, Qualität, Format
// Die demografischen Anpassungen (Alter, Pol., Stil) werden
// automatisch unten in buildPrompt() ergänzt.
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
//  Ende Prompt-Bereich
// ─────────────────────────────────────────────────────────────────────────────

// ── Typen & Konstanten ────────────────────────────────────────────────────────

type InitiativeId = 1 | 2;
type AgeGroup = '18-29' | '30-44' | '45-59' | '60+';
type PoliticalOrientation = 1 | 2 | 3 | 4 | 5;
type DecisionStyle = 'rational' | 'emotional';

const INITIATIVES:             InitiativeId[]       = [1, 2];
const AGE_GROUPS:              AgeGroup[]           = ['18-29', '30-44', '45-59', '60+'];
const POLITICAL_ORIENTATIONS:  PoliticalOrientation[] = [1, 2, 3, 4, 5];
const DECISION_STYLES:         DecisionStyle[]      = ['rational', 'emotional'];

// ── Prompt-Builder ─────────────────────────────────────────────────────────────

/**
 * Baut den finalen DALL-E-Prompt aus dem Basis-Prompt + demografischen Daten.
 *
 * Genau so würde es in einer Live-Umfrage funktionieren:
 *   Nutzer-Daten (Alter, pol. Orientierung, Entscheidungsstil)
 *   → diese Funktion
 *   → API-Call
 *   → personalisiertes Bild
 *
 * Hier rufen wir sie einfach für alle Kombinationen auf.
 */
function buildPrompt(
  initiativeId: InitiativeId,
  ageGroup: AgeGroup,
  pol: PoliticalOrientation,
  decisionStyle: DecisionStyle
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
    emotional:
      'Warm, human-centred composition. Faces and emotions visible. ' +
      'Soft natural light, organic elements. Evokes hope, connection and belonging.',
  };

  return [
    base.content,
    base.style,
    ageModifier[ageGroup],
    polModifier[pol],
    styleModifier[decisionStyle],
  ]
    .map((s) => s.trim())
    .join('\n');
}

/**
 * Prompt für den neutralen (nicht personalisierten) Banner.
 * Gleiche Logik wie live – nur ohne demografische Anpassung.
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

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const GEMINI_API_KEY    = process.env.GEMINI_API_KEY ?? '';

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

// ── Bild generieren & hochladen ───────────────────────────────────────────────

/**
 * Sendet den Prompt an Gemini Image, empfängt das Base64-Bild und
 * speichert es im Supabase-Storage-Bucket "banners".
 * Gibt die öffentliche URL zurück.
 */
async function generateAndUpload(prompt: string, storagePath: string): Promise<string> {
  // 1. Bild bei Google Gemini generieren (exakt so wie es live passieren würde)
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
  console.log('\n🚀  Banner-Seed-Skript gestartet (Gemini Image)\n');

  // Bucket sicherstellen
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

  // Alte Einträge leeren
  await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✓  Tabelle "banners" geleert\n');

  const totalPersonalized = INITIATIVES.length * AGE_GROUPS.length * POLITICAL_ORIENTATIONS.length * DECISION_STYLES.length;
  const totalNeutral = INITIATIVES.length;
  const total = totalPersonalized + totalNeutral;
  console.log(`📊  Zu generierende Banner: ${total} (${totalPersonalized} personalisiert + ${totalNeutral} neutral)`);
  console.log(`💰  Geschätzte Kosten: ~$${(total * 0.04).toFixed(2)} (DALL-E 3 Standard)\n`);

  let done = 0;
  const errors: string[] = [];

  // ── Neutrale Banner ─────────────────────────────────────────────────────────
  for (const initiativeId of INITIATIVES) {
    const label = `Neutral · Vorlage ${initiativeId}`;
    try {
      const prompt = buildNeutralPrompt(initiativeId);
      const path   = `initiative-${initiativeId}/neutral.png`;
      const url    = await generateAndUpload(prompt, path);

      const { error } = await supabase.from('banners').insert({
        initiative_id:        initiativeId,
        type:                 'neutral',
        age_group:            null,
        political_orientation: null,
        decision_style:       null,
        image_url:            url,
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

  // ── Personalisierte Banner ──────────────────────────────────────────────────
  for (const initiativeId of INITIATIVES) {
    for (const ageGroup of AGE_GROUPS) {
      for (const pol of POLITICAL_ORIENTATIONS) {
        for (const decisionStyle of DECISION_STYLES) {
          const label = `Vorlage ${initiativeId} · ${ageGroup} · pol${pol} · ${decisionStyle}`;
          try {
            const prompt = buildPrompt(initiativeId, ageGroup, pol, decisionStyle);
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

  // ── Zusammenfassung ─────────────────────────────────────────────────────────
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
