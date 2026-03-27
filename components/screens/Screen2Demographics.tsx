'use client';

import { useState } from 'react';
import PillToggle from '@/components/PillToggle';
import RangeSlider from '@/components/RangeSlider';
import type { Demographics, DecisionStyle } from '@/lib/types';

interface Props {
  group: 'A' | 'B';
  onComplete: (data: Demographics, participantId: string) => void;
}

interface FormErrors {
  ageGroup?: string;
  gender?: string;
  decisionStyle?: string;
}

const AGE_GROUP_OPTIONS = [
  { value: '18-29', label: '18–29' },
  { value: '30-44', label: '30–44' },
  { value: '45-59', label: '45–59' },
  { value: '60+', label: '60+' },
];

const GENDER_OPTIONS = [
  { value: 'männlich', label: 'Männlich' },
  { value: 'weiblich', label: 'Weiblich' },
];

const DECISION_STYLE_OPTIONS = [
  { value: 'rational',   label: 'Fakten & Daten' },
  { value: 'ausgewogen', label: 'Eine Kombination aus beidem' },
  { value: 'emotional',  label: 'Bauchgefühl & Werte' },
];

export default function Screen2Demographics({ group, onComplete }: Props) {
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [gender, setGender] = useState<'männlich' | 'weiblich' | null>(null);
  const [politicalOrientation, setPoliticalOrientation] = useState(3);
  const [decisionStyle, setDecisionStyle] = useState<DecisionStyle | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!ageGroup) errs.ageGroup = 'Bitte wählen Sie Ihre Altersgruppe aus.';
    if (!gender) errs.gender = 'Bitte wählen Sie eine Option aus.';
    if (!decisionStyle) errs.decisionStyle = 'Bitte wählen Sie Ihren Entscheidungsstil aus.';
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
        gender: gender!,
        politicalOrientation,
        decisionStyle: decisionStyle!,
      };

      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_assignment: group,
          age_group: demographics.ageGroup,
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
      <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-8">
        Angaben zu Ihrer Person
      </h2>

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

        {/* Geschlecht */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
            Geschlecht
          </label>
          <PillToggle
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(v) => setGender(v as 'männlich' | 'weiblich')}
          />
          {errors.gender && (
            <p className="mt-1.5 text-sm text-red-500">{errors.gender}</p>
          )}
        </div>

        {/* Politische Orientierung */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-[#1D1D1F] mb-3">
            In politischen Angelegenheiten spricht man von «links» und «rechts». Wo würden Sie Ihre Ansichten auf dieser Skala einordnen, ganz allgemein gesprochen?
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
            Wenn ich wichtige Entscheidungen treffe, verlasse ich mich eher auf...
          </label>
          <PillToggle
            options={DECISION_STYLE_OPTIONS}
            value={decisionStyle}
            onChange={(v) => setDecisionStyle(v as DecisionStyle)}
          />
          {errors.decisionStyle && (
            <p className="mt-1.5 text-sm text-red-500">{errors.decisionStyle}</p>
          )}
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
