'use client';

export default function Screen5Thanks() {
  return (
    <div className="screen-enter flex flex-col items-center text-center py-16 px-4">
      {/* Checkmark SVG */}
      <div className="mb-8">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#0071E3]/10 mb-6">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="18" stroke="#0071E3" strokeWidth="2" />
            <path
              d="M12 20.5L17.5 26L28 14.5"
              stroke="#0071E3"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-semibold text-[#1D1D1F] mb-4">
          Vielen Dank für Ihre Teilnahme
        </h1>

        <p className="text-base text-[#6E6E73] leading-relaxed max-w-md mx-auto">
          Ihre Antworten werden gespeichert.
        </p>
      </div>
    </div>
  );
}
