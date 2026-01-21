'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '@/components/dashboard/ui/DataTable';
import api from '@/lib/axios';
import { ArrowUpRight, Wallet, Banknote, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { isErrorAbort } from '@/utils/helper';
import Tabs from '@/components/common/Tabs';
import { motion } from 'framer-motion';

// transactionTypes.ts
const getTransactionTypes = (t) => [
  { value: 'all', label: t('tabs.all') },
  { value: 'escrow_deposit', label: t('tabs.escrowDeposit') },
  { value: 'escrow_release', label: t('tabs.escrowRelease') },
  { value: 'withdrawal', label: t('tabs.withdrawal') },
];

const formatMoney = (n, currency = 'SAR') => {
  const value = typeof n === 'string' ? Number(n) : n;

  if (isNaN(value)) return '—';

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function WithdrawManagement() {
  const t = useTranslations('Dashboard.finance');
  const transactionTypes = getTransactionTypes(t);
  const [loading, setLoading] = useState(true);
  const [earningsLoading, setEarningsLoading] = useState(true);

  // wallet summary
  const [balance, setBalance] = useState({
    availableBalance: 0,
    credits: 0,
    earningsToDate: 0,
    cancelledOrdersCredit: 0,
  });

  // filters for table
  const [filters, setFilters] = useState({ kind: 'all', page: 1, limit: 10 });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);

  // earnings summary (range)
  // const [range, setRange] = useState(() => {
  //   const end = new Date();
  //   const start = new Date();
  //   start.setDate(end.getDate() - 30);
  //   return { from: start, to: end };
  // });
  // const [earningsCard, setEarningsCard] = useState({ totalEarnings: 0, totalWithdrawals: 0, netEarnings: 0 });

  // abort controller
  const controllerRef = useRef();


  const fetchTransactions = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      const q = {
        page: filters.page,
        limit: filters.limit,
        type: filters.kind === 'all' ? '' : filters.kind,
        search: debouncedSearch,
      };
      const res = await api.get('/accounting/admin/transactions', { params: q, signal: controller.signal });
      const { transactions = [], pagination = {} } = res.data || {};
      setTransactions(transactions);
      setTotal(pagination.total ?? 0);
    } catch (e) {
      if (!isErrorAbort(e)) {
        console.error('Error fetching transactions:', e);
      }
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  };

  // ---- fetchers ----
  const fetchBalance = async () => {
    const res = await api.get('/accounting/balance');
    setBalance(res.data || {});
  };

  // const fetchEarnings = async () => {
  //   const params = new URLSearchParams();
  //   if (range?.from) params.set('startDate', range.from.toISOString());
  //   if (range?.to) params.set('endDate', range.to.toISOString());
  //   const res = await api.get(`/accounting/earnings?${params.toString()}`);
  //   const { totalEarnings = 0, totalWithdrawals = 0, netEarnings = 0 } = res.data || {};
  //   setEarningsCard({ totalEarnings, totalWithdrawals, netEarnings });
  // };

  useEffect(() => {
    fetchTransactions()
  }, [filters.kind, filters.page.toString(), filters.limit.toString(), debouncedSearch]);


  useEffect(() => {
    (async () => {
      try {
        setEarningsLoading(true);
        await Promise.all([fetchBalance()]);
      } finally {
        setEarningsLoading(false);
      }
    })();
  }, []);

  // handlers
  function onSearch(val) {
    setDebouncedSearch(val);
    setFilters(p => ({ ...p, page: 1 }));
  }
  function onTabChange(tab) {

    const v = typeof tab === 'string' ? tab : tab?.value;

    setFilters(p => ({ ...p, page: 1, kind: v }));
  }
  function onLimitChange(val) {
    setFilters(p => ({ ...p, page: 1, limit: val }));
  }
  function onPageChange(val) {
    setFilters(p => ({ ...p, page: val }));
  }

  const columns = useMemo(
    () => [
      { key: 'id', title: t('columns.id'), render: v => <span className='text-slate-700'>{v.slice(0, 8)}…</span> },
      {
        key: 'type',
        title: t('columns.type'),
        render: v => (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${v === 'earning'
            ? 'bg-main-100 text-main-800'
            : v === 'withdrawal'
              ? 'bg-amber-100 text-amber-800'
              : v === 'refund'
                ? 'bg-sky-100 text-sky-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
            {v}
          </span>
        ),
      },
      {
        key: 'amount',
        title: t('columns.amount'),
        render: v => (
          <span className={`font-medium ${Number(v) < 0 ? 'text-amber-700' : 'text-main-700'}`}>
            {formatMoney(Number(v < 0 ? -v : v))}
            {Number(v) < 0 ? t('debit') : ''}
          </span>
        ),
      },
      {
        key: 'status',
        title: t('columns.status'),
        render: v => (
          <span className={`px-2 py-1 rounded-full text-xs ${v === 'completed'
            ? 'bg-main-100 text-main-800'
            : v === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
            }`}>
            {v?.toLowerCase?.()}
          </span>
        ),
      },
      { key: 'description', title: t('columns.description'), render: v => <span className='text-slate-600'>{v || '—'}</span> },
      { key: 'created_at', title: t('columns.date'), render: v => new Date(v).toLocaleString() },
    ],
    [t],
  );

  return (
    <div>
      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard icon={Wallet} label={t('kpis.availableBalance')} value={formatMoney(balance.availableBalance)} hint={t('kpis.readyToWithdraw')} iconBg='bg-main-50 text-main-600' />
        <KpiCard icon={Banknote} label={t('kpis.credits')} value={formatMoney(balance.credits)} hint={t('kpis.refundCredits')} iconBg='bg-blue-50 text-blue-600' />
        <KpiCard icon={ArrowUpRight} label={t('kpis.earningsToDate')} value={formatMoney(balance.earningsToDate)} hint={t('kpis.lifetimeGross')} iconBg='bg-purple-50 text-purple-600' />
        <KpiCard icon={Clock} label={t('kpis.cancelledOrdersCredit')} value={formatMoney(balance.cancelledOrdersCredit)} hint={t('kpis.holdbacks')} iconBg='bg-rose-50 text-rose-600' />
      </div>

      {/* Filters */}
      <GlassCard className='mb-6'>
        <Tabs tabs={transactionTypes} activeTab={filters.kind} setActiveTab={onTabChange} />
      </GlassCard>

      {/* Table */}
      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        page={filters.page}
        limit={filters.limit}
        search={debouncedSearch}
        totalCount={total}
        onLimitChange={onLimitChange}
        onPageChange={onPageChange}
        onSearch={onSearch}
        actions={false}
      />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, hint, currency, iconBg = 'bg-main-50 text-main-600' }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-4 sm:p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start">
        <p className="text-sm sm:text-base md:text-lg text-gray-600 font-medium">{label}</p>
        <span className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full ${iconBg}`}>
          {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </span>
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-2xl xl:text-3xl 2xl:text-3xl font-extrabold text-gray-900">
          {value}
          {currency ? <span className="text-base sm:text-lg md:text-xl font-semibold ml-1">{currency}</span> : null}
        </p>
      </div>

      {/* Hint/Description */}
      {hint ? <p className="mt-2 text-xs sm:text-sm md:text-base font-[600] text-gray-700">{hint}</p> : null}
    </div>
  );
}


function MiniStat({ label, value }) {
  return (
    <div className='rounded-xl border border-slate-100 bg-slate-50 p-3'>
      <div className='text-xs text-slate-500'>{label}</div>
      <div className='mt-1 text-lg font-semibold text-slate-900'>{value}</div>
    </div>
  );
}


function GlassCard({ children, className = '', gradient = 'from-sky-400 via-indigo-400 to-violet-500' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={` border border-slate-200 relative rounded-2xl bg-white/90 ring-1 ring-slate-200 p-5 sm:p-6 ${className}`}>
      <div className={`pointer-events-none absolute inset-0 rounded-2xl [mask:linear-gradient(white,transparent)]`} style={{ border: '2px solid transparent' }} />
      <div className={`absolute -inset-px rounded-2xl ${gradient}`} />
      <div className='relative'>{children}</div>
    </motion.div>
  );
}