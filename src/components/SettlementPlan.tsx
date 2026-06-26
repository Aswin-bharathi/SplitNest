import { ArrowRight } from 'lucide-react';
import type { Balance, Member, Settlement } from '../lib/types';
import { currency, memberName } from '../lib/utils';
import { roundMoney } from '../lib/settlements';

type SettlementPlanProps = {
  balances: Balance[];
  settlements: Settlement[];
  members: Member[];
  totalExpense: number;
  memberCount: number;
};

export function SettlementPlan({ balances, settlements, members, totalExpense, memberCount }: SettlementPlanProps) {
  const equalShare = memberCount > 0 ? roundMoney(totalExpense / memberCount) : 0;
  const allSettled = settlements.length === 0 && balances.every((b) => Math.abs(b.balance) < 0.01);

  return (
    <section className="rounded-xl border-2 border-[#b8b493] bg-[#48483f] p-4 sm:p-5">
      <h3 className="mb-1 text-[clamp(1.1rem,5vw,1.35rem)] font-bold uppercase tracking-wide text-[#fff9bf]">
        Who pays for who
      </h3>
      <p className="mb-5 text-[#d8d4b4]">
        Equal share per person ={' '}
        <span className="font-semibold text-[#fff9bf]">{currency.format(equalShare)}</span>
      </p>

      <div className="mb-6 space-y-3">
        {balances.map((balance) => {
          const owes = balance.balance < -0.009;
          const receives = balance.balance > 0.009;
          return (
            <div key={balance.memberId} className="rounded-lg border border-[#6f6d5a] bg-[#3f3f3e] px-4 py-3">
              <p className="text-lg font-semibold text-[#fff9bf]">{memberName(members, balance.memberId)}</p>
              <p className="mt-1 text-[#d8d4b4]">
                Paid {currency.format(balance.paid)}
                {' → '}
                {receives && (
                  <>
                    should receive{' '}
                    <span className="font-semibold text-[#86d28e]">{currency.format(balance.balance)}</span>
                  </>
                )}
                {owes && (
                  <>
                    owes{' '}
                    <span className="font-semibold text-[#ff8667]">{currency.format(Math.abs(balance.balance))}</span>
                  </>
                )}
                {!owes && !receives && (
                  <span className="font-semibold text-[#86d28e]">all settled</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {allSettled ? (
        <p className="text-lg font-semibold text-[#86d28e]">Everyone is settled for this period.</p>
      ) : (
        <>
          <p className="mb-3 font-semibold text-[#fff9bf]">The simplest settlement is:</p>
          <div className="space-y-2">
            {settlements.map((settlement) => (
              <div
                key={`${settlement.from}-${settlement.to}`}
                className="flex items-center gap-3 rounded-lg border border-[#fff27c]/40 bg-[#fff27c]/5 px-4 py-3"
              >
                <ArrowRight className="shrink-0 text-[#fff27c]" size={20} />
                <p className="text-[clamp(1rem,4.5vw,1.2rem)]">
                  <span className="font-semibold text-[#fff9bf]">{memberName(members, settlement.from)}</span>
                  {' → '}
                  <span className="font-semibold text-[#fff9bf]">{memberName(members, settlement.to)}</span>
                  {': '}
                  <span className="font-bold text-[#ff8667]">{currency.format(settlement.amount)}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[#b8b493]">
            After these payments, everyone will have effectively paid {currency.format(equalShare)} each.
          </p>
        </>
      )}
    </section>
  );
}
