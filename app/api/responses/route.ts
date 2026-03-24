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
