'use client';

import { useState } from 'react';
import RangeSlider from '@/components/RangeSlider';
import PillToggle from '@/components/PillToggle';
import type { BannerData } from '@/lib/types';

interface Props {
  initiativeId: 1 | 2;
  participantId: string;
  group: 'A' | 'B';
  bannerData: BannerData;
  /** TEST MODE – skip DB write when true */
  testMode?: boolean;
  onComplete: () => void;
}

const PREFERRED_OPTIONS = [
  { value: 'A', label: 'Banner A' },
  { value: 'B', label: 'Banner B' },
  { value: 'none', label: 'Kein Unterschied' },
];

export default function Screen4Questions({
  initiativeId,
  participantId,
  group,
  bannerData,
  testMode = false,
  onComplete,
}: Props) {
  const [votingIntention, setVotingIntention] = useState(3);
  const [preferredBanner, setPreferredBanner] = useState<string | null>(null);
  const [persuasivenessA, setPersuasivenessA] = useState(3);
  const [persuasivenessB, setPersuasivenessB] = useState(3);
  const [errors, setErrors] = useState<{ preferredBanner?: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const errs: { preferredBanner?: string } = {};
    if (!preferredBanner) {
      errs.preferredBanner = 'Bitte wählen Sie eine Option aus.';
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
      // In test mode: skip DB write entirely
      if (testMode) {
        onComplete();
        return;
      }

      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          initiative_id: initiativeId,
          group_assignment: group,
          banner_a_type: bannerData.bannerAType,
          banner_b_type: bannerData.bannerBType,
          voting_intention: votingIntention,
          preferred_banner: preferredBanner,
          persuasiveness_a: persuasivenessA,
          persuasiveness_b: persuasivenessB,
          fallback_used: bannerData.fallbackUsed,
        }),
      });

      if (!res.ok) throw new Error('Fehler beim Speichern.');
      onComplete();
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
        Vorlage {initiativeId} – Ihre Einschätzung
      </h2>
      <p className="text-[#6E6E73] mb-8">
        Bitte beantworten Sie die folgenden Fragen zu den Bannern, die Sie gesehen
        haben.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Q1: Voting intention */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <p className="text-base font-medium text-[#1D1D1F] mb-4">
            Wie wahrscheinlich stimmen Sie für diese Vorlage?
          </p>
          <RangeSlider
            value={votingIntention}
            onChange={setVotingIntention}
            leftLabel="Sehr unwahrscheinlich"
            rightLabel="Sehr wahrscheinlich"
          />
        </div>

        {/* Q2: Preferred banner */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <p className="text-base font-medium text-[#1D1D1F] mb-4">
            Welcher Banner hat Sie mehr angesprochen?
          </p>
          <PillToggle
            options={PREFERRED_OPTIONS}
            value={preferredBanner}
            onChange={setPreferredBanner}
          />
          {errors.preferredBanner && (
            <p className="mt-2 text-sm text-red-500">{errors.preferredBanner}</p>
          )}
        </div>

        {/* Q3: Persuasiveness A */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <p className="text-base font-medium text-[#1D1D1F] mb-4">
            Wie überzeugend war Banner A?
          </p>
          <RangeSlider
            value={persuasivenessA}
            onChange={setPersuasivenessA}
            leftLabel="Gar nicht überzeugend"
            rightLabel="Sehr überzeugend"
          />
        </div>

        {/* Q4: Persuasiveness B */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <p className="text-base font-medium text-[#1D1D1F] mb-4">
            Wie überzeugend war Banner B?
          </p>
          <RangeSlider
            value={persuasivenessB}
            onChange={setPersuasivenessB}
            leftLabel="Gar nicht überzeugend"
            rightLabel="Sehr überzeugend"
          />
        </div>

        {submitError && (
          <p className="mb-4 text-sm text-red-500">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="
            mt-4 min-h-[52px] px-10 py-3.5 rounded-full
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
