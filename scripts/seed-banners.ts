/**
 * scripts/seed-banners.ts
 * ============================================================
 * Vorproduktions-Skript: Generiert alle Banner-Bilder via KI
 * und speichert sie in Supabase (einmalig ausführen).
 *
 * Prozess pro personalisiertem Banner (zweistufig):
 *   Stufe 1 – Gemini 2.5 Pro liest das PDF-Argumentarium und
 *             erstellt einen vollständigen Bildprompt für die
 *             Zielgruppe. Die KI interpretiert die Demografiedaten
 *             selbst – keine hardcodierten Modifier.
 *   Stufe 2 – Gemini 3 Pro Image generiert das Banner.
 *
 * Neutrale Banner werden mit PDF aber ohne Zielgruppen-Bezug generiert.
 *
 * Anzahl Banner: 2 Initiativen × (2 × 4 × 5 × 3 personalisiert + 1 neutral) = 242
 *
 * Texte & Prompts anpassen → scripts/prompts.ts
 *
 * Ausführen (einmalig, lokal, vom Projektroot):
 *   npm run seed:banners
 *
 * Benötigte Env-Vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL      → Supabase Dashboard → Project Settings → API
 *   SUPABASE_SERVICE_ROLE_KEY     → Supabase Dashboard → Project Settings → API → service_role
 *   GEMINI_API_KEY                → aistudio.google.com → Get API Key
 * ============================================================
 */

import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PERSONALIZED_PROMPTS, NEUTRAL_PROMPTS } from './prompts';

// ─────────────────────────────────────────────────────────────────────────────
//  KONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pfade zu den Argumentarien pro Initiative (relativ zum Projektroot).
 * Jedes PDF wird einmalig in die Gemini File API hochgeladen und nur
 * für die Banner der jeweiligen Initiative verwendet.
 * → Verhindert, dass die KI Argumente erfindet (Halluzination).
 */
const PDF_PATHS: Record<1 | 2, string> = {
  1: join(process.cwd(), 'argumentarien', 'argumentarium-1.pdf'),
  2: join(process.cwd(), 'argumentarien', 'argumentarium-2.pdf'),
};

// ── Typen & Konstanten ────────────────────────────────────────────────────────

type InitiativeId         = 1 | 2;
type Gender               = 'männlich' | 'weiblich';
type AgeGroup             = '18-29' | '30-44' | '45-59' | '60+';
type PoliticalOrientation = 1 | 2 | 3 | 4 | 5;
type DecisionStyle        = 'rational' | 'ausgewogen' | 'emotional';

const INITIATIVES:            InitiativeId[]         = [1, 2];
const GENDERS:                Gender[]               = ['männlich', 'weiblich'];
const AGE_GROUPS:             AgeGroup[]             = ['18-29', '30-44', '45-59', '60+'];
const POLITICAL_ORIENTATIONS: PoliticalOrientation[] = [1, 2, 3, 4, 5];
const DECISION_STYLES:        DecisionStyle[]        = ['rational', 'ausgewogen', 'emotional'];

// ── Prompt-Generierung via Gemini 2.5 Pro + PDF ───────────────────────────────

/**
 * Stufe 1: Gemini 2.5 Pro liest das Argumentarium und erstellt einen
 * vollständigen Bildprompt für Gemini 3 Pro Image.
 *
 * Die KI erhält die Rohdaten der Zielgruppe und interpretiert selbst,
 * welche Argumente passen und wie diese visuell umgesetzt werden sollen.
 * Das PDF verhindert, dass die KI Argumente halluziniert.
 */
async function buildPersonalizedImagePrompt(
  fileUri: string,
  initiativeId: InitiativeId,
  gender: Gender,
  ageGroup: AgeGroup,
  pol: PoliticalOrientation,
  decisionStyle: DecisionStyle,
): Promise<string> {
  const prompt = PERSONALIZED_PROMPTS[initiativeId]
    .replace('{geschlecht}', gender)
    .replace('{alter}', ageGroup)
    .replace('{orientierung}', String(pol))
    .replace('{stil}', decisionStyle);

  const response = await withRetry(
    () => genai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [
        { fileData: { fileUri, mimeType: 'application/pdf' } },
        { text: prompt },
      ]}],
    }),
    `personalized-prompt-${initiativeId}`,
  );

  return response.text?.trim() ?? '';
}

