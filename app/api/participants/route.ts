import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      group_assignment,
      age_group,
      region_type,
      gender,
      political_orientation,
      decision_style,
    } = body;

    const VALID_AGE_GROUPS = ['18-29', '30-44', '45-59', '60+'];

    // Basic validation
    if (
      !group_assignment ||
      !age_group ||
      !region_type ||
      !gender ||
      !political_orientation ||
      !decision_style
    ) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder.' },
        { status: 400 }
      );
    }

    if (typeof age_group !== 'string' || !VALID_AGE_GROUPS.includes(age_group)) {
      return NextResponse.json(
        { error: 'Ungültige Altersgruppe.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .insert({
        group_assignment,
        age_group,
        region_type,
        gender,
        political_orientation,
        decision_style,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Datenbankfehler beim Speichern des Teilnehmers.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler.' },
      { status: 500 }
    );
  }
}
