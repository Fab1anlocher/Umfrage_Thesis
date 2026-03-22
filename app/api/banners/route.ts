import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getBannerAssignment } from '@/lib/utils';
import type { BannerData } from '@/lib/types';

const VALID_INITIATIVE_IDS = [1, 2];
const VALID_AGE_GROUPS = ['18-29', '30-44', '45-59', '60+'];
const VALID_DECISION_STYLES = ['rational', 'ausgewogen', 'emotional'];
const VALID_GROUPS = ['A', 'B'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const initiativeIdRaw = parseInt(searchParams.get('initiativeId') || '');
  const ageGroup = searchParams.get('ageGroup') || '';
  const politicalOrientationRaw = parseInt(searchParams.get('politicalOrientation') || '');
  const decisionStyle = searchParams.get('decisionStyle') || '';
  const group = searchParams.get('group') || '';
  // testMode can be signalled via URL param (e.g. when env var is not set)
  const testModeParam = searchParams.get('testMode') === 'true';

  // Validate all parameters before proceeding
  if (!VALID_INITIATIVE_IDS.includes(initiativeIdRaw)) {
    return NextResponse.json({ error: 'Ungültige initiativeId.' }, { status: 400 });
  }
  if (!VALID_AGE_GROUPS.includes(ageGroup)) {
    return NextResponse.json({ error: 'Ungültige ageGroup.' }, { status: 400 });
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
  const assignment = getBannerAssignment(group as 'A' | 'B', initiativeId);

  // Test mode: skip DB lookup and return placeholder data with correct types.
  // Triggered by env var (always-on) or URL param (UI toggle).
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true' || testModeParam;
  if (isTestMode) {
    const result: BannerData = {
      bannerAUrl: null,
      bannerBUrl: null,
      bannerAType: assignment.aType,
      bannerBType: assignment.bType,
      fallbackUsed: false,
    };
    return NextResponse.json(result);
  }

  // Fetch the matching personalised banner from the DB
  const supabase = getSupabaseClient();
  const { data: personalizedBanner } = await supabase
    .from('banners')
    .select('image_url')
    .eq('initiative_id', initiativeId)
    .eq('type', 'personalized')
    .eq('age_group', ageGroup)
    .eq('political_orientation', politicalOrientation)
    .eq('decision_style', decisionStyle)
    .limit(1)
    .maybeSingle();

  // Fetch the neutral banner for this initiative
  const { data: neutralBanner } = await supabase
    .from('banners')
    .select('image_url')
    .eq('initiative_id', initiativeId)
    .eq('type', 'neutral')
    .limit(1)
    .maybeSingle();

  const personalizedUrl: string | null = personalizedBanner?.image_url ?? null;
  const neutralUrl: string | null = neutralBanner?.image_url ?? null;

  // Fallback: if no personalised banner found, use neutral for both slots.
  // fallbackUsed is stored in the responses table so affected entries can be
  // excluded or weighted during analysis.
  if (!personalizedUrl) {
    const result: BannerData = {
      bannerAUrl: neutralUrl,
      bannerBUrl: neutralUrl,
      bannerAType: assignment.aType,
      bannerBType: assignment.bType,
      fallbackUsed: true,
    };
    return NextResponse.json(result);
  }

  // Assign URLs according to the crossover design (aType / bType from getBannerAssignment)
  const result: BannerData = {
    bannerAUrl: assignment.aType === 'personalized' ? personalizedUrl : neutralUrl,
    bannerBUrl: assignment.bType === 'personalized' ? personalizedUrl : neutralUrl,
    bannerAType: assignment.aType,
    bannerBType: assignment.bType,
    fallbackUsed: false,
  };

  return NextResponse.json(result);
}
