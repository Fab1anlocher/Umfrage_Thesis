'use client';

import { useState } from 'react';

interface Props {
  onComplete: () => void;
}

export default function Screen1Intro({ onComplete }: Props) {
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (started) return;
    setStarted(true);
    onComplete();
  };

  return (
    <div className="screen-enter flex flex-col items-center text-center py-16 px-4">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0071E3]/10 mb-6">
          {/* Target/Bullseye icon – represents targeted/personalized advertising */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="12" stroke="#0071E3" strokeWidth="2" />
            <circle cx="16" cy="16" r="7" stroke="#0071E3" strokeWidth="2" />
            <circle cx="16" cy="16" r="2.5" fill="#0071E3" />
          </svg>
        </div>
        <h1 className="text-4xl font-semibold text-[#1D1D1F] leading-tight mb-4">
          Umfrage zur personalisierten Werbung
        </h1>
        <p className="text-base text-[#6E6E73] leading-relaxed max-w-md mx-auto mb-3">
          Diese Umfrage ist Teil meiner Bachelorarbeit im Studiengang Wirtschaftsinformatik
          an der Berner Fachhochschule. Die erhobenen Daten werden{' '}
          <span className="font-medium text-[#1D1D1F]">ausschliesslich für diese Bachelorarbeit</span>{' '}
          verwendet.
        </p>
        <p className="text-sm text-[#6E6E73] max-w-md mx-auto">
          Die Teilnahme ist anonym – es werden keine Angaben gespeichert, die Rückschlüsse auf Ihre Person zulassen. Die Umfrage dauert nur wenige Minuten.
        </p>
      </div>

      <button
        onClick={handleStart}
        disabled={started}
        className="
          min-h-[52px] px-10 py-3.5 rounded-full
          bg-[#0071E3] text-white text-base font-medium
          hover:bg-[#0077ED] active:bg-[#006DD8]
          hover:scale-[1.02] active:scale-[0.98]
          transition-all duration-150 ease-in-out
          shadow-sm
        "
      >
        Jetzt teilnehmen
      </button>

    </div>
  );
}
