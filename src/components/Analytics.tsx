import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { Balance, Expense, Member } from '../lib/types';
import { currency, memberName } from '../lib/utils';

type AnalyticsProps = {
  expenses: Expense[];
  members: Member[];
  balances: Balance[];
};

const colors = ['#ef4f4f', '#fff04f', '#ff6b45', '#86d28e', '#c91f26', '#8f8c72'];

export function Analytics({ expenses, members, balances }: AnalyticsProps) {
  const categoryData = Object.entries(
    expenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
      return acc;
    }, {})
  )
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const memberData = balances.map((balance) => ({
    name: memberName(members, balance.memberId).split(' ')[0],
    expense: balance.consumed,
    income: balance.paid
  }));
  const total = categoryData.reduce((sum, entry) => sum + entry.amount, 0);
  const hasData = categoryData.length > 0;

  return (
    <section className="space-y-6">
      <h2 className="mx-auto flex w-fit max-w-full items-center gap-3 rounded-lg border-2 border-[#fff9bf] px-4 py-3 text-center text-[clamp(1.25rem,5.5vw,1.875rem)] font-semibold tracking-wide sm:px-8 sm:py-4">
        <span className="text-2xl">⌄</span> EXPENSE OVERVIEW
      </h2>

      {hasData ? (
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_.85fr]">
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="amount" innerRadius="48%" outerRadius="82%" paddingAngle={0} isAnimationActive={false}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => currency.format(Number(value))} contentStyle={{ background: '#3f3f3e', border: '1px solid #b8b493', color: '#fff9bf' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:block sm:space-y-3">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex min-w-0 items-center gap-3 text-[clamp(1rem,4.5vw,1.5rem)]">
                <span className="size-3 shrink-0 sm:size-4" style={{ background: colors[index % colors.length] }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-lg border-2 border-[#8f8c72] p-5 text-center text-xl text-[#d8d4b4]">No expenses in this period.</p>
      )}

      <div className="divide-y divide-[#8f8c72] border-y border-[#8f8c72]">
        {categoryData.map((entry, index) => {
          const percent = total ? (entry.amount / total) * 100 : 0;
          return (
            <div key={entry.name} className="grid grid-cols-[3.5rem_1fr] gap-3 py-4 sm:grid-cols-[84px_1fr_auto] sm:items-center sm:gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-[#c91f26] text-white sm:size-20">
                <span className="text-xl font-bold">F</span>
              </span>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[clamp(1.25rem,5.5vw,1.875rem)] font-semibold">{entry.name}</p>
                  <p className="shrink-0 text-[clamp(1.15rem,5vw,1.875rem)] font-semibold text-[#ff8667]">-{currency.format(entry.amount)}</p>
                </div>
                <div className="mt-3 h-4 rounded border-2 border-[#fff9bf] sm:h-5">
                  <div className="h-full bg-[#fff9bf]" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <p className="col-start-2 text-right text-[clamp(1.1rem,5vw,1.875rem)] font-semibold sm:col-start-auto sm:pt-10">{percent.toFixed(2)}%</p>
            </div>
          );
        })}
      </div>

      <h2 className="mx-auto flex w-fit max-w-full items-center gap-3 rounded-lg border-2 border-[#fff9bf] px-4 py-3 text-center text-[clamp(1.25rem,5.5vw,1.875rem)] font-semibold tracking-wide sm:px-8 sm:py-4">
        <span className="text-2xl">⌄</span> ACCOUNT ANALYSIS
      </h2>
      <div className="h-60 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={memberData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#b8b493" tick={{ fill: '#b8b493', fontSize: 13 }} />
            <Tooltip formatter={(value) => currency.format(Number(value))} contentStyle={{ background: '#3f3f3e', border: '1px solid #b8b493', color: '#fff9bf' }} />
            <Bar dataKey="expense" fill="#ff6b45" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="income" fill="#a5d76e" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
