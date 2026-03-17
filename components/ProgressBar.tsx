'use client';

interface ProgressBarProps {
  progress: number; // 0–1
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#E8E8ED]">
      <div
        className="h-full bg-[#0071E3] transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
