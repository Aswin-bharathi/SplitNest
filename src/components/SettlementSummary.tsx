import type { Balance, Member } from '../lib/types';
import { currency, memberName } from '../lib/utils';
import type { PeriodMode } from '../lib/period';
import { PERIOD_MODES } from '../lib/period';

type SettlementSummaryProps = {
  balances: Balance[];
  members: Member[];
  periodMode: PeriodMode;
  totalExpense: number;
};

export function SettlementSummary({ balances, members, periodMode, totalExpense }: SettlementSummaryProps) {
  const periodLabel = PERIOD_MODES.find((p) => p.mode === periodMode)?.label ?? 'Period';

  return (
    <section className="rounded-xl border-2 border-[#b8b493] bg-[#48483f] p-4 sm:p-5">
      <h3 className="mb-4 text-[clamp(1.1rem,5vw,1.35rem)] font-bold uppercase tracking-wide text-[#fff9bf]">
        {periodLabel} settlement summary
      </h3>
      <p className="mb-4 text-[#d8d4b4]">
        Total spent this {periodLabel.toLowerCase()}:{' '}
        <span className="font-semibold text-[#ff8667]">{currency.format(totalExpense)}</span>
      </p>
      <div className="space-y-3">
        {balances.map((balance) => {
          const owes = balance.balance < -0.009;
          const receives = balance.balance > 0.009;
          const settled = !owes && !receives;
          return (
            <article key={balance.memberId} className="rounded-lg border border-[#6f6d5a] bg-[#3f3f3e] p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-lg font-semibold">{memberName(members, balance.memberId)}</h4>
                {settled && <span className="rounded-full bg-[#86d28e]/20 px-3 py-0.5 text-sm text-[#86d28e]">Settled</span>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-[#b8b493]">Paid</p>
                  <p className="text-lg font-semibold text-[#86d28e]">{currency.format(balance.paid)}</p>
                </div>
                <div>
                  <p className="text-[#b8b493]">Their share</p>
                  <p className="text-lg font-semibold text-[#fff9bf]">{currency.format(balance.consumed)}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[#b8b493]">{owes ? 'Needs to pay' : receives ? 'Should receive' : 'Net'}</p>
                  <p className={`text-lg font-semibold ${owes ? 'text-[#ff8667]' : receives ? 'text-[#86d28e]' : 'text-[#d8d4b4]'}`}>
                    {settled ? '₹0' : currency.format(Math.abs(balance.balance))}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
