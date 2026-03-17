import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      group_assignment,
      age,
      region_type,
      gender,
      political_orientation,
      decision_style,
    } = body;

    // Basic validation
    if (
      !group_assignment ||
      !age ||
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

    if (age < 18 || age > 120) {
      return NextResponse.json(
        { error: 'Ungültiges Alter.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('participants')
      .insert({
        group_assignment,
        age,
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
