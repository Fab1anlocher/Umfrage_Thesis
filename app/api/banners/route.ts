import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getBannerAssignment } from '@/lib/utils';
import type { BannerData } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const initiativeId = parseInt(searchParams.get('initiativeId') || '1') as 1 | 2;
  const age = parseInt(searchParams.get('age') || '0');
  const ageGroup = searchParams.get('ageGroup') || '18-29';
  const politicalOrientation = parseInt(
    searchParams.get('politicalOrientation') || '3'
  );
  const decisionStyle = (searchParams.get('decisionStyle') || 'rational') as
    | 'rational'
    | 'emotional';
  const group = (searchParams.get('group') || 'A') as 'A' | 'B';

  const assignment = getBannerAssignment(group, initiativeId);

  // Test mode: skip DB lookup entirely
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
    const result: BannerData = {
      bannerAUrl: null,
      bannerBUrl: null,
      bannerAType: assignment.aType,
      bannerBType: assignment.bType,
      fallbackUsed: false,
    };
    return NextResponse.json(result);
  }

  // Suppress unused variable warning in production
  void age;

  // Fetch personalized banner
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

  // Fetch neutral banner
  const { data: neutralBanner } = await supabase
    .from('banners')
    .select('image_url')
    .eq('initiative_id', initiativeId)
    .eq('type', 'neutral')
    .limit(1)
    .maybeSingle();

  const personalizedUrl: string | null = personalizedBanner?.image_url ?? null;
  const neutralUrl: string | null = neutralBanner?.image_url ?? null;

  // Fallback: if no personalised banner found, use neutral for both slots
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

  const result: BannerData = {
    bannerAUrl:
      assignment.aType === 'personalized' ? personalizedUrl : neutralUrl,
    bannerBUrl:
      assignment.bType === 'personalized' ? personalizedUrl : neutralUrl,
    bannerAType: assignment.aType,
    bannerBType: assignment.bType,
    fallbackUsed: false,
  };

  return NextResponse.json(result);
}
