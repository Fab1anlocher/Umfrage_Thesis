'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import type { Demographics, BannerData } from '@/lib/types';
import { getDecisionStyleBucket, getBannerAssignment } from '@/lib/utils';

interface Props {
  initiativeId: 1 | 2;
  group: 'A' | 'B';
  demographics: Demographics;
  /** TEST MODE – remove this prop (and all isTestMode usages) to delete the feature */
  testMode?: boolean;
  onComplete: (data: BannerData) => void;
}

const INITIATIVE_DESCRIPTIONS: Record<number, { title: string; description: string }> = {
  1: {
    title: 'Vorlage 1',
    description:
      'Volksinitiative zur Einführung eines bedingungslosen Grundeinkommens für alle in der Schweiz wohnhaften Personen.',
  },
  2: {
    title: 'Vorlage 2',
    description:
      'Bundesgesetz über den Ausbau erneuerbarer Energien und die schrittweise Abkehr von fossilen Brennstoffen bis 2050.',
  },
};

const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === 'true';

export default function Screen3Banners({
  initiativeId,
  group,
  demographics,
  testMode,
  onComplete,
}: Props) {
  const isTestMode = testMode ?? TEST_MODE;
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [ready, setReady] = useState(false);
  const timerStarted = useRef(false);

  const info = INITIATIVE_DESCRIPTIONS[initiativeId];

  const fetchBanners = useCallback(async () => {
    const decisionStyleBucket = getDecisionStyleBucket(demographics.decisionStyle);

    const params = new URLSearchParams({
      initiativeId: String(initiativeId),
      ageGroup: demographics.ageGroup,
      politicalOrientation: String(demographics.politicalOrientation),
      decisionStyle: decisionStyleBucket,
      group,
      // Tell the API to skip DB when UI test mode toggle is active
      testMode: String(isTestMode),
    });

    try {
      const res = await fetch(`/api/banners?${params.toString()}`);
      if (!res.ok) throw new Error('Fehler beim Laden der Banner.');
      const data: BannerData = await res.json();
      setBannerData(data);
    } catch {
      setLoadError(true);
    }
  }, [initiativeId, group, demographics]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Countdown timer – starts once banners are loaded (or test mode).
  // Guard prevents double-start if bannerData change re-triggers the effect.
  // In test mode we always start, even if loadError occurred (no real DB needed).
  useEffect(() => {
    if (timerStarted.current) return;
    if (!bannerData && !isTestMode) return;
    if (loadError && !isTestMode) return;

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
  }, [bannerData, isTestMode, loadError]);

  const handleContinue = () => {
    if (bannerData) {
      onComplete(bannerData);
    } else if (isTestMode) {
      // In test mode without real banner data, derive types from crossover design
      const { aType, bType } = getBannerAssignment(group, initiativeId);
      onComplete({
        bannerAUrl: null,
        bannerBUrl: null,
        bannerAType: aType,
        bannerBType: bType,
        fallbackUsed: false,
      });
    }
  };

  const isLoading = !bannerData && !loadError && !isTestMode;

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
        Bitte schauen Sie sich beide Banner an, bevor Sie fortfahren.
      </p>

      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {loadError && (
        <p className="text-red-500 text-sm mb-6">
          Die Banner konnten nicht geladen werden. Bitte laden Sie die Seite neu.
        </p>
      )}

      {(bannerData || isTestMode) && !loadError && (
        <div className="flex flex-col md:flex-row gap-5 mb-8">
          <BannerCard
            label="Banner A"
            url={bannerData?.bannerAUrl ?? null}
            type={bannerData?.bannerAType ?? 'neutral'}
            initiativeId={initiativeId}
            isTestMode={isTestMode}
          />
          <BannerCard
            label="Banner B"
            url={bannerData?.bannerBUrl ?? null}
            type={bannerData?.bannerBType ?? 'personalized'}
            initiativeId={initiativeId}
            isTestMode={isTestMode}
          />
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

interface BannerCardProps {
  label: string;
  url: string | null;
  type: 'personalized' | 'neutral';
  initiativeId: number;
  isTestMode: boolean;
}

function BannerCard({ label, url, type, initiativeId, isTestMode }: BannerCardProps) {
  return (
    <div className="flex-1">
      <p className="text-sm font-medium text-[#1D1D1F] mb-2">{label}</p>
      <div className="rounded-3xl overflow-hidden shadow-sm border border-[#E8E8ED] bg-white">
        {isTestMode || !url ? (
          <TestPlaceholder type={type} initiativeId={initiativeId} />
        ) : (
          <div className="relative w-full aspect-[16/9]">
            <Image
              src={url}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TestPlaceholder({
  type,
  initiativeId,
}: {
  type: 'personalized' | 'neutral';
  initiativeId: number;
}) {
  const isPersonalized = type === 'personalized';
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        min-h-[180px] p-6 text-center
        ${isPersonalized ? 'bg-blue-50' : 'bg-gray-100'}
      `}
    >
      <span className="text-3xl mb-2">{isPersonalized ? '🎯' : '⬜'}</span>
      <p
        className={`text-sm font-medium ${
          isPersonalized ? 'text-blue-700' : 'text-gray-600'
        }`}
      >
        {isPersonalized
          ? `Personalisierter Banner – Vorlage ${initiativeId}`
          : `Neutraler Banner – Vorlage ${initiativeId}`}
      </p>
    </div>
  );
}
