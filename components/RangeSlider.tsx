'use client';

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  leftLabel: string;
  rightLabel: string;
}

export default function RangeSlider({
  value,
  onChange,
  min = 1,
  max = 5,
  leftLabel,
  rightLabel,
}: RangeSliderProps) {
  // Build tick labels
  const steps = [];
  for (let i = min; i <= max; i++) steps.push(i);

  return (
    <div className="w-full">
      <div className="relative px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
        />
        {/* Tick marks */}
        <div className="flex justify-between mt-1 px-0">
          {steps.map((s) => (
            <span
              key={s}
              className={`text-xs tabular-nums ${
                s === value ? 'text-[#0071E3] font-semibold' : 'text-[#6E6E73]'
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[#6E6E73]">{leftLabel}</span>
        <span className="text-xs text-[#6E6E73]">{rightLabel}</span>
      </div>
    </div>
  );
}
