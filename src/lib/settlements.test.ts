import { calculateBalances, calculateQuantitySplit, simplifyDebts } from './settlements';
import type { Expense } from './types';

const assertEqual = (actual: unknown, expected: unknown, message: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
};

const members = ['hari', 'aswin', 'siva'];
const eggShares = calculateQuantitySplit(48, [
  { memberId: 'hari', quantity: 4 },
  { memberId: 'aswin', quantity: 2 },
  { memberId: 'siva', quantity: 2 }
]);

assertEqual(
  eggShares.map((share) => share.share),
  [24, 12, 12],
  'Quantity split should match the eggs example.'
);

const expenses: Expense[] = [
  {
    id: 'eggs',
    groupId: 'hostel',
    title: 'Eggs',
    amount: 48,
    date: '2026-06-22',
    category: 'Eggs',
    paidBy: 'hari',
    splitMethod: 'quantity',
    participants: eggShares,
    createdAt: '2026-06-22T08:00:00.000Z',
    updatedAt: '2026-06-22T08:00:00.000Z'
  }
];

const balances = calculateBalances(expenses, members);
assertEqual(balances.find((balance) => balance.memberId === 'hari')?.balance, 24, 'Hari should receive the balance paid above his share.');
assertEqual(simplifyDebts(balances), [
  { from: 'aswin', to: 'hari', amount: 12, status: 'pending' },
  { from: 'siva', to: 'hari', amount: 12, status: 'pending' }
], 'Debt simplification should produce two payments to Hari.');

console.log('Settlement engine checks passed.');
