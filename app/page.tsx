'use client';

import { useState } from 'react';
import ProgressBar from '@/components/ProgressBar';
import Screen1Intro from '@/components/screens/Screen1Intro';
import Screen2Demographics from '@/components/screens/Screen2Demographics';
import Screen3Banners from '@/components/screens/Screen3Banners';
import Screen4Questions from '@/components/screens/Screen4Questions';
import Screen5Thanks from '@/components/screens/Screen5Thanks';
import type { Demographics, BannerData } from '@/lib/types';

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
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        {step === 'intro' && <Screen1Intro onComplete={handleIntroComplete} />}

        {step === 'demographics' && group && (
          <Screen2Demographics
            group={group}
            onComplete={handleDemographicsComplete}
          />
        )}

        {step === 'banner-1' && group && demographics && (
          <Screen3Banners
            initiativeId={1}
            group={group}
            demographics={demographics}
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
              onComplete={handleQuestions1Complete}
            />
          )}

        {step === 'banner-2' && group && demographics && (
          <Screen3Banners
            initiativeId={2}
            group={group}
            demographics={demographics}
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
              onComplete={handleQuestions2Complete}
            />
          )}

        {step === 'thanks' && <Screen5Thanks />}
      </div>
    </div>
  );
}
