'use client';

import { useState } from 'react';
import PillToggle from '@/components/PillToggle';
import RangeSlider from '@/components/RangeSlider';
import type { Demographics } from '@/lib/types';

interface Props {
  group: 'A' | 'B';
  onComplete: (data: Demographics, participantId: string) => void;
}

interface FormErrors {
  ageGroup?: string;
  regionType?: string;
  gender?: string;
}

const AGE_GROUP_OPTIONS = [
  { value: '18-29', label: '18–29' },
  { value: '30-44', label: '30–44' },
  { value: '45-59', label: '45–59' },
  { value: '60+', label: '60+' },
];

const REGION_OPTIONS = [
  { value: 'stadt', label: 'Stadt' },
  { value: 'agglomeration', label: 'Agglomeration' },
  { value: 'land', label: 'Land' },
];

const GENDER_OPTIONS = [
  { value: 'männlich', label: 'Männlich' },
  { value: 'weiblich', label: 'Weiblich' },
  { value: 'divers', label: 'Divers' },
  { value: 'keine_angabe', label: 'Keine Angabe' },
];

export default function Screen2Demographics({ group, onComplete }: Props) {
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [regionType, setRegionType] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [politicalOrientation, setPoliticalOrientation] = useState(3);
  const [decisionStyle, setDecisionStyle] = useState(3);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!ageGroup) {
      errs.ageGroup = 'Bitte wählen Sie Ihre Altersgruppe aus.';
    }
    if (!regionType) {
      errs.regionType = 'Bitte wählen Sie Ihre Wohnregion aus.';
    }
    if (!gender) {
      errs.gender = 'Bitte wählen Sie eine Option aus.';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    setSubmitError(null);

    try {
      const demographics: Demographics = {
        ageGroup: ageGroup!,
        regionType: regionType as Demographics['regionType'],
        gender: gender!,
        politicalOrientation,
        decisionStyle,
      };

      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_assignment: group,
          age_group: demographics.ageGroup,
          region_type: demographics.regionType,
          gender: demographics.gender,
          political_orientation: demographics.politicalOrientation,
          decision_style: demographics.decisionStyle,
        }),
      });

      if (!res.ok) {
        throw new Error('Fehler beim Speichern der Daten.');
      }

      const { id } = await res.json();
      onComplete(demographics, id);
    } catch {
      setSubmitError(
        'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-enter py-8">
      <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
        Angaben zu Ihrer Person
      </h2>
      <p className="text-[#6E6E73] mb-8">
        Diese Angaben helfen uns, die Ergebnisse wissenschaftlich auszuwerten.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Altersgruppe */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
            Altersgruppe
          </label>
          <PillToggle
            options={AGE_GROUP_OPTIONS}
            value={ageGroup}
            onChange={(v) => setAgeGroup(v)}
          />
          {errors.ageGroup && (
            <p className="mt-1.5 text-sm text-red-500">{errors.ageGroup}</p>
          )}
        </div>

        {/* Wohnregion */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
            Wohnregion
          </label>
          <PillToggle
            options={REGION_OPTIONS}
            value={regionType}
            onChange={(v) => setRegionType(v)}
          />
          {errors.regionType && (
            <p className="mt-1.5 text-sm text-red-500">{errors.regionType}</p>
          )}
        </div>

        {/* Geschlecht */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
            Geschlecht
          </label>
          <PillToggle
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(v) => setGender(v)}
            wrap
          />
          {errors.gender && (
            <p className="mt-1.5 text-sm text-red-500">{errors.gender}</p>
          )}
        </div>

        {/* Politische Orientierung */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-[#1D1D1F] mb-3">
            Politische Orientierung
          </label>
          <RangeSlider
            value={politicalOrientation}
            onChange={setPoliticalOrientation}
            leftLabel="Links"
            rightLabel="Rechts"
          />
        </div>

        {/* Entscheidungsstil */}
        <div className="mb-10">
          <label className="block text-sm font-medium text-[#1D1D1F] mb-3">
            Entscheidungsstil
          </label>
          <RangeSlider
            value={decisionStyle}
            onChange={setDecisionStyle}
            leftLabel="Rational"
            rightLabel="Emotional"
          />
        </div>

        {submitError && (
          <p className="mb-4 text-sm text-red-500">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="
            min-h-[52px] px-10 py-3.5 rounded-full
            bg-[#0071E3] text-white text-base font-medium
            hover:bg-[#0077ED] active:bg-[#006DD8]
            hover:scale-[1.02] active:scale-[0.98]
            transition-all duration-150 ease-in-out
            shadow-sm disabled:opacity-60 disabled:cursor-not-allowed
            disabled:hover:scale-100
          "
        >
          {loading ? 'Wird gespeichert…' : 'Weiter'}
        </button>
      </form>
    </div>
  );
}
