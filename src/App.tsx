import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Landmark,
  LogOut,
  Menu,
  MoreHorizontal,
  PieChart as PieIcon,
  Plus,
  RefreshCw,
  Search,
  Tag,
  WalletCards,
  X
} from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseTimeline } from './components/ExpenseTimeline';
import { LoginScreen } from './components/LoginScreen';
import { MemberHistory } from './components/MemberHistory';
import { PeriodFilter } from './components/PeriodFilter';
import { SettlementPlan } from './components/SettlementPlan';
import { SettlementSummary } from './components/SettlementSummary';
import { currency, memberName } from './lib/utils';
import { nameToUsername } from './lib/username';
import {
  formatPeriodLabel,
  getDefaultAnchor,
  getPeriodRange,
  isDateInPeriod,
  shiftPeriod,
  type PeriodMode
} from './lib/period';
import {
  isAdmin,
  selectActiveGroup,
  selectBalancesForExpenses,
  selectGroupExpenses,
  selectSettlementsForExpenses,
  useSplitNestStore
} from './store/useSplitNestStore';
import type { Category, Expense } from './lib/types';

type Tab = 'records' | 'analysis' | 'budgets' | 'accounts' | 'categories';

const Analytics = lazy(() => import('./components/Analytics').then((module) => ({ default: module.Analytics })));

const navItems: { tab: Tab; label: string; icon: typeof ClipboardList }[] = [
  { tab: 'records', label: 'Records', icon: ClipboardList },
  { tab: 'analysis', label: 'Analysis', icon: PieIcon },
  { tab: 'budgets', label: 'Budgets', icon: Calculator },
  { tab: 'accounts', label: 'Accounts', icon: WalletCards },
  { tab: 'categories', label: 'Categories', icon: Tag }
];

