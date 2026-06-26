import { Copy, Pencil, Trash2, Utensils } from 'lucide-react';
import type { Expense, Member } from '../lib/types';
import { currency, memberName } from '../lib/utils';

type ExpenseTimelineProps = {
  expenses: Expense[];
  members: Member[];
  canManage: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (expense: Expense) => void;
};

const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'long'
  });

export function ExpenseTimeline({ expenses, members, canManage, onDelete, onDuplicate, onEdit }: ExpenseTimelineProps) {
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    const label = dayLabel(expense.date);
    acc[label] = [...(acc[label] ?? []), expense];
    return acc;
  }, {});

  return (
    <section className="space-y-5">
      {expenses.length === 0 && (
        <p className="rounded-lg border border-[#8f8c72] p-4 text-center text-sm text-[#d8d4b4]">No records match this period.</p>
      )}
      {Object.entries(grouped).map(([label, items]) => (
        <div key={label}>
          <h2 className="border-b border-[#8f8c72] pb-2 pl-1 text-base font-bold text-[#fff27c] sm:text-lg">{label}</h2>
          <div className="divide-y divide-[#6f6d5a]/80">
            {items.map((expense) => {
              const payer = memberName(members, expense.paidBy);
              const detail = expense.title && expense.title !== expense.category ? expense.title : expense.notes;
              return (
                <article key={expense.id} className="flex items-start gap-3 py-3 sm:gap-3.5">
                  <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-[#c91f26] text-white sm:size-12">
                    <Utensils className="size-5 sm:size-6" strokeWidth={2.25} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-[0.95rem] font-semibold leading-snug text-[#fff9bf] sm:text-base">
                        {expense.category}
                      </h3>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-[#ff8667] sm:text-[0.95rem]">
                        -{currency.format(expense.amount)}
                      </p>
                    </div>

                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-xs leading-relaxed text-[#b8b493] sm:text-[0.8125rem]">
                        <span className="mr-1.5 inline-grid size-5 place-items-center rounded bg-[#c5d8b2] align-middle text-[0.65rem] font-bold text-[#5b8f5c]">
                          ₹
                        </span>
                        {payer}
                        {detail ? (
                          <>
                            <span className="mx-1 text-[#8f8c72]">·</span>
                            <span className="text-[#d8d4b4]">&ldquo;{detail}&rdquo;</span>
                          </>
                        ) : null}
                      </p>

                      {canManage && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button className="expense-action-btn" title="Edit" onClick={() => onEdit(expense)}>
                            <Pencil size={13} />
                          </button>
                          <button className="expense-action-btn" title="Duplicate" onClick={() => onDuplicate(expense.id)}>
                            <Copy size={13} />
                          </button>
                          <button className="expense-action-btn text-[#ff8667]" title="Delete" onClick={() => onDelete(expense.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
