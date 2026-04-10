import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      participant_id,
      initiative_id,
      group_assignment,
      banner_type,
      voting_intention,
      credibility,
      personalization_felt,
      fallback_used,
    } = body;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const VALID_GROUPS = ['A', 'B'];
    const VALID_BANNER_TYPES = ['personalized', 'neutral'];

    // Validation
    if (
      !participant_id ||
      !initiative_id ||
      !group_assignment ||
      !banner_type ||
      voting_intention == null ||
      credibility == null ||
      personalization_felt == null
    ) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder.' }, { status: 400 });
    }
    if (typeof participant_id !== 'string' || !UUID_REGEX.test(participant_id)) {
      return NextResponse.json({ error: 'Ungültige participant_id.' }, { status: 400 });
    }
    if (initiative_id !== 1 && initiative_id !== 2) {
      return NextResponse.json({ error: 'Ungültige initiative_id.' }, { status: 400 });
    }
    if (!VALID_GROUPS.includes(group_assignment)) {
      return NextResponse.json({ error: 'Ungültige group_assignment.' }, { status: 400 });
    }
    if (!VALID_BANNER_TYPES.includes(banner_type)) {
      return NextResponse.json({ error: 'Ungültiger banner_type.' }, { status: 400 });
    }
    if (voting_intention < 1 || voting_intention > 7 ||
        credibility < 1 || credibility > 7 ||
        personalization_felt < 1 || personalization_felt > 7) {
      return NextResponse.json({ error: 'Ungültige Bewertungswerte (1–7 erwartet).' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.from('responses').insert({
      participant_id,
      initiative_id,
      group_assignment,
      banner_type,
      voting_intention,
      credibility,
      personalization_felt,
      fallback_used: fallback_used ?? false,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Datenbankfehler beim Speichern der Antwort.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Interner Serverfehler.' }, { status: 500 });
  }
}
