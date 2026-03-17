'use client';

interface Props {
  onComplete: () => void;
}

export default function Screen1Intro({ onComplete }: Props) {
  return (
    <div className="screen-enter flex flex-col items-center text-center py-16 px-4">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0071E3]/10 mb-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z"
              fill="#0071E3"
              opacity="0.15"
            />
            <path
              d="M16 10v6l4 2"
              stroke="#0071E3"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="16" r="10" stroke="#0071E3" strokeWidth="2" />
          </svg>
        </div>
        <h1 className="text-4xl font-semibold text-[#1D1D1F] leading-tight mb-4">
          KI-Werbung &amp; Abstimmungen
        </h1>
        <p className="text-base text-[#6E6E73] leading-relaxed max-w-md mx-auto mb-3">
          Diese Umfrage ist Teil einer akademischen Masterarbeit an der Universität
          und untersucht, wie KI-personalisierte Abstimmungswerbung die
          Wahlabsichten in der Schweiz beeinflusst.
        </p>
        <p className="text-base text-[#6E6E73] leading-relaxed max-w-md mx-auto mb-3">
          Ihre Teilnahme ist vollständig anonym und freiwillig. Alle Angaben
          werden ausschliesslich für wissenschaftliche Zwecke verwendet.
        </p>
        <p className="text-sm text-[#6E6E73] max-w-md mx-auto">
          Dauer: ca. 5 Minuten
        </p>
      </div>

      <button
        onClick={onComplete}
        className="
          min-h-[52px] px-10 py-3.5 rounded-full
          bg-[#0071E3] text-white text-base font-medium
          hover:bg-[#0077ED] active:bg-[#006DD8]
          hover:scale-[1.02] active:scale-[0.98]
          transition-all duration-150 ease-in-out
          shadow-sm
        "
      >
        Zur Umfrage starten
      </button>

      <p className="mt-6 text-xs text-[#6E6E73]">
        Durch das Starten bestätigen Sie Ihre Einwilligung zur anonymen
        Datenverarbeitung.
      </p>
    </div>
  );
}