export default function App() {
  const state = useSplitNestStore();
  const group = selectActiveGroup(state);
  const expenses = selectGroupExpenses(state);
  const userIsAdmin = isAdmin(state);
  const [activeTab, setActiveTab] = useState<Tab>('records');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEntry, setShowEntry] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('weekly');
  const [periodAnchor, setPeriodAnchor] = useState(() => getDefaultAnchor('weekly'));
  const [periodFilterOpen, setPeriodFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [analysisPeriodMode, setAnalysisPeriodMode] = useState<PeriodMode>('weekly');
  const [analysisPeriodAnchor, setAnalysisPeriodAnchor] = useState(() => getDefaultAnchor('weekly'));
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ok = await state.checkAuth();
      if (ok) await state.hydrate();
      else useSplitNestStore.setState({ loading: false });
    })();
  }, []);

  const { start: periodStart, end: periodEnd } = useMemo(
    () => getPeriodRange(periodMode, periodAnchor),
    [periodMode, periodAnchor]
  );

  const periodExpenses = useMemo(
    () => expenses.filter((expense) => isDateInPeriod(expense.date, periodStart, periodEnd)),
    [expenses, periodStart, periodEnd]
  );

  const balances = useMemo(
    () => selectBalancesForExpenses(periodExpenses, group?.members ?? []),
    [periodExpenses, group?.members]
  );

  const settlements = useMemo(
    () => selectSettlementsForExpenses(state, periodExpenses),
    [state, periodExpenses]
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleExpenses = useMemo(
    () =>
      periodExpenses
        .filter((expense) => (categoryFilter ? expense.category === categoryFilter : true))
        .filter((expense) => {
          if (!normalizedSearch) return true;
          return [expense.title, expense.category, expense.notes, memberName(state.members, expense.paidBy)]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearch));
        })
        .sort((a, b) => {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
          return sortNewestFirst ? diff : -diff;
        }),
    [periodExpenses, normalizedSearch, categoryFilter, sortNewestFirst, state.members]
  );

  const totalExpense = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const activeMembers = state.members.filter((member) => group?.members.includes(member.id));
  const budgetLimit = group?.budgetLimit ?? 5000;

  const categoryTotals = useMemo(
    () =>
      state.expenseCategories
        .map((category) => ({
          category,
          amount: visibleExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0)
        }))
        .filter((item) => item.amount > 0)
        .sort((a, b) => b.amount - a.amount),
    [visibleExpenses, state.expenseCategories]
  );

  const groupActivityLogs = useMemo(() => {
    const logs = state.activityLogs.filter((log) => !log.groupId || log.groupId === group?.id);
    if (userIsAdmin) return logs;
    return logs.filter((log) => log.userId === state.currentUserId);
  }, [state.activityLogs, state.currentUserId, group?.id, userIsAdmin]);

  const analysisPeriodRange = useMemo(
    () => getPeriodRange(analysisPeriodMode, analysisPeriodAnchor),
    [analysisPeriodMode, analysisPeriodAnchor]
  );

  const analysisPeriodExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        isDateInPeriod(expense.date, analysisPeriodRange.start, analysisPeriodRange.end)
      ),
    [expenses, analysisPeriodRange]
  );

  const runAction = useCallback(async (action: () => Promise<void>) => {
    setActionError(null);
    setSaving(true);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setSaving(false);
    }
  }, []);

  const openEntry = (expense?: Expense, category?: string) => {
    setEditingExpense(expense ?? null);
    setShowEntry(true);
    if (category && !expense) {
      // pre-fill handled inside form via key remount if needed
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveExpense = async (draft: Parameters<typeof state.addExpense>[0]) => {
    await runAction(async () => {
      if (editingExpense) await state.updateExpense(editingExpense.id, draft);
      else await state.addExpense(draft);
      setEditingExpense(null);
      setShowEntry(false);
      setActiveTab('records');
    });
  };

  const changePeriodMode = (mode: PeriodMode) => {
    setPeriodMode(mode);
    setPeriodAnchor(getDefaultAnchor(mode));
  };

  const filterByCategory = (category: string) => {
    setCategoryFilter((current) => (current === category ? null : category));
    setActiveTab('records');
    setSearchOpen(false);
  };

  if (state.loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#3f3f3e] text-[#fff9bf]">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 size-10 animate-spin" />
          <p className="text-xl">Loading SplitNest...</p>
        </div>
      </div>
    );
  }

  if (!state.authenticated && state.authChecked) {
    return (
      <LoginScreen
        onLogin={(username, password) => state.login(username, password)}
        error={state.error}
      />
    );
  }

  if (state.error && !state.apiConnected) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#3f3f3e] p-6 text-[#fff9bf]">
        <div className="max-w-md rounded-xl border-2 border-[#ff8667] p-8 text-center">
          <p className="mb-4 text-xl font-semibold text-[#ff8667]">Connection Error</p>
          <p className="mb-6 text-[#d8d4b4]">{state.error}</p>
          <button className="my-btn px-6 py-3" onClick={() => state.hydrate()}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3f3f3e] text-[#fff9bf] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-[#6f6d5a] lg:bg-[#48483f]">
        <div className="border-b border-[#6f6d5a] px-6 py-8">
          <h1 className="font-serif text-3xl font-bold italic text-[#f5ff8f]">SplitNest</h1>
          <p className="mt-2 text-sm text-[#d8d4b4]">Shared expense manager</p>
          {state.apiConnected && (
            //<p className="mt-3 flex items-center gap-2 text-xs text-[#86d28e]">
              //<span className="size-2 rounded-full bg-[#86d28e]" />
              //MongoDB connected
           // </p>
          )}
          {state.currentUser && (
            <p className="mt-3 text-sm text-[#d8d4b4]">
              Signed in as <span className="font-semibold text-[#fff9bf]">{state.currentUser.name}</span>
              {userIsAdmin && <span className="ml-2 rounded bg-[#fff27c]/20 px-2 py-0.5 text-xs font-bold text-[#fff27c]">ADMIN</span>}
            </p>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-semibold transition ${
                activeTab === tab ? 'bg-[#5b5b52] text-[#fff27c]' : 'text-[#c8c4a1] hover:bg-[#56564f]'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-[#6f6d5a] p-4">
          <label className="mb-2 block text-xs uppercase tracking-wide text-[#b8b493]">Active Group</label>
          <select
            className="w-full rounded-lg border-2 border-[#b8b493] bg-[#3f3f3e] px-3 py-2 outline-none"
            value={group?.id ?? ''}
            onChange={(event) => state.setActiveGroup(event.target.value)}
          >
            {state.groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#ff8667]/50 px-4 py-2 text-sm font-semibold text-[#ff8667] transition hover:bg-[#ff8667]/10"
            onClick={() => state.logout()}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-hidden pb-28 shadow-xl lg:pb-8">
          {actionError && (
            <div className="mx-3 mt-3 flex items-center justify-between rounded-lg border-2 border-[#ff8667] bg-[#48483f] px-4 py-3 sm:mx-5">
              <p className="text-sm text-[#ff8667]">{actionError}</p>
              <button onClick={() => setActionError(null)} aria-label="Dismiss"><X size={18} /></button>
            </div>
          )}

          {showEntry ? (
            <ExpenseForm
              members={activeMembers}
              editingExpense={editingExpense}
              expenseCategories={state.expenseCategories}
              onCancelEdit={() => { setEditingExpense(null); setShowEntry(false); }}
              onSubmit={saveExpense}
              saving={saving}
            />
          ) : (
            <>
              <AppHeader
                groupName={group?.name ?? 'Group'}
                totalExpense={totalExpense}
                periodMode={periodMode}
                periodLabel={formatPeriodLabel(periodMode, periodAnchor)}
                searchOpen={searchOpen}
                searchTerm={searchTerm}
                categoryFilter={categoryFilter}
                periodFilterOpen={periodFilterOpen}
                activeGroupId={group?.id ?? ''}
                groups={state.groups}
                onGroupChange={state.setActiveGroup}
                onPrevPeriod={() => setPeriodAnchor((current) => shiftPeriod(periodMode, current, -1))}
                onNextPeriod={() => setPeriodAnchor((current) => shiftPeriod(periodMode, current, 1))}
                onToggleSearch={() => setSearchOpen((open) => !open)}
                onSearchChange={setSearchTerm}
                onClearCategoryFilter={() => setCategoryFilter(null)}
                onPeriodModeChange={changePeriodMode}
                onTogglePeriodFilter={() => setPeriodFilterOpen((open) => !open)}
                onClosePeriodFilter={() => setPeriodFilterOpen(false)}
                onMenu={() => setDrawerOpen(true)}
                showGroupSelect={false}
                apiConnected={state.apiConnected}
              />

              <section className="px-3 pt-6 sm:px-5 sm:pt-8 lg:px-8">
                {activeTab === 'records' && (
                  <div className="space-y-6">
                    <SettlementSummary
                      balances={balances}
                      members={state.members}
                      periodMode={periodMode}
                      totalExpense={totalExpense}
                    />
                    <SettlementPlan
                      balances={balances}
                      settlements={settlements}
                      members={state.members}
                      totalExpense={totalExpense}
                      memberCount={group?.members.length ?? 0}
                    />
                    <ExpenseTimeline
                      expenses={visibleExpenses}
                      members={state.members}
                      canManage={userIsAdmin}
                      onDelete={(id) => runAction(() => state.deleteExpense(id))}
                      onDuplicate={(id) => runAction(() => state.duplicateExpense(id))}
                      onEdit={openEntry}
                    />
                  </div>
                )}

                {activeTab === 'analysis' && (
                  selectedMemberId ? (
                    <MemberHistory
                      memberId={selectedMemberId}
                      memberName={memberName(state.members, selectedMemberId)}
                      expenses={analysisPeriodExpenses}
                      members={state.members}
                      periodMode={analysisPeriodMode}
                      onBack={() => setSelectedMemberId(null)}
                      onPeriodModeChange={(mode) => {
                        setAnalysisPeriodMode(mode);
                        setAnalysisPeriodAnchor(getDefaultAnchor(mode));
                      }}
                    />
                  ) : (
                    <div className="space-y-7 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
                      <Suspense fallback={<p className="rounded-lg border-2 border-[#8f8c72] p-5 text-center text-xl text-[#d8d4b4]">Loading analysis...</p>}>
                        <Analytics expenses={visibleExpenses} members={state.members} balances={balances} />
                      </Suspense>
                      <div className="space-y-6">
                        <AccountAnalysis
                          balances={balances}
                          members={state.members}
                          onMemberClick={setSelectedMemberId}
                        />
                        <SettlementPlan
                          balances={balances}
                          settlements={settlements}
                          members={state.members}
                          totalExpense={totalExpense}
                          memberCount={group?.members.length ?? 0}
                        />
                      </div>
                    </div>
                  )
                )}

                {activeTab === 'budgets' && (
                  <BudgetSettlements
                    settlements={settlements}
                    balances={balances}
                    members={state.members}
                    totalExpense={totalExpense}
                    periodMode={periodMode}
                    budgetLimit={budgetLimit}
                    saving={saving}
                    onPartial={(from, to, amount) => runAction(() => state.markSettlementPartial(from, to, amount))}
                    onSettle={(from, to) => runAction(() => state.markSettlementSettled(from, to))}
                    onHistory={() => setDrawerOpen(true)}
                  />
                )}

                {activeTab === 'accounts' && (
                  <AccountsScreen
                    balances={balances}
                    members={state.members}
                    activeMemberIds={group?.members ?? []}
                    isAdmin={userIsAdmin}
                    currentUserId={state.currentUserId}
                    onAdd={() => setAccountDialogOpen(true)}
                    onRemove={(id) => runAction(() => state.removeMember(id))}
                  />
                )}

                {activeTab === 'categories' && (
                  <CategoriesScreen
                    categoryTotals={categoryTotals}
                    expenseCategories={state.expenseCategories}
                    newCategoryName={newCategoryName}
                    onNewCategoryName={setNewCategoryName}
                    onAddCategory={() =>
                      runAction(async () => {
                        const name = newCategoryName.trim();
                        if (!name) return;
                        await state.addCategory(name, 'expense');
                        setNewCategoryName('');
                      })
                    }
                    onCategoryClick={filterByCategory}
                    onAddExpense={() => openEntry()}
                  />
                )}
              </section>

              {drawerOpen && (
                <SideDrawer
                  notifications={state.notifications}
                  activityLogs={groupActivityLogs}
                  members={state.members}
                  onClose={() => setDrawerOpen(false)}
                />
              )}

              {accountDialogOpen && (
                <Modal title="ADD NEW MEMBER" onClose={() => { setAccountDialogOpen(false); setNewMemberPassword(''); }}>
                  <div className="space-y-4">
                    <input
                      className="my-input w-full"
                      placeholder="Member name"
                      value={newMemberName}
                      onChange={(event) => setNewMemberName(event.target.value)}
                    />
                    <input
                      type="password"
                      className="my-input w-full"
                      placeholder="Set password for member"
                      value={newMemberPassword}
                      onChange={(event) => setNewMemberPassword(event.target.value)}
                    />
                    <p className="text-xs text-[#b8b493]">
                      {newMemberName.trim()
                        ? `Username: ${nameToUsername(newMemberName.trim()) || '(invalid name)'}`
                        : 'Username will be the name without spaces, lowercase (e.g. Hari Prasath → hariprasath).'}
                    </p>
                    <button
                      className="my-btn w-full py-4 text-2xl"
                      disabled={saving}
                      onClick={() =>
                        runAction(async () => {
                          const name = newMemberName.trim();
                          const password = newMemberPassword.trim();
                          if (!name || !password) return;
                          await state.addMember(name, password);
                          setNewMemberName('');
                          setNewMemberPassword('');
                          setAccountDialogOpen(false);
                        })
                      }
                    >
                      {saving ? 'SAVING...' : 'SAVE MEMBER'}
                    </button>
                  </div>
                </Modal>
              )}
            </>
          )}
        </main>

        {!showEntry && (
          <>
            <button
              className="fixed bottom-24 right-5 z-20 grid size-16 place-items-center rounded-full bg-[#5b5b52] text-5xl leading-none text-[#fff27c] shadow-lg transition hover:bg-[#6a6a5f] sm:bottom-28 sm:right-8 sm:size-20 lg:bottom-8 lg:right-8"
              onClick={() => openEntry()}
              aria-label="Add expense"
            >
              +
            </button>
            <BottomNav activeTab={activeTab} onChange={setActiveTab} />
          </>
        )}
      </div>
    </div>
  );
}

function AppHeader({
  groupName, totalExpense, periodMode, periodLabel, searchOpen, searchTerm, categoryFilter,
  periodFilterOpen, activeGroupId, groups, onGroupChange,
  onPrevPeriod, onNextPeriod, onToggleSearch, onSearchChange, onClearCategoryFilter,
  onPeriodModeChange, onTogglePeriodFilter, onClosePeriodFilter,
  onMenu, showGroupSelect = true, apiConnected = false
}: {
  groupName: string; totalExpense: number; periodMode: PeriodMode; periodLabel: string;
  searchOpen: boolean; searchTerm: string; categoryFilter: string | null; periodFilterOpen: boolean;
  activeGroupId: string; groups: { id: string; name: string }[]; onGroupChange: (id: string) => void;
  onPrevPeriod: () => void; onNextPeriod: () => void; onToggleSearch: () => void;
  onSearchChange: (v: string) => void; onClearCategoryFilter: () => void;
  onPeriodModeChange: (mode: PeriodMode) => void; onTogglePeriodFilter: () => void; onClosePeriodFilter: () => void;
  onMenu: () => void; showGroupSelect?: boolean; apiConnected?: boolean;
}) {
  const modeLabel = periodMode.charAt(0).toUpperCase() + periodMode.slice(1);

  return (
    <header className="bg-[#56564f] px-4 pb-4 pt-5 shadow-lg sm:px-6 sm:pb-5 sm:pt-8 lg:rounded-b-2xl lg:px-8">
      {apiConnected && (
        <p className="mb-3 flex items-center gap-2 text-xs text-[#86d28e] lg:hidden">
          <span className="size-2 rounded-full bg-[#86d28e]" />
          MongoDB connected
        </p>
      )}
      <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <button className="text-[#f5ff8f] lg:hidden" aria-label="Menu" onClick={onMenu}>
          <Menu size={34} />
        </button>
        <div className="flex flex-1 items-center justify-center gap-3 lg:justify-start">
          <span className="font-serif text-[clamp(1.85rem,8vw,2.5rem)] font-bold italic leading-tight text-[#f5ff8f] lg:hidden">SplitNest</span>
          {showGroupSelect && (
            <select
              className="max-w-36 bg-transparent text-xs text-[#d8d4b4] outline-none sm:max-w-44 sm:text-sm lg:hidden"
              value={activeGroupId}
              onChange={(event) => onGroupChange(event.target.value)}
              aria-label="Group"
            >
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <span className="hidden text-2xl font-semibold text-[#fff9bf] lg:inline">{groupName}</span>
        </div>
        <button className="text-[#fff9bf]" onClick={onToggleSearch} aria-label="Search">
          <Search size={32} />
        </button>
      </div>

      {searchOpen && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border-2 border-[#b8b493] px-3 py-2">
          <Search size={22} />
          <input
            className="min-w-0 flex-1 bg-transparent text-xl outline-none placeholder:text-[#d8d4b4]"
            placeholder="Search records, accounts, notes"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <button onClick={() => onSearchChange('')} aria-label="Clear search"><X size={22} /></button>
        </div>
      )}

      {categoryFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-lg border-2 border-[#fff27c] px-3 py-1 text-sm">Filter: {categoryFilter}</span>
          <button className="my-btn px-3 py-1 text-sm" onClick={onClearCategoryFilter}>Clear</button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="rounded-lg border border-[#6f6d5a] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#b8b493]">
          {modeLabel} view · Mon–Sun weeks
        </span>
      </div>

      <div className="mb-6 grid grid-cols-[36px_1fr_36px_36px] items-center gap-1 text-center sm:grid-cols-[48px_1fr_48px_48px] sm:gap-2 lg:max-w-2xl">
        <button onClick={onPrevPeriod} aria-label="Previous period"><ChevronLeft className="mx-auto text-[#fff9bf]" size={34} /></button>
        <p className="truncate text-[clamp(1.25rem,5.5vw,1.75rem)] font-semibold">{periodLabel}</p>
        <button onClick={onNextPeriod} aria-label="Next period"><ChevronRight className="mx-auto text-[#fff9bf]" size={34} /></button>
        <PeriodFilter
          mode={periodMode}
          onChange={onPeriodModeChange}
          open={periodFilterOpen}
          onToggle={onTogglePeriodFilter}
          onClose={onClosePeriodFilter}
        />
      </div>

      <div className="grid max-w-md grid-cols-1 gap-4 text-center lg:max-w-sm">
        <SummaryMetric label="TOTAL EXPENSE" value={totalExpense} />
      </div>
    </header>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#6f6d5a] bg-[#48483f]/50 p-3 lg:p-4">
      <p className="text-[clamp(0.85rem,3.5vw,1rem)] font-bold tracking-wide text-[#fff9bf] lg:text-sm">{label}</p>
      <p className="mt-1 text-[clamp(1.35rem,6vw,1.875rem)] font-semibold text-[#ff8667]">{currency.format(value)}</p>
    </div>
  );
}

function AccountAnalysis({
  balances,
  members,
  onMemberClick
}: {
  balances: ReturnType<typeof selectBalancesForExpenses>;
  members: ReturnType<typeof useSplitNestStore.getState>['members'];
  onMemberClick: (memberId: string) => void;
}) {
  return (
    <section className="space-y-5">
      <MyMoneyTitle>PER-PERSON BREAKDOWN</MyMoneyTitle>
      <p className="text-sm text-[#b8b493]">Tap a member to view their expense history (daily or weekly).</p>
      <div className="divide-y divide-[#8f8c72] border-y border-[#8f8c72]">
        {balances.map((balance) => {
          const owes = balance.balance < -0.009;
          const receives = balance.balance > 0.009;
          return (
            <button
              key={balance.memberId}
              type="button"
              className="flex w-full items-center gap-4 py-4 text-left transition hover:bg-[#48483f]/50"
              onClick={() => onMemberClick(balance.memberId)}
            >
              <MoneyIcon />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[clamp(1.2rem,5vw,1.5rem)] font-semibold">{memberName(members, balance.memberId)}</h3>
                <p className="mt-2 text-sm text-[#d8d4b4]">
                  Paid <span className="font-semibold text-[#86d28e]">{currency.format(balance.paid)}</span>
                  {' · '}Share <span className="font-semibold text-[#fff9bf]">{currency.format(balance.consumed)}</span>
                </p>
                <p className="mt-1 text-[clamp(1rem,4.5vw,1.25rem)] font-semibold">
                  {owes && <>Owes <span className="text-[#ff8667]">{currency.format(Math.abs(balance.balance))}</span></>}
                  {receives && <>Receives <span className="text-[#86d28e]">{currency.format(balance.balance)}</span></>}
                  {!owes && !receives && <span className="text-[#86d28e]">All settled</span>}
                </p>
              </div>
              <ChevronRight className="shrink-0 text-[#b8b493]" size={24} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BudgetSettlements({
  settlements, balances, members, totalExpense, periodMode, budgetLimit, saving, onSettle, onPartial, onHistory
}: {
  settlements: ReturnType<typeof selectSettlementsForExpenses>;
  balances: ReturnType<typeof selectBalancesForExpenses>;
  members: ReturnType<typeof useSplitNestStore.getState>['members'];
  totalExpense: number; periodMode: PeriodMode; budgetLimit: number; saving: boolean;
  onSettle: (from: string, to: string) => void; onPartial: (from: string, to: string, amount: number) => void; onHistory: () => void;
}) {
  return (
    <section className="space-y-6 lg:max-w-3xl">
      <SettlementSummary balances={balances} members={members} periodMode={periodMode} totalExpense={totalExpense} />
      <SettlementPlan
        balances={balances}
        settlements={settlements}
        members={members}
        totalExpense={totalExpense}
        memberCount={members.length}
      />
      <MyMoneyTitle>SETTLE UP</MyMoneyTitle>
      <div className="rounded-xl border-2 border-[#b8b493] p-5">
        <p className="text-2xl font-semibold">Group budget</p>
        <div className="mt-4 h-4 rounded-full border-2 border-[#fff9bf]">
          <div className="h-full rounded-full bg-[#ff6b45] transition-all" style={{ width: `${Math.min((totalExpense / budgetLimit) * 100, 100)}%` }} />
        </div>
        <p className="mt-3 text-xl text-[#d8d4b4]">{currency.format(totalExpense)} used from {currency.format(budgetLimit)}</p>
      </div>
      <div className="space-y-4">
        {settlements.length === 0 && <p className="text-2xl">Everyone is settled.</p>}
        {settlements.map((settlement) => (
          <article key={`${settlement.from}-${settlement.to}`} className="rounded-xl border-2 border-[#b8b493] bg-[#48483f] p-4">
            <p className="text-[clamp(1.1rem,5vw,1.5rem)]">
              {memberName(members, settlement.from)} owes {memberName(members, settlement.to)}
            </p>
            <p className="my-3 text-[clamp(1.8rem,8vw,2.25rem)] font-semibold text-[#ff8667]">{currency.format(settlement.amount)}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:text-sm">
              <button className="my-btn" disabled={saving} onClick={() => onSettle(settlement.from, settlement.to)}>SETTLED</button>
              <button className="my-btn" disabled={saving} onClick={() => onPartial(settlement.from, settlement.to, Math.round((settlement.amount / 2) * 100) / 100)}>PARTIAL (50%)</button>
              <button className="my-btn" onClick={onHistory}>HISTORY</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AccountsScreen({ balances, members, activeMemberIds, isAdmin, currentUserId, onAdd, onRemove }: {
  balances: ReturnType<typeof selectBalancesForExpenses>; members: ReturnType<typeof useSplitNestStore.getState>['members'];
  activeMemberIds: string[]; isAdmin: boolean; currentUserId: string; onAdd: () => void; onRemove: (id: string) => void;
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const adminMember = members.find((m) => m.role === 'admin');
  const activeBalances = balances.filter((balance) => activeMemberIds.includes(balance.memberId));

  return (
    <section className="lg:max-w-3xl">
      <h2 className="mb-2 text-3xl font-bold">Roommates</h2>
      <p className="mb-6 text-[#d8d4b4]">
        {adminMember ? `${adminMember.name} is admin and can edit or delete any expense.` : 'Admin can edit or delete any expense.'}{' '}
        All members can add expenses.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {activeBalances.map((balance) => {
          const member = members.find((m) => m.id === balance.memberId);
          const owes = balance.balance < -0.009;
          const receives = balance.balance > 0.009;
          const canRemove = isAdmin && member?.role !== 'admin' && balance.memberId !== currentUserId;
          return (
            <article key={balance.memberId} className="relative flex items-center gap-5 rounded-xl border-2 border-[#8f8c72] bg-[#48483f] p-4">
              <MoneyIcon />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[clamp(1.2rem,5vw,1.5rem)] font-semibold">{memberName(members, balance.memberId)}</h3>
                  {member?.role === 'admin' && (
                    <span className="rounded bg-[#fff27c]/20 px-2 py-0.5 text-xs font-bold text-[#fff27c]">ADMIN</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[#d8d4b4]">
                  Paid: <span className="text-[#86d28e]">{currency.format(balance.paid)}</span>
                  {' · '}Share: <span className="text-[#fff9bf]">{currency.format(balance.consumed)}</span>
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {owes && <span className="text-[#ff8667]">Pay {currency.format(Math.abs(balance.balance))}</span>}
                  {receives && <span className="text-[#86d28e]">Get {currency.format(balance.balance)}</span>}
                  {!owes && !receives && <span className="text-[#86d28e]">Settled</span>}
                </p>
              </div>
              {canRemove && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpenId((current) => (current === balance.memberId ? null : balance.memberId))}
                    title="Member options"
                    aria-label="Member options"
                    aria-expanded={menuOpenId === balance.memberId}
                  >
                    <MoreHorizontal size={32} />
                  </button>
                  {menuOpenId === balance.memberId && (
                    <>
                      <button
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="Close menu"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-lg border-2 border-[#8f8c72] bg-[#3f3f3e] shadow-lg">
                        <button
                          className="w-full px-4 py-3 text-left text-sm font-semibold text-[#ff8667] transition hover:bg-[#ff8667]/10"
                          onClick={() => {
                            setMenuOpenId(null);
                            onRemove(balance.memberId);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {isAdmin && (
        <button className="mx-auto mt-6 flex items-center gap-3 rounded-lg border-2 border-[#fff9bf] px-5 py-3 text-[clamp(1.25rem,5.5vw,1.875rem)] font-semibold sm:px-8 sm:py-4" onClick={onAdd}>
          <Plus size={28} /> ADD MEMBER
        </button>
      )}
    </section>
  );
}

function CategoriesScreen({
  categoryTotals, expenseCategories, newCategoryName, onNewCategoryName, onAddCategory, onCategoryClick, onAddExpense
}: {
  categoryTotals: { category: Category; amount: number }[]; expenseCategories: string[];
  newCategoryName: string; onNewCategoryName: (v: string) => void; onAddCategory: () => void;
  onCategoryClick: (category: string) => void; onAddExpense: () => void;
}) {
  const categoriesWithTotals = expenseCategories.map((category) => ({
    category,
    amount: categoryTotals.find((item) => item.category === category)?.amount ?? 0
  }));

  return (
    <section className="space-y-8">
      {expenseCategories.length === 0 ? (
        <div className="rounded-xl border-2 border-[#b8b493] bg-[#48483f] p-6 text-center text-[#d8d4b4]">
          <p>No categories yet. Add your first category below to start tracking expenses.</p>
        </div>
      ) : (
        <CategoryList title="Categories" items={expenseCategories} totals={categoriesWithTotals} onItemClick={onCategoryClick} />
      )}
      <div className="grid gap-3 rounded-xl border-2 border-[#8f8c72] p-4">
        <input className="my-input" placeholder="New category name" value={newCategoryName} onChange={(event) => onNewCategoryName(event.target.value)} />
        <button className="my-btn py-3 text-xl" onClick={onAddCategory}>ADD CATEGORY</button>
      </div>
      <button className="my-btn mx-auto flex items-center gap-2 px-5 py-3 text-[clamp(1.1rem,5vw,1.5rem)] sm:px-8 sm:py-4" onClick={onAddExpense}>
        <Plus /> ADD EXPENSE
      </button>
    </section>
  );
}

function SideDrawer({ notifications, activityLogs, members, onClose }: {
  notifications: ReturnType<typeof useSplitNestStore.getState>['notifications'];
  activityLogs: ReturnType<typeof useSplitNestStore.getState>['activityLogs'];
  members: ReturnType<typeof useSplitNestStore.getState>['members']; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 bg-black/45 lg:bg-black/30" onClick={onClose}>
      <aside className="h-full w-[min(88vw,360px)] bg-[#48483f] p-5 text-[#fff9bf] shadow-2xl lg:w-96" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">SplitNest</h2>
          <button onClick={onClose} aria-label="Close menu"><X size={28} /></button>
        </div>
        <section className="mb-7">
          <h3 className="mb-3 border-b border-[#8f8c72] pb-2 text-xl font-semibold">Notifications</h3>
          <div className="max-h-48 space-y-3 overflow-y-auto">
            {notifications.length === 0 && <p className="text-sm text-[#d8d4b4]">No notifications yet.</p>}
            {notifications.slice(0, 8).map((n) => (
              <div key={n.id} className="rounded-lg border border-[#8f8c72] p-3">
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-[#d8d4b4]">{n.body}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-3 border-b border-[#8f8c72] pb-2 text-xl font-semibold">Activity</h3>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {activityLogs.length === 0 && <p className="text-sm text-[#d8d4b4]">No activity yet.</p>}
            {activityLogs.slice(0, 12).map((log) => (
              <p key={log.id} className="text-sm text-[#d8d4b4]">
                <span className="font-semibold text-[#fff9bf]">{memberName(members, log.userId)}</span> {log.action}
              </p>
            ))}
          </div>
        </section>
        <button
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#ff8667]/50 py-3 text-sm font-semibold text-[#ff8667]"
          onClick={() => { useSplitNestStore.getState().logout(); onClose(); }}
        >
          <LogOut size={18} />
          Sign out
        </button>
      </aside>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <section className="w-full max-w-sm rounded-xl border-2 border-[#b8b493] bg-[#48483f] p-5 text-[#fff9bf] lg:max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog"><X size={24} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function CategoryList({ title, items, totals, onItemClick }: {
  title: string; items: string[]; totals?: { category: Category; amount: number }[];
  onItemClick: (category: string) => void;
}) {
  return (
    <div>
      <h2 className="border-b-2 border-[#8f8c72] pb-3 text-3xl font-bold">{title}</h2>
      <div className="mt-3 space-y-4">
        {items.map((item) => {
          const total = totals?.find((entry) => entry.category === item)?.amount ?? 0;
          return (
            <button
              key={item}
              type="button"
              className="grid w-full grid-cols-[68px_1fr_auto] items-center gap-4 rounded-lg p-2 text-left transition hover:bg-[#48483f]"
              onClick={() => onItemClick(item)}
            >
              <span className="grid size-14 place-items-center rounded-full bg-[#c91f26] sm:size-16">
                <Tag size={32} />
              </span>
              <div>
                <p className="truncate text-[clamp(1.4rem,6vw,1.875rem)] font-semibold">{item}</p>
                {total > 0 && <p className="text-xl text-[#ff8667]">{currency.format(total)}</p>}
              </div>
              <span className="text-xs text-[#b8b493]">View</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BottomNav({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto grid h-20 max-w-6xl grid-cols-5 bg-[#5a5a50] px-1 sm:h-24 sm:px-2 lg:hidden">
      {navItems.map(({ tab, label, icon: Icon }) => {
        const active = activeTab === tab;
        return (
          <button key={tab} className={`grid place-items-center text-[11px] font-semibold sm:text-sm ${active ? 'text-[#fff27c]' : 'text-[#c8c4a1]'}`} onClick={() => onChange(tab)}>
            <Icon className="size-7 sm:size-[34px]" strokeWidth={active ? 2.7 : 2.1} />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MyMoneyTitle({ children }: { children: string }) {
  return (
    <h2 className="mx-auto flex w-fit max-w-full items-center gap-3 rounded-lg border-2 border-[#fff9bf] px-4 py-3 text-center text-[clamp(1.25rem,5.5vw,1.875rem)] font-semibold tracking-wide sm:gap-4 sm:px-8 sm:py-4 lg:mx-0">
      <ChevronRight className="rotate-90" /> {children}
    </h2>
  );
}

function MoneyIcon() {
  return (
    <span className="grid size-16 shrink-0 place-items-center rounded-xl border-2 border-[#8fb373] bg-[#f0ffe9] text-[#5d9e65] sm:size-20">
      <Landmark className="size-9 sm:size-[43px]" />
    </span>
  );
}
