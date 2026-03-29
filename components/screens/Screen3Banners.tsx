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
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  const handleContinue = () => {
    if (bannerData) onComplete(bannerData);
  };

  const isLoading = !bannerData && !loadError;

  return (
    <div className="screen-enter py-8 px-4 md:px-0">
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
          {bannerData.bannerUrl ? (
            <>
              {/* Thumbnail – anklickbar */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="w-full text-left group focus:outline-none"
                aria-label="Banner vergrössern"
              >
                <div className="rounded-none md:rounded-3xl overflow-hidden shadow-md border-y md:border border-[#E8E8ED] bg-[#F5F5F7] relative">
                  <div className="relative w-full aspect-[16/9]">
                    <Image
                      src={bannerData.bannerUrl}
                      alt={info.title}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      unoptimized
                    />
                  </div>
                  {/* Lupe-Overlay */}
                  <div className="absolute bottom-3 right-3 bg-black/40 rounded-full p-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>
                </div>
              </button>
              <p className="text-xs text-[#6E6E73] mt-2 px-1">
                Tippen Sie auf den Banner, um ihn zu vergrössern.
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center aspect-[16/9] bg-[#F5F5F7] rounded-3xl">
              <p className="text-sm text-[#6E6E73]">Banner nicht verfügbar.</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={(!ready && !loadError) || isLoading}
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
        {loadError
          ? 'Trotzdem weiter'
          : !ready && countdown > 0
          ? `Weiter (${countdown})`
          : 'Weiter ✓'}
      </button>

      {/* Lightbox */}
      {lightboxOpen && bannerData?.bannerUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Schliessen"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div
            className="relative w-full max-w-5xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={bannerData.bannerUrl}
              alt={info.title}
              width={1920}
              height={1080}
              className="w-full h-auto max-h-[90vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
