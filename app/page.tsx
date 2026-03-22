'use client';

import { useState } from 'react';
import ProgressBar from '@/components/ProgressBar';
import Screen1Intro from '@/components/screens/Screen1Intro';
import Screen2Demographics from '@/components/screens/Screen2Demographics';
import Screen3Banners from '@/components/screens/Screen3Banners';
import Screen4Questions from '@/components/screens/Screen4Questions';
import Screen5Thanks from '@/components/screens/Screen5Thanks';
import type { Demographics, BannerData } from '@/lib/types';

// ── TEST MODE ────────────────────────────────────────────────────────────────
// Remove the <TestModeToggle /> usage and the testMode state below to delete
// this feature entirely when it is no longer needed.
function TestModeToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={`
        fixed top-4 right-4 z-50
        text-xs font-medium px-3 py-1.5 rounded-full border
        transition-all duration-150 shadow-sm
        ${active
          ? 'bg-[#0071E3] text-white border-[#0071E3]'
          : 'bg-white text-[#6E6E73] border-[#E8E8ED] hover:border-[#0071E3] hover:text-[#0071E3]'}
      `}
    >
      Testmodus {active ? 'AN' : 'AUS'}
    </button>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

type Step =
  | 'intro'
  | 'demographics'
  | 'banner-1'
  | 'questions-1'
  | 'banner-2'
  | 'questions-2'
  | 'thanks';

const STEP_PROGRESS: Record<Step, number> = {
  intro: 0,
  demographics: 1 / 6,
  'banner-1': 2 / 6,
  'questions-1': 3 / 6,
  'banner-2': 4 / 6,
  'questions-2': 5 / 6,
  thanks: 1,
};

export default function SurveyPage() {
  const [step, setStep] = useState<Step>('intro');
  const [group, setGroup] = useState<'A' | 'B' | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [bannerData1, setBannerData1] = useState<BannerData | null>(null);
  const [bannerData2, setBannerData2] = useState<BannerData | null>(null);
  // TEST MODE – remove this line (and TestModeToggle) to delete the feature:
  const [testMode, setTestMode] = useState(process.env.NEXT_PUBLIC_TEST_MODE === 'true');

  const handleIntroComplete = () => {
    const newGroup: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
    setGroup(newGroup);
    setStep('demographics');
  };

  const handleDemographicsComplete = (data: Demographics, id: string) => {
    setDemographics(data);
    setParticipantId(id);
    setStep('banner-1');
  };

  const handleBanner1Complete = (data: BannerData) => {
    setBannerData1(data);
    setStep('questions-1');
  };

  const handleQuestions1Complete = () => {
    setStep('banner-2');
  };

  const handleBanner2Complete = (data: BannerData) => {
    setBannerData2(data);
    setStep('questions-2');
  };

  const handleQuestions2Complete = () => {
    setStep('thanks');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <ProgressBar progress={STEP_PROGRESS[step]} />
      {/* TEST MODE – remove the next line to delete the feature */}
      <TestModeToggle active={testMode} onToggle={() => setTestMode((v) => !v)} />
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        {step === 'intro' && <Screen1Intro onComplete={handleIntroComplete} />}

        {step === 'demographics' && group && (
          <Screen2Demographics
            group={group}
            testMode={testMode}
            onComplete={handleDemographicsComplete}
          />
        )}

        {step === 'banner-1' && group && demographics && (
          <Screen3Banners
            initiativeId={1}
            group={group}
            demographics={demographics}
            testMode={testMode}
            onComplete={handleBanner1Complete}
          />
        )}

        {step === 'questions-1' &&
          participantId &&
          group &&
          bannerData1 && (
            <Screen4Questions
              initiativeId={1}
              participantId={participantId}
              group={group}
              bannerData={bannerData1}
              testMode={testMode}
              onComplete={handleQuestions1Complete}
            />
          )}

        {step === 'banner-2' && group && demographics && (
          <Screen3Banners
            initiativeId={2}
            group={group}
            demographics={demographics}
            testMode={testMode}
            onComplete={handleBanner2Complete}
          />
        )}

        {step === 'questions-2' &&
          participantId &&
          group &&
          bannerData2 && (
            <Screen4Questions
              initiativeId={2}
              participantId={participantId}
              group={group}
              bannerData={bannerData2}
              testMode={testMode}
              onComplete={handleQuestions2Complete}
            />
          )}

        {step === 'thanks' && <Screen5Thanks />}
      </div>
    </div>
  );
}
