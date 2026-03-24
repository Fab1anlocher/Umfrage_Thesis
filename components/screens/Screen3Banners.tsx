'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import type { Demographics, BannerData } from '@/lib/types';

interface Props {
  initiativeId: 1 | 2;
  group: 'A' | 'B';
  demographics: Demographics;
  onComplete: (data: BannerData) => void;
}

const INITIATIVE_DESCRIPTIONS: Record<number, { title: string; description: string }> = {
  1: {
    title: 'Vorlage 1',
    description:
      'Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)»',
  },
  2: {
    title: 'Vorlage 2',
    description:
      'Änderung des Bundesgesetzes über den zivilen Ersatzdienst (Zivildienstgesetz, ZDG)',
  },
};

export default function Screen3Banners({
  initiativeId,
  group,
  demographics,
  onComplete,
}: Props) {
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [ready, setReady] = useState(false);
  const timerStarted = useRef(false);

  const info = INITIATIVE_DESCRIPTIONS[initiativeId];

  const fetchBanner = useCallback(async () => {
    const params = new URLSearchParams({
      initiativeId: String(initiativeId),
      ageGroup: demographics.ageGroup,
      gender: demographics.gender,
      politicalOrientation: String(demographics.politicalOrientation),
      decisionStyle: demographics.decisionStyle,
      group,
    });

    try {
      const res = await fetch(`/api/banners?${params.toString()}`);
      if (!res.ok) throw new Error('Fehler beim Laden des Banners.');
      const data: BannerData = await res.json();
      setBannerData(data);
    } catch {
      setLoadError(true);
    }
  }, [initiativeId, group, demographics]);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  // Countdown timer – starts once banner is loaded.
  // Guard prevents double-start if bannerData change re-triggers the effect.
  useEffect(() => {
    if (timerStarted.current) return;
    if (!bannerData) return;

    timerStarted.current = true;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [bannerData]);

  const handleContinue = () => {
    if (bannerData) {
      onComplete(bannerData);
    }
  };

  const isLoading = !bannerData && !loadError;

  return (
    <div className="screen-enter py-8">
      <div className="mb-2">
        <span className="inline-block text-xs font-medium text-[#0071E3] bg-[#0071E3]/10 px-3 py-1 rounded-full mb-3">
          {group === 'A' ? 'Gruppe A' : 'Gruppe B'} &middot; {info.title}
        </span>
      </div>
      <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-2">{info.title}</h2>
      <p className="text-[#6E6E73] mb-8 leading-relaxed">{info.description}</p>

      <p className="text-sm text-[#6E6E73] mb-5">
        Bitte schauen Sie sich den Banner an, bevor Sie fortfahren.
      </p>

      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {loadError && (
        <p className="text-red-500 text-sm mb-6">
          Der Banner konnte nicht geladen werden. Bitte laden Sie die Seite neu.
        </p>
      )}

      {bannerData && !loadError && (
        <div className="mb-8">
          <div className="rounded-3xl overflow-hidden shadow-sm border border-[#E8E8ED] bg-white">
            {bannerData.bannerUrl ? (
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={bannerData.bannerUrl}
                  alt={info.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
            ) : (
              // Fallback: Banner konnte nicht geladen werden (kein Bild in DB).
              <div className="flex items-center justify-center aspect-[16/9] bg-[#F5F5F7]">
                <p className="text-sm text-[#6E6E73]">Banner nicht verfügbar.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!ready || isLoading}
        className="
          min-h-[52px] px-10 py-3.5 rounded-full
          bg-[#0071E3] text-white text-base font-medium
          hover:bg-[#0077ED] active:bg-[#006DD8]
          hover:scale-[1.02] active:scale-[0.98]
          transition-all duration-150 ease-in-out
          shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
          disabled:hover:scale-100
        "
      >
        {!ready && countdown > 0
          ? `Weiter (${countdown})`
          : 'Weiter ✓'}
      </button>
    </div>
  );
}
