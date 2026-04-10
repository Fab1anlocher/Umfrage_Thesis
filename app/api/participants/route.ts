import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

const VALID_AGE_GROUPS      = ['18-29', '30-44', '45-59', '60+'];
const VALID_GENDERS         = ['männlich', 'weiblich', 'divers'];
const VALID_DECISION_STYLES = ['rational', 'ausgewogen', 'emotional'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      group_assignment,
      age_group,
      gender,
      political_orientation,
      decision_style,
    } = body;

    // Validation
    if (!group_assignment || !age_group || !gender || !political_orientation || !decision_style) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder.' }, { status: 400 });
    }
    if (!VALID_AGE_GROUPS.includes(age_group)) {
      return NextResponse.json({ error: 'Ungültige Altersgruppe.' }, { status: 400 });
    }
    if (!VALID_GENDERS.includes(gender)) {
      return NextResponse.json({ error: 'Ungültiges Geschlecht.' }, { status: 400 });
    }
    if (!VALID_DECISION_STYLES.includes(decision_style)) {
      return NextResponse.json({ error: 'Ungültiger Entscheidungsstil.' }, { status: 400 });
    }
    if (isNaN(Number(political_orientation)) || political_orientation < 1 || political_orientation > 5) {
      return NextResponse.json({ error: 'Ungültige politische Orientierung (1–5 erwartet).' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('participants')
      .insert({
        group_assignment,
        age_group,
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
    return NextResponse.json({ error: 'Interner Serverfehler.' }, { status: 500 });
  }
}
