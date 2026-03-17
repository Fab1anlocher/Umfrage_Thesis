'use client';

interface Option {
  value: string;
  label: string;
}

interface PillToggleProps {
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
  wrap?: boolean;
}

export default function PillToggle({
  options,
  value,
  onChange,
  wrap = false,
}: PillToggleProps) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'flex-wrap'}`}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              min-h-[44px] px-5 py-2.5 rounded-full text-sm font-medium
              transition-all duration-150 ease-in-out
              ${
                selected
                  ? 'bg-[#0071E3] text-white shadow-sm'
                  : 'bg-white border border-[#E8E8ED] text-[#1D1D1F] hover:border-[#0071E3] hover:text-[#0071E3]'
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
