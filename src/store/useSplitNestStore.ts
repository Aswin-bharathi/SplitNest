import { create } from 'zustand';
import { api } from '../lib/api';
import type { AuthMember } from '../lib/api';
import {
  calculateBalances,
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateQuantitySplit,
  calculateSettlement,
  calculateWeightedSplit,
  applyPartialSettlements
} from '../lib/settlements';
import type { ActivityLog, Expense, Group, Member, MemberRole, Notification, ParticipantInput, SplitMethod } from '../lib/types';

type ExpenseDraft = {
  title: string;
  description?: string;
  amount: number;
  date: string;
  category: Expense['category'];
  paidBy: string;
  splitMethod: SplitMethod;
  notes?: string;
  participants: ParticipantInput[];
};

type SplitNestState = {
  loading: boolean;
  error: string | null;
  apiConnected: boolean;
  authenticated: boolean;
  authChecked: boolean;
  currentUser: AuthMember | null;
  currentUserId: string;
  activeGroupId: string;
  members: Member[];
  groups: Group[];
  expenses: Expense[];
  settledSettlementKeys: string[];
  partialSettlements: { from: string; to: string; amount: number }[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  expenseCategories: string[];
  incomeCategories: string[];
  checkAuth: () => Promise<boolean>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setActiveGroup: (groupId: string) => void;
  addMember: (name: string, password: string, email?: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  addExpense: (draft: ExpenseDraft) => Promise<void>;
  updateExpense: (expenseId: string, draft: ExpenseDraft) => Promise<void>;
  duplicateExpense: (expenseId: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  markSettlementSettled: (from: string, to: string) => Promise<void>;
  markSettlementPartial: (from: string, to: string, amount: number) => Promise<void>;
  addCategory: (name: string, type?: 'expense' | 'income') => Promise<void>;
  clearError: () => void;
};

const makeParticipants = (amount: number, method: SplitMethod, inputs: ParticipantInput[]) => {
  if (method === 'equal') return calculateEqualSplit(amount, inputs.map((input) => input.memberId));
  if (method === 'quantity') return calculateQuantitySplit(amount, inputs);
  if (method === 'percentage') return calculatePercentageSplit(amount, inputs);
  if (method === 'exact') return calculateExactSplit(amount, inputs);
  return calculateWeightedSplit(amount, inputs);
};

export const useSplitNestStore = create<SplitNestState>((set, get) => ({
  loading: true,
  error: null,
  apiConnected: false,
  authenticated: false,
  authChecked: false,
  currentUser: null,
  currentUserId: '',
  activeGroupId: '',
  members: [],
  groups: [],
  expenses: [],
  settledSettlementKeys: [],
  partialSettlements: [],
  activityLogs: [],
  notifications: [],
  expenseCategories: [],
  incomeCategories: [],

  checkAuth: async () => {
    try {
      await api.health();
      set({ apiConnected: true });
      const { member } = await api.me();
      set({ authenticated: true, authChecked: true, currentUser: member, currentUserId: member.id, loading: false });
      return true;
    } catch {
      set({ authenticated: false, authChecked: true, currentUser: null, currentUserId: '', loading: false });
      return false;
    }
  },

  login: async (username, password) => {
    const { member } = await api.login(username, password);
    set({ authenticated: true, currentUser: member, currentUserId: member.id, error: null });
    await get().hydrate();
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // session may already be expired
    }
    set({
      authenticated: false,
      currentUser: null,
      currentUserId: '',
      members: [],
      groups: [],
      expenses: [],
      activityLogs: [],
      notifications: []
    });
  },

  hydrate: async () => {
    set({ loading: true, error: null });
    try {
      await api.health();
      const data = await api.bootstrap();
      set({
        loading: false,
        apiConnected: true,
        authenticated: true,
        currentUserId: data.currentUserId,
        activeGroupId: data.activeGroupId,
        members: data.members,
        groups: data.groups,
        expenses: data.expenses,
        settledSettlementKeys: data.settledSettlementKeys,
        partialSettlements: data.partialSettlements,
        activityLogs: data.activityLogs,
        notifications: data.notifications,
        expenseCategories: data.expenseCategories,
        incomeCategories: data.incomeCategories
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load data';
      if (message.includes('Not authenticated') || message.includes('401')) {
        set({ loading: false, authenticated: false, authChecked: true, currentUser: null });
        return;
      }
      set({
        loading: false,
        apiConnected: false,
        error: 'Cannot connect to MongoDB API. Start the server with: npm run dev:server'
      });
    }
  },

  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),
  clearError: () => set({ error: null }),

  addMember: async (name, password, email) => {
    const state = get();
    const { member, log } = await api.addMember({
      name,
      email,
      password,
      groupId: state.activeGroupId
    });
    set((s) => ({
      members: [...s.members, member],
      groups: s.groups.map((group) =>
        group.id === s.activeGroupId ? { ...group, members: [...group.members, member.id] } : group
      ),
      activityLogs: [log, ...s.activityLogs]
    }));
  },

  removeMember: async (memberId) => {
    const state = get();
    const { log } = await api.removeMember(memberId, { groupId: state.activeGroupId });
    set((s) => ({
      members: s.members.filter((m) => m.id !== memberId),
      groups: s.groups.map((group) =>
        group.id === s.activeGroupId ? { ...group, members: group.members.filter((id) => id !== memberId) } : group
      ),
      activityLogs: [log, ...s.activityLogs]
    }));
  },

  addExpense: async (draft) => {
    const state = get();
    const participants = makeParticipants(draft.amount, draft.splitMethod, draft.participants);
    const { expense, log, notification } = await api.addExpense({
      ...draft,
      groupId: state.activeGroupId,
      category: draft.category,
      participants
    });
    set((s) => ({
      expenses: [expense, ...s.expenses],
      activityLogs: [log, ...s.activityLogs],
      notifications: [notification, ...s.notifications]
    }));
  },

  updateExpense: async (expenseId, draft) => {
    const state = get();
    const participants = makeParticipants(draft.amount, draft.splitMethod, draft.participants);
    const { expense, log, notification } = await api.updateExpense(expenseId, {
      ...draft,
      groupId: state.activeGroupId,
      category: draft.category,
      participants
    });
    set((s) => ({
      expenses: s.expenses.map((item) => (item.id === expenseId ? expense : item)),
      activityLogs: [log, ...s.activityLogs],
      notifications: [notification, ...s.notifications]
    }));
  },

  duplicateExpense: async (expenseId) => {
    const { expense } = await api.duplicateExpense(expenseId);
    set((s) => ({ expenses: [expense, ...s.expenses] }));
  },

  deleteExpense: async (expenseId) => {
    await api.deleteExpense(expenseId);
    set((s) => ({ expenses: s.expenses.filter((expense) => expense.id !== expenseId) }));
  },

  markSettlementSettled: async (from, to) => {
    const state = get();
    const { settledKey, log, notification } = await api.settle({
      groupId: state.activeGroupId,
      from,
      to
    });
    set((s) => ({
      settledSettlementKeys: [...s.settledSettlementKeys, settledKey],
      activityLogs: [log, ...s.activityLogs],
      notifications: [notification, ...s.notifications]
    }));
  },

  markSettlementPartial: async (from, to, amount) => {
    const state = get();
    const { partial, log, notification } = await api.partialSettle({
      groupId: state.activeGroupId,
      from,
      to,
      amount
    });
    set((s) => ({
      partialSettlements: [...s.partialSettlements, partial],
      activityLogs: [log, ...s.activityLogs],
      notifications: [notification, ...s.notifications]
    }));
  },

  addCategory: async (name, type = 'expense') => {
    const { category } = await api.addCategory({ name, type });
    set((s) => {
      if (type === 'income') {
        return s.incomeCategories.includes(category.name)
          ? s
          : { incomeCategories: [...s.incomeCategories, category.name] };
      }
      return s.expenseCategories.includes(category.name)
        ? s
        : { expenseCategories: [...s.expenseCategories, category.name] };
    });
  }
}));

export const selectActiveGroup = (state: SplitNestState) =>
  state.groups.find((group) => group.id === state.activeGroupId) ?? state.groups[0];

export const selectGroupExpenses = (state: SplitNestState) =>
  state.expenses.filter((expense) => expense.groupId === state.activeGroupId);

export const selectBalances = (state: SplitNestState) => {
  const group = selectActiveGroup(state);
  if (!group) return [];
  return selectBalancesForExpenses(selectGroupExpenses(state), group.members);
};

export const selectSettlements = (state: SplitNestState) =>
  selectSettlementsForExpenses(state, selectGroupExpenses(state));

export const selectSettlementsForExpenses = (state: SplitNestState, expenses: Expense[]) => {
  const group = selectActiveGroup(state);
  if (!group) return [];
  const raw = calculateSettlement(expenses, group.members);
  const afterPartials = applyPartialSettlements(raw, state.partialSettlements);
  return afterPartials.filter(
    (settlement) => !state.settledSettlementKeys.includes(`${settlement.from}-${settlement.to}`)
  );
};

export const selectBalancesForExpenses = (expenses: Expense[], memberIds: string[]) =>
  calculateBalances(expenses, memberIds);

export const isAdmin = (state: SplitNestState) => {
  const member = state.members.find((m) => m.id === state.currentUserId);
  return member?.role === 'admin' || state.currentUser?.role === 'admin';
};

export const memberRole = (members: Member[], memberId: string): MemberRole =>
  members.find((m) => m.id === memberId)?.role ?? 'member';