/**
 * Stufe 1 (neutral): Gemini 2.5 Pro liest das Argumentarium und erstellt einen
 * Bildprompt ohne Zielgruppen-Bezug. Gleiche Pipeline wie personalisiert,
 * aber ohne PROFIL-Daten – dient als Kontrollbedingung im Crossover-Design.
 */
async function buildNeutralImagePrompt(
  fileUri: string,
  initiativeId: InitiativeId,
): Promise<string> {
  const response = await withRetry(
    () => genai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [
        { fileData: { fileUri, mimeType: 'application/pdf' } },
        { text: NEUTRAL_PROMPTS[initiativeId] },
      ]}],
    }),
    `neutral-prompt-${initiativeId}`,
  );

  return response.text?.trim() ?? '';
}

// ── Umgebungsvariablen ─────────────────────────────────────────────────────────

/** Lädt .env.local manuell, da das Skript ausserhalb von Next.js läuft. */
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
  } catch { /* .env.local nicht gefunden – Env-Vars müssen anderweitig gesetzt sein */ }
}

loadEnvLocal();

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY    ?? '';
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY               ?? '';

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
 * Lädt ein Argumentarium in die Gemini File API hoch.
 * Die URI wird für alle personalisierten Banner der jeweiligen Initiative wiederverwendet.
 * Gemini-Dateien bleiben 48 Stunden verfügbar – ausreichend für einen Durchlauf.
 */
async function uploadPdf(pdfPath: string, displayName: string): Promise<string> {
  console.log(`📄  Lade Argumentarium hoch: ${pdfPath}`);
  const pdfBuffer = readFileSync(pdfPath);
  const pdfBlob   = new Blob([pdfBuffer], { type: 'application/pdf' });

  const uploaded = await genai.files.upload({
    file:   pdfBlob,
    config: { mimeType: 'application/pdf', displayName },
  });

  if (!uploaded.uri) throw new Error('Gemini File API hat keine URI zurückgegeben.');
  console.log(`✓  PDF hochgeladen → URI: ${uploaded.uri}\n`);
  return uploaded.uri;
}

// ── Rate-Limit-Schutz ─────────────────────────────────────────────────────────

const DELAY_BETWEEN_BANNERS_MS = 3_000; // Pause zwischen Bannern (3 Sekunden)
const MAX_RETRIES               = 5;     // Max. Wiederholungen bei Rate-Limit-Fehler
const RETRY_BASE_DELAY_MS       = 10_000; // Startverzögerung für Retry (10 Sekunden, verdoppelt sich)

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Führt eine async Funktion aus und wiederholt sie bei Rate-Limit-Fehlern (429)
 * mit exponentiell wachsender Wartezeit (10s, 20s, 40s, 80s, 160s).
 */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err instanceof Error &&
        (err.message.includes('429') || err.message.toLowerCase().includes('rate'));

      if (!isRateLimit || attempt === MAX_RETRIES) throw err;

      const waitMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`  ⏳  Rate Limit bei "${label}" – warte ${waitMs / 1000}s (Versuch ${attempt}/${MAX_RETRIES})`);
      await sleep(waitMs);
    }
  }
  throw new Error('Unreachable');
}

// ── Bild generieren & in Supabase hochladen ───────────────────────────────────

/**
 * Sendet den fertigen Bildprompt an Gemini 3 Pro Image, empfängt das Base64-Bild
 * und speichert es im Supabase-Storage-Bucket "banners".
 * Gibt die öffentliche URL zurück.
 */
