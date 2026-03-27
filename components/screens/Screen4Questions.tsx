'use client';

import { useState } from 'react';
import Image from 'next/image';
import RangeSlider from '@/components/RangeSlider';
import type { BannerData } from '@/lib/types';

interface Props {
  initiativeId: 1 | 2;
  participantId: string;
  group: 'A' | 'B';
  bannerData: BannerData;
  onComplete: () => void;
}

export default function Screen4Questions({
  initiativeId,
  participantId,
  group,
  bannerData,
  onComplete,
}: Props) {
  const [votingIntention, setVotingIntention] = useState(4);
  const [credibility, setCredibility] = useState(4);
  const [personalizationFelt, setPersonalizationFelt] = useState(4);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          initiative_id: initiativeId,
          group_assignment: group,
          banner_type: bannerData.bannerType,
          voting_intention: votingIntention,
          credibility,
          personalization_felt: personalizationFelt,
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
        Bitte beantworten Sie die folgenden Fragen zu dem Banner, den Sie gesehen haben.
      </p>

      <div className="md:grid md:grid-cols-[1fr_1fr] md:gap-8 md:items-start">
        {/* Banner-Vorschau */}
        {bannerData.bannerUrl && (
          <div className="mb-8 md:mb-0 md:sticky md:top-8">
            <p className="text-xs font-medium text-[#6E6E73] uppercase tracking-wide mb-2">
              Gesehener Banner
            </p>
            <div className="rounded-2xl overflow-hidden border border-[#E8E8ED] bg-[#F5F5F7]">
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={bannerData.bannerUrl}
                  alt={`Banner Vorlage ${initiativeId}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        )}

        {/* Fragen */}
        <div>
      <form onSubmit={handleSubmit} noValidate>
        {/* Q5: Voting intention */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <p className="text-base font-medium text-[#1D1D1F] mb-4">
            Wenn die Abstimmung zu diesem Thema morgen stattfinden würde – wie würden Sie abstimmen?
          </p>
          <RangeSlider
            value={votingIntention}
            onChange={setVotingIntention}
            min={1}
            max={7}
            leftLabel="Bestimmt Nein"
            rightLabel="Bestimmt Ja"
          />
        </div>

        {/* Q7: Credibility */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <p className="text-base font-medium text-[#1D1D1F] mb-4">
            Wie glaubwürdig empfinden Sie die Botschaft des Banners?
          </p>
          <RangeSlider
            value={credibility}
            onChange={setCredibility}
            min={1}
            max={7}
            leftLabel="Überhaupt nicht glaubwürdig"
            rightLabel="Sehr glaubwürdig"
          />
        </div>

        {/* Q8: Personalization felt */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <p className="text-base font-medium text-[#1D1D1F] mb-4">
            Inwiefern hatten Sie das Gefühl, dass dieser Banner persönlich auf Sie zugeschnitten war?
          </p>
          <RangeSlider
            value={personalizationFelt}
            onChange={setPersonalizationFelt}
            min={1}
            max={7}
            leftLabel="Überhaupt nicht"
            rightLabel="Sehr stark"
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
      </div>
    </div>
  );
}
