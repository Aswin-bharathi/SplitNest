import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { PERIOD_MODES, type PeriodMode } from '../lib/period';

type PeriodFilterProps = {
  mode: PeriodMode;
  onChange: (mode: PeriodMode) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
};

export function PeriodFilter({ mode, onChange, open, onToggle, onClose }: PeriodFilterProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        aria-label="Period filter"
        title={`Period: ${PERIOD_MODES.find((p) => p.mode === mode)?.label}`}
        className={`grid place-items-center rounded-lg p-1 transition ${open ? 'bg-[#fff9bf]/20' : ''}`}
      >
        <SlidersHorizontal className="text-[#fff9bf]" size={31} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 min-w-[10rem] overflow-hidden rounded-xl border-2 border-[#b8b493] bg-[#48483f] shadow-xl">
          <p className="border-b border-[#6f6d5a] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#b8b493]">View by</p>
          {PERIOD_MODES.map(({ mode: option, label }) => (
            <button
              key={option}
              className={`block w-full px-4 py-3 text-left text-lg font-semibold transition hover:bg-[#56564f] ${
                mode === option ? 'bg-[#5b5b52] text-[#fff27c]' : 'text-[#fff9bf]'
              }`}
              onClick={() => {
                onChange(option);
                onClose();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
