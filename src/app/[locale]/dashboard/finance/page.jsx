'use client';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/dashboard/Layout';
import DataTable from '@/components/dashboard/ui/DataTable';
import api from '@/lib/axios';
 import { ArrowDownRight, ArrowUpRight, Wallet, Banknote, Clock } from 'lucide-react';

const formatMoney = (n , currency = 'SAR') => {
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
  const [loading, setLoading] = useState(true);

  // wallet summary
  const [balance, setBalance] = useState({
    availableBalance: 0,
    credits: 0,
    earningsToDate: 0,
    cancelledOrdersCredit: 0,
  });

  // table data
  const [filterKind, setFilterKind] = useState('withdrawal'); // 'withdrawal' | 'all'
  const [transactions, setTransactions] = useState([]);
  const [pageMeta, setPageMeta] = useState({ page: 1, pages: 1, total: 0, limit: 20 });

  // earnings summary (range)
  const [range, setRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { from: start, to: end };
  });
  const [earningsCard, setEarningsCard] = useState({ totalEarnings: 0, totalWithdrawals: 0, netEarnings: 0 });

  // ---- fetchers ----
  const fetchBalance = async () => {
    const res = await api.get('/accounting/balance');
    setBalance(res.data || {});
  };

  const fetchTransactions = async (page = 1) => {
    const q = new URLSearchParams();
    q.set('page', String(page));
    if (filterKind === 'withdrawal') q.set('type', 'withdrawal');
    const res = await api.get(`/accounting/transactions?${q.toString()}`);
    const { transactions = [], pagination = {} } = res.data || {};
    setTransactions(transactions);
    setPageMeta(pagination);
  };

  const fetchEarnings = async () => {
    const params = new URLSearchParams();
    if (range?.from) params.set('startDate', range.from.toISOString());
    if (range?.to) params.set('endDate', range.to.toISOString());
    const res = await api.get(`/accounting/earnings?${params.toString()}`);
    const { totalEarnings = 0, totalWithdrawals = 0, netEarnings = 0 } = res.data || {};
    setEarningsCard({ totalEarnings, totalWithdrawals, netEarnings });
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchBalance(), fetchTransactions(1), fetchEarnings()]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKind, range?.from, range?.to]);


	const columns = useMemo(
    () => [
      { key: 'id', title: 'ID', render: v => <span className='text-slate-700'>{v.slice(0, 8)}…</span> },
      {
        key: 'type',
        title: 'Type',
        render: v => (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${v === 'earning' ? 'bg-emerald-100 text-emerald-800' : v === 'withdrawal' ? 'bg-amber-100 text-amber-800' : v === 'refund' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-700'}`}>
            {v === 'earning' ? <ArrowUpRight className='h-3.5 w-3.5' /> : <ArrowDownRight className='h-3.5 w-3.5' />}
            {v}
          </span>
        ),
      },
      {
        key: 'amount',
        title: 'Amount',
        render: (v, row) => (
          <span className={`font-medium ${Number(v) < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {formatMoney(Number(v < 0 ? -v : v))}
            {Number(v) < 0 ? ' (debit)' : ''}
          </span>
        ),
      },
      {
        key: 'status',
        title: 'Status',
        render: v => <span className={`px-2 py-1 rounded-full text-xs ${v === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : v === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{v?.toLowerCase?.()}</span>,
      },
      {
        key: 'description',
        title: 'Description',
        render: v => <span className='text-slate-600'>{v || '—'}</span>,
      },
      {
        key: 'created_at',
        title: 'Date',
        render: v => new Date(v).toLocaleString(),
      },
      // NOTE: admin approve/reject is intentionally hidden because backend endpoints don’t exist yet
    ],
    [],
  );

	console.log(balance);

  return (
    <DashboardLayout title='Money & Withdrawals'>
      {/* KPIs */}
      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KpiCard icon={<Wallet className='h-5 w-5' />} label='Available Balance' value={formatMoney(balance.availableBalance)} hint='Ready to withdraw' />
        <KpiCard icon={<Banknote className='h-5 w-5' />} label='Credits' value={formatMoney(balance.credits)} hint='Refund credits' />
        <KpiCard icon={<ArrowUpRight className='h-5 w-5' />} label='Earnings to Date' value={formatMoney(balance.earningsToDate)} hint='Lifetime gross (net of refunds not applied here)' />
        <KpiCard icon={<Clock className='h-5 w-5' />} label='Cancelled Orders Credit' value={formatMoney(balance.cancelledOrdersCredit)} hint='Holdbacks from cancellations' />
      </div>

      {/* Earnings quick range */}
      {/* <div className='mb-6 rounded-2xl border border-slate-200 bg-white p-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <div className='text-sm font-semibold text-slate-900'>Earnings (range)</div>
            <div className='mt-1 text-xs text-slate-500'>
              {range?.from?.toLocaleDateString()} – {range?.to?.toLocaleDateString()}
            </div>
          </div>
           <div className='flex gap-2'>
            <button
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50'
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 7);
                setRange({ from: start, to: end });
              }}>
              Last 7 days
            </button>
            <button
              className='rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50'
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 30);
                setRange({ from: start, to: end });
              }}>
              Last 30 days
            </button>
          </div>
        </div>

        <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <MiniStat label='Total Earnings' value={formatMoney(earningsCard.totalEarnings)} />
          <MiniStat label='Total Withdrawals' value={formatMoney(earningsCard.totalWithdrawals)} />
          <MiniStat label='Net' value={formatMoney(earningsCard.netEarnings)} />
        </div>
      </div> */}

      {/* Filters */}
      <div className='mb-3 flex items-center gap-2'>
        <button onClick={() => setFilterKind('withdrawal')} className={`px-4 py-2 rounded-lg ${filterKind === 'withdrawal' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>
          Withdrawals
        </button>
        <button onClick={() => setFilterKind('all')} className={`px-4 py-2 rounded-lg ${filterKind === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}>
          All Transactions
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        actions={false}
        pagination={{
          page: pageMeta.page,
          pages: pageMeta.pages,
          total: pageMeta.total,
          onPageChange: p => fetchTransactions(p),
        }}
        emptyContent={<div className='rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600'>No records.</div>}
      />
    </DashboardLayout>
  );
}

function KpiCard({ icon, label, value, hint }) {
   return (
    <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='flex items-center gap-2 text-slate-600'>
        {icon}
        <span className='text-xs'>{label}</span>
      </div>
      <div className='mt-2 text-2xl font-semibold text-slate-900'>{value}</div>
      {hint ? <div className='mt-1 text-xs text-slate-500'>{hint}</div> : null}
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
