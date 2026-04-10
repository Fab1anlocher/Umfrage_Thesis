import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getBannerAssignment } from '@/lib/utils';
import type { BannerData } from '@/lib/types';

const VALID_INITIATIVE_IDS = [1, 2];
const VALID_AGE_GROUPS = ['18-29', '30-44', '45-59', '60+'];
const VALID_GENDERS = ['männlich', 'weiblich', 'divers'];
const VALID_DECISION_STYLES = ['rational', 'ausgewogen', 'emotional'];
const VALID_GROUPS = ['A', 'B'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const initiativeIdRaw = parseInt(searchParams.get('initiativeId') || '');
  const ageGroup = searchParams.get('ageGroup') || '';
  const gender = searchParams.get('gender') || '';
  const politicalOrientationRaw = parseInt(searchParams.get('politicalOrientation') || '');
  const decisionStyle = searchParams.get('decisionStyle') || '';
  const group = searchParams.get('group') || '';

  // Validate all parameters before proceeding
  if (!VALID_INITIATIVE_IDS.includes(initiativeIdRaw)) {
    return NextResponse.json({ error: 'Ungültige initiativeId.' }, { status: 400 });
  }
  if (!VALID_AGE_GROUPS.includes(ageGroup)) {
    return NextResponse.json({ error: 'Ungültige ageGroup.' }, { status: 400 });
  }
  if (!VALID_GENDERS.includes(gender)) {
    return NextResponse.json({ error: 'Ungültiges gender.' }, { status: 400 });
  }
  if (isNaN(politicalOrientationRaw) || politicalOrientationRaw < 1 || politicalOrientationRaw > 5) {
    return NextResponse.json({ error: 'Ungültige politicalOrientation.' }, { status: 400 });
  }
  if (!VALID_DECISION_STYLES.includes(decisionStyle)) {
    return NextResponse.json({ error: 'Ungültiger decisionStyle.' }, { status: 400 });
  }
  if (!VALID_GROUPS.includes(group)) {
    return NextResponse.json({ error: 'Ungültige group.' }, { status: 400 });
  }

  const initiativeId = initiativeIdRaw as 1 | 2;
  const politicalOrientation = politicalOrientationRaw;
  const supabase = getSupabaseClient();

  const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' };

  // Divers: always show neutral banner (no gender-specific images available).
  // fallbackUsed stays false because this is intentional, not a missing banner.
  if (gender === 'divers') {
    const { data: neutralBanner } = await supabase
      .from('banners')
      .select('image_url')
      .eq('initiative_id', initiativeId)
      .eq('type', 'neutral')
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      bannerUrl: neutralBanner?.image_url ?? null,
      bannerType: 'neutral',
      fallbackUsed: false,
    } satisfies BannerData, { headers: CACHE_HEADERS });
  }

  const bannerType = getBannerAssignment(group as 'A' | 'B', initiativeId);

  if (bannerType === 'personalized') {
    // Fetch the matching personalised banner from the DB
    const { data: personalizedBanner } = await supabase
      .from('banners')
      .select('image_url')
      .eq('initiative_id', initiativeId)
      .eq('type', 'personalized')
      .eq('gender', gender)
      .eq('age_group', ageGroup)
      .eq('political_orientation', politicalOrientation)
      .eq('decision_style', decisionStyle)
      .limit(1)
      .maybeSingle();

    if (personalizedBanner?.image_url) {
      return NextResponse.json({
        bannerUrl: personalizedBanner.image_url,
        bannerType: 'personalized',
        fallbackUsed: false,
      } satisfies BannerData, { headers: CACHE_HEADERS });
    }

    // Fallback: no personalised banner found → show neutral instead.
    // bannerType is set to 'neutral' (what was actually shown).
    // fallbackUsed=true signals that personalization was intended but unavailable,
    // so these responses can be filtered out during analysis.
    const { data: neutralBanner } = await supabase
      .from('banners')
      .select('image_url')
      .eq('initiative_id', initiativeId)
      .eq('type', 'neutral')
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      bannerUrl: neutralBanner?.image_url ?? null,
      bannerType: 'neutral',
      fallbackUsed: true,
    } satisfies BannerData, { headers: CACHE_HEADERS });
  }

  // Neutral banner
  const { data: neutralBanner } = await supabase
    .from('banners')
    .select('image_url')
    .eq('initiative_id', initiativeId)
    .eq('type', 'neutral')
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    bannerUrl: neutralBanner?.image_url ?? null,
    bannerType: 'neutral',
    fallbackUsed: false,
  } satisfies BannerData, { headers: CACHE_HEADERS });
}
