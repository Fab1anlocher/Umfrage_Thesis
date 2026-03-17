# Umfrage Thesis
**Der Einfluss KI-personalisierter Abstimmungswerbung auf die Wahlabsichten in der Schweiz**

A full-stack survey web application built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env.local
# Then edit .env.local and fill in your Supabase credentials

# 3. Start the dev server
npm run dev
# → App runs at http://localhost:3000
```

> **Test mode** is on by default (`NEXT_PUBLIC_TEST_MODE=true`). In test mode, banner images are replaced with styled placeholder divs so you can test the full flow before real banners are produced. All DB writes (participants, responses) work normally in test mode.

---

## Supabase Setup

1. Go to your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**
2. Paste the entire contents of [`/supabase/schema.sql`](./supabase/schema.sql) and click **Run**
3. This creates three tables: `participants`, `banners`, `responses`
4. Copy your project URL and anon key from **Project Settings → API** into `.env.local`

---

## Vercel Deployment

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
3. In **Environment Variables**, add all four variables from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_TEST_MODE`
   - `NEXT_PUBLIC_REVEAL_LABELS`
4. Click **Deploy**

---

## Go-Live Checklist

Before sharing the survey link with real participants:

- [ ] **Disable test mode:** set `NEXT_PUBLIC_TEST_MODE=false` in Vercel environment variables
- [ ] **Upload real banners** to Supabase Storage (recommended bucket: `banners`)
- [ ] **Populate the `banners` table** with the correct `image_url` values for each combination:

  | initiative_id | type | age_group | political_orientation | decision_style | image_url |
  |---|---|---|---|---|---|
  | 1 | neutral | NULL | NULL | NULL | `https://…/neutral_v1.jpg` |
  | 1 | personalized | 18-29 | 1 | rational | `https://…/v1_18-29_1_rational.jpg` |
  | 1 | personalized | 18-29 | 1 | emotional | `https://…/v1_18-29_1_emotional.jpg` |
  | … | … | … | … | … | … |

  Age groups: `18-29`, `30-44`, `45-59`, `60+`
  Decision styles: `rational` (scores 1–3), `emotional` (scores 4–5)
  Political orientation: `1`–`5`

- [ ] **Redeploy** on Vercel after updating env vars (triggers automatically on new push)
- [ ] **Test end-to-end** on a real mobile device before distributing

---

## Architecture

```
app/
  page.tsx                 ← Survey state machine (7 steps)
  layout.tsx
  globals.css
  api/
    participants/route.ts  ← POST: create participant, returns UUID
    banners/route.ts       ← GET: resolve banner URLs per crossover logic
    responses/route.ts     ← POST: save post-exposure answers

components/
  ProgressBar.tsx          ← Thin blue bar at top
  PillToggle.tsx           ← Multi-select pill group
  RangeSlider.tsx          ← Custom styled 1–5 slider
  screens/
    Screen1Intro.tsx
    Screen2Demographics.tsx
    Screen3Banners.tsx     ← Countdown timer, banner display, test mode placeholders
    Screen4Questions.tsx   ← 4-question form per initiative
    Screen5Thanks.tsx

lib/
  supabase.ts              ← Supabase client
  types.ts                 ← TypeScript interfaces
  utils.ts                 ← getAgeGroup, getDecisionStyleBucket, getBannerAssignment

supabase/
  schema.sql               ← Run once to set up DB
```

## Crossover Design

Every participant sees **both** banner types (personalised and neutral), but in reversed order per initiative depending on their randomly assigned group:

| | Volksabstimmung 1 | Volksabstimmung 2 |
|---|---|---|
| **Gruppe A** | Banner A = Neutral, Banner B = Personalisiert | Banner A = Personalisiert, Banner B = Neutral |
| **Gruppe B** | Banner A = Personalisiert, Banner B = Neutral | Banner A = Neutral, Banner B = Personalisiert |

This within-subject crossover enables both within-subject and between-subject comparison in statistical analysis.
