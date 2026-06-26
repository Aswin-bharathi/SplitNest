import type { Balance, Expense, ParticipantInput, ParticipantShare, Settlement } from './types';

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const distributeRemainder = (shares: ParticipantShare[], amount: number) => {
  const rounded = shares.map((share) => ({ ...share, share: roundMoney(share.share) }));
  const delta = roundMoney(amount - rounded.reduce((sum, share) => sum + share.share, 0));
  if (rounded.length && delta !== 0) rounded[0].share = roundMoney(rounded[0].share + delta);
  return rounded;
};

export function calculateEqualSplit(amount: number, memberIds: string[]): ParticipantShare[] {
  return distributeRemainder(
    memberIds.map((memberId) => ({ memberId, share: amount / memberIds.length })),
    amount
  );
}

export function calculateQuantitySplit(amount: number, inputs: ParticipantInput[]): ParticipantShare[] {
  const totalQuantity = inputs.reduce((sum, input) => sum + (input.quantity ?? 0), 0);
  if (totalQuantity <= 0) throw new Error('Total quantity must be greater than zero.');
  return distributeRemainder(
    inputs.map((input) => ({
      memberId: input.memberId,
      share: amount * ((input.quantity ?? 0) / totalQuantity),
      input
    })),
    amount
  );
}

export function calculatePercentageSplit(amount: number, inputs: ParticipantInput[]): ParticipantShare[] {
  const totalPercentage = roundMoney(inputs.reduce((sum, input) => sum + (input.percentage ?? 0), 0));
  if (totalPercentage !== 100) throw new Error('Percentages must total 100.');
  return distributeRemainder(
    inputs.map((input) => ({
      memberId: input.memberId,
      share: amount * ((input.percentage ?? 0) / 100),
      input
    })),
    amount
  );
}

export function calculateExactSplit(amount: number, inputs: ParticipantInput[]): ParticipantShare[] {
  const totalExact = roundMoney(inputs.reduce((sum, input) => sum + (input.exactAmount ?? 0), 0));
  if (totalExact !== roundMoney(amount)) throw new Error('Exact amounts must match the expense total.');
  return inputs.map((input) => ({
    memberId: input.memberId,
    share: roundMoney(input.exactAmount ?? 0),
    input
  }));
}

export function calculateWeightedSplit(amount: number, inputs: ParticipantInput[]): ParticipantShare[] {
  const totalWeight = inputs.reduce((sum, input) => sum + (input.weight ?? 0), 0);
  if (totalWeight <= 0) throw new Error('Total weight must be greater than zero.');
  return distributeRemainder(
    inputs.map((input) => ({
      memberId: input.memberId,
      share: amount * ((input.weight ?? 0) / totalWeight),
      input
    })),
    amount
  );
}

export function calculateBalances(expenses: Expense[], memberIds: string[]): Balance[] {
  return memberIds.map((memberId) => {
    const paid = roundMoney(expenses.filter((expense) => expense.paidBy === memberId).reduce((sum, expense) => sum + expense.amount, 0));
    const consumed = roundMoney(
      expenses.reduce((sum, expense) => sum + (expense.participants.find((participant) => participant.memberId === memberId)?.share ?? 0), 0)
    );
    return { memberId, paid, consumed, balance: roundMoney(paid - consumed) };
  });
}

export function simplifyDebts(balances: Balance[]): Settlement[] {
  const creditors = balances
    .filter((balance) => balance.balance > 0.009)
    .map((balance) => ({ memberId: balance.memberId, amount: roundMoney(balance.balance) }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((balance) => balance.balance < -0.009)
    .map((balance) => ({ memberId: balance.memberId, amount: roundMoney(Math.abs(balance.balance)) }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = roundMoney(Math.min(debtor.amount, creditor.amount));
    if (amount > 0) settlements.push({ from: debtor.memberId, to: creditor.memberId, amount, status: 'pending' });
    debtor.amount = roundMoney(debtor.amount - amount);
    creditor.amount = roundMoney(creditor.amount - amount);
    if (debtor.amount <= 0.009) debtorIndex += 1;
    if (creditor.amount <= 0.009) creditorIndex += 1;
  }

  return settlements;
}

export const calculateSettlement = (expenses: Expense[], memberIds: string[]) => simplifyDebts(calculateBalances(expenses, memberIds));

export function applyPartialSettlements(
  settlements: Settlement[],
  partials: { from: string; to: string; amount: number }[]
): Settlement[] {
  if (!partials.length) return settlements;
  return settlements
    .map((settlement) => {
      const paid = roundMoney(
        partials.filter((p) => p.from === settlement.from && p.to === settlement.to).reduce((sum, p) => sum + p.amount, 0)
      );
      return { ...settlement, amount: roundMoney(Math.max(0, settlement.amount - paid)) };
    })
    .filter((settlement) => settlement.amount > 0.009);
}
