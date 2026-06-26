import { ChevronLeft, Utensils } from 'lucide-react';
import type { Expense, Member } from '../lib/types';
import { currency, memberName } from '../lib/utils';
import type { PeriodMode } from '../lib/period';
import { PERIOD_MODES } from '../lib/period';

type MemberHistoryProps = {
  memberId: string;
  memberName: string;
  expenses: Expense[];
  members: Member[];
  periodMode: PeriodMode;
  onBack: () => void;
  onPeriodModeChange: (mode: PeriodMode) => void;
};

const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'long'
  });

export function MemberHistory({
  memberId,
  memberName: name,
  expenses,
  members,
  periodMode,
  onBack,
  onPeriodModeChange
}: MemberHistoryProps) {
  const memberExpenses = expenses.filter(
    (expense) =>
      expense.paidBy === memberId ||
      expense.createdBy === memberId ||
      expense.participants.some((p) => p.memberId === memberId)
  );

  const totalPaid = memberExpenses
    .filter((e) => e.paidBy === memberId)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalShare = memberExpenses.reduce(
    (sum, e) => sum + (e.participants.find((p) => p.memberId === memberId)?.share ?? 0),
    0
  );

  const grouped = memberExpenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    const label = dayLabel(expense.date);
    acc[label] = [...(acc[label] ?? []), expense];
    return acc;
  }, {});

  return (
    <section className="space-y-5">
      <button
        className="flex items-center gap-2 text-[#fff27c] transition hover:text-[#fff9bf]"
        onClick={onBack}
      >
        <ChevronLeft size={24} />
        <span className="font-semibold">Back to analysis</span>
      </button>

      <div className="rounded-xl border-2 border-[#b8b493] bg-[#48483f] p-4 sm:p-5">
        <h2 className="text-2xl font-bold text-[#fff9bf]">{name}&apos;s history</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {PERIOD_MODES.filter((p) => p.mode === 'daily' || p.mode === 'weekly').map(({ mode, label }) => (
            <button
              key={mode}
              className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition ${
                periodMode === mode
                  ? 'border-[#fff27c] bg-[#fff27c]/10 text-[#fff27c]'
                  : 'border-[#6f6d5a] text-[#d8d4b4] hover:border-[#b8b493]'
              }`}
              onClick={() => onPeriodModeChange(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#b8b493]">Total paid</p>
            <p className="text-xl font-semibold text-[#86d28e]">{currency.format(totalPaid)}</p>
          </div>
          <div>
            <p className="text-[#b8b493]">Total share</p>
            <p className="text-xl font-semibold text-[#fff9bf]">{currency.format(totalShare)}</p>
          </div>
        </div>
      </div>

      {memberExpenses.length === 0 && (
        <p className="rounded-lg border-2 border-[#8f8c72] p-5 text-center text-xl text-[#d8d4b4]">
          No expenses for {name} in this {periodMode === 'daily' ? 'day' : 'week'}.
        </p>
      )}

      {Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
          <h3 className="border-b-2 border-[#8f8c72] pb-2 text-xl font-bold">{label}</h3>
          <div className="divide-y divide-[#6f6d5a]">
            {items.map((expense) => {
              const share = expense.participants.find((p) => p.memberId === memberId)?.share ?? 0;
              const isPayer = expense.paidBy === memberId;
              const creator = expense.createdBy ?? expense.paidBy;
              return (
                <article key={expense.id} className="flex items-start gap-3 py-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#c91f26] text-white">
                    <Utensils size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-[#fff9bf]">{expense.title || expense.category}</h4>
                    <p className="mt-1 text-sm text-[#d8d4b4]">
                      {isPayer ? (
                        <>Paid {currency.format(expense.amount)}</>
                      ) : (
                        <>Share {currency.format(share)}</>
                      )}
                      {' · '}Added by {memberName(members, creator)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#b8b493]">{expense.category}</p>
                  </div>
                  <p className={`shrink-0 font-semibold ${isPayer ? 'text-[#86d28e]' : 'text-[#ff8667]'}`}>
                    {isPayer ? '+' : '-'}{currency.format(isPayer ? expense.amount : share)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