async function generateAndUpload(imagePrompt: string, storagePath: string): Promise<string> {
  const response = await withRetry(
    () => genai.models.generateImages({
      model:  'gemini-3-pro-image-preview',
      prompt: imagePrompt,
      config: { numberOfImages: 1, aspectRatio: '16:9' },
    }),
    storagePath,
  );

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) throw new Error('Gemini hat kein Bild zurückgegeben.');

  const imageBuffer = Buffer.from(imageBytes, 'base64');

  const { error } = await supabase.storage
    .from('banners')
    .upload(storagePath, imageBuffer, { contentType: 'image/png', upsert: true });
  if (error) throw new Error(`Storage-Upload fehlgeschlagen: ${error.message}`);

  const { data } = supabase.storage.from('banners').getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Hauptlogik ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🚀  Banner-Seed-Skript gestartet\n');

  // Beide Argumentarien prüfen & hochladen (je eines pro Initiative)
  for (const [id, path] of Object.entries(PDF_PATHS)) {
    if (!existsSync(path)) {
      console.error(`❌  Argumentarium für Initiative ${id} nicht gefunden: ${path}`);
      console.error('    → Lege die PDFs im Projektroot ab: argumentarium-1.pdf, argumentarium-2.pdf');
      process.exit(1);
    }
  }
  const pdfUris: Record<1 | 2, string> = {
    1: await uploadPdf(PDF_PATHS[1], 'Argumentarium Initiative 1'),
    2: await uploadPdf(PDF_PATHS[2], 'Argumentarium Initiative 2'),
  };

  // Supabase Storage Bucket sicherstellen
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

  // Alle bestehenden Banner-Einträge löschen
  // (Supabase erfordert eine WHERE-Bedingung → Trick mit nicht-existierender UUID)
  await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✓  Tabelle "banners" geleert\n');

  const totalPersonalized = INITIATIVES.length * GENDERS.length * AGE_GROUPS.length * POLITICAL_ORIENTATIONS.length * DECISION_STYLES.length;
  const totalNeutral      = INITIATIVES.length;
  const total             = totalPersonalized + totalNeutral;

  console.log(`📊  Zu generierende Banner: ${total} (${totalPersonalized} personalisiert + ${totalNeutral} neutral)`);
  console.log(`ℹ   Je personalisiertem Banner: 2 API-Calls (2.5 Pro → Bildprompt, 3 Pro Image → Bild)\n`);

  let done = 0;
  const errors: string[] = [];

  // ── 1. Neutrale Banner (PDF via Gemini 2.5 Pro, ohne Zielgruppen-Bezug) ──────
  for (const initiativeId of INITIATIVES) {
    const label = `Neutral · Vorlage ${initiativeId}`;
    try {
      const imagePrompt = await buildNeutralImagePrompt(pdfUris[initiativeId], initiativeId);
      const path        = `initiative-${initiativeId}/neutral.png`;
      const url         = await generateAndUpload(imagePrompt, path);

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
    await sleep(DELAY_BETWEEN_BANNERS_MS);
  }

  // ── 2. Personalisierte Banner (2.5 Pro liest PDF → Bildprompt → 3 Pro Image) ─
  for (const initiativeId of INITIATIVES) {
    for (const gender of GENDERS) {
      for (const ageGroup of AGE_GROUPS) {
        for (const pol of POLITICAL_ORIENTATIONS) {
          for (const decisionStyle of DECISION_STYLES) {
            const label = `Vorlage ${initiativeId} · ${gender} · ${ageGroup} · pol${pol} · ${decisionStyle}`;
            try {
              const imagePrompt = await buildPersonalizedImagePrompt(pdfUris[initiativeId], initiativeId, gender, ageGroup, pol, decisionStyle);
              const path        = `initiative-${initiativeId}/personalized/${gender}_${ageGroup}_pol${pol}_${decisionStyle}.png`;
              const url         = await generateAndUpload(imagePrompt, path);

              const { error } = await supabase.from('banners').insert({
                initiative_id:         initiativeId,
                type:                  'personalized',
                gender,
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
            await sleep(DELAY_BETWEEN_BANNERS_MS);
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
    console.log('─'.repeat(60) + '\n');
    process.exit(1);
  }
  console.log('─'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\n💥  Unerwarteter Fehler:', err);
  process.exit(1);
});
