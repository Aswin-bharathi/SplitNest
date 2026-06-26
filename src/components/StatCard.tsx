import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'indigo' | 'violet' | 'green' | 'red' | 'cyan';
};

const tones = {
  indigo: 'bg-primary/15 text-indigo-200',
  violet: 'bg-secondary/15 text-violet-200',
  green: 'bg-success/15 text-green-200',
  red: 'bg-danger/15 text-red-200',
  cyan: 'bg-cyan-500/15 text-cyan-200'
};

export function StatCard({ icon: Icon, label, value, tone }: StatCardProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-card/80 p-4 backdrop-blur">
      <span className={`mb-4 grid size-10 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon size={18} />
      </span>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold">{value}</p>
    </div>
  );
}
