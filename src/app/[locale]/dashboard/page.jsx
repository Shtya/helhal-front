'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Users, ShoppingBag, Wallet, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Download } from 'lucide-react';
import api from '@/lib/axios';
import { BarChart } from '@/components/dashboard/charts/BarChart';
import { DoughnutChart } from '@/components/dashboard/charts/DoughnutChart';
import { useTranslations } from 'next-intl';
import { isErrorAbort } from '@/utils/helper';

export default function StatisticsPage() {
  const t = useTranslations('Dashboard.overview'); // 👈 namespace
  const [preset, setPreset] = useState('30');

  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(false);
  const [error, setError] = useState(null);

  // Overview KPIs
  const [overview, setOverview] = useState({
    jobs: [],
    services: [],
  });

  const [countsSummary, setCountsSummary] = useState({
    jobs: [],
    services: [],
    users: [],
    orders: [],
  });

  const [statusSummary, setStatusSummary] = useState({
    jobs: [],
    services: [],
    disputes: [],
    users: [],
  });


  const [recent, setRecent] = useState({ orders: [], withdrawals: [] });
  const controllerRef = useRef();

  async function fetchAll() {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;


    setLoading(true);
    setError(null);
    try {
      const [{ data: ov }, { data: counts }] = await Promise.all([
        api.get('/dashboard/overview', { params: { days: preset } }),
        api.get('/dashboard/counts-summary', { params: { days: preset } }),
      ]);

      setOverview(ov);
      setCountsSummary(counts);


    } catch (e) {
      if (!isErrorAbort(error))
        setError('Failed to load stats');
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, [preset]);

  async function fetchRecent() {
    setRecentLoading(true);
    try {
      const [{ data: rec }, { data: statuses }] = await Promise.all([
        api.get('/dashboard/recent'),
        api.get('/dashboard/status-summary', { params: { days: preset } }),
      ])
      setStatusSummary(statuses);
      setRecent(rec);
    } catch (e) {
      setError('Failed to load recent stats');
    } finally {
      setRecentLoading(false);
    }
  }

  useEffect(() => {
    fetchRecent();
  }, []);


  function Refreash() {
    fetchAll()
    fetchRecent()
  }

  const [jobData, jobLabels] = useMemo(
    () => [overview.jobs.map(item => item.count), overview.jobs.map(item => `${formatLabel(item.seg_start)} - ${formatLabel(item.seg_end)}`)],
    [overview.jobs]
  );

  const [serviceData, serviceLabels] = useMemo(
    () => [overview.services.map(item => item.count), overview.services.map(item => `${formatLabel(item.seg_start)} - ${formatLabel(item.seg_end)}`)],
    [overview.services]
  );


  const doughnutData = useMemo(() => {
    function format(entity) {
      return {
        labels: statusSummary[entity].map(s => s.status),
        data: statusSummary[entity].map(s => s.status_count)
      };
    }

    return {
      users: format("users"),
      jobs: format("jobs"),
      services: format("services"),
      disputes: format("disputes"),
    };
  }, [statusSummary]);





  return (
    <div className="!py-6" >
      {/* Page header */}
      <div className='  flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-slate-900'> {t('title')}</h1>
          <p className="text-slate-600">{t('subtitle')}</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='hidden sm:flex items-center gap-1 rounded-xl border border-main-200 bg-white px-2 py-1'>
            <Calendar className='h-4 w-4 text-main-600' />
            <QuickPreset label='7D' active={preset === '7'} onClick={() => setPreset('7')} />
            <QuickPreset label='30D' active={preset === '30'} onClick={() => setPreset('30')} />
            <QuickPreset label='90D' active={preset === '90'} onClick={() => setPreset('90')} />
          </div>
          <button onClick={() => exportCSV({ recent, statusSummary, countsSummary, overview })} className='inline-flex items-center gap-2 rounded-xl border border-main-200 bg-white px-3 py-2 text-sm text-main-700 hover:bg-main-50'>
            <Download className='h-4 w-4' /> Export CSV
          </button>
          <button onClick={() => Refreash()} title='Refresh' className='inline-grid place-items-center rounded-xl border border-main-200 bg-white h-10 w-10 text-main-700 hover:bg-main-50'>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3'>{t('error')}</div>}

      {/* KPI row */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : [
            { label: t('users'), value: countsSummary.users?.total_count || 0, lastDaysCount: countsSummary.users?.last_days_count || 0, icon: Users },
            { label: t('jobs'), value: countsSummary.jobs?.total_count || 0, lastDaysCount: countsSummary.jobs?.last_days_count || 0, icon: Wallet },
            { label: t('services'), value: countsSummary.services?.total_count || 0, lastDaysCount: countsSummary.services?.last_days_count || 0, icon: ShoppingBag },
            { label: t('orders'), value: countsSummary.orders?.total_count || 0, lastDaysCount: countsSummary.orders?.last_days_count || 0, icon: ShoppingBag },
          ].map(k => <StatCard key={k.label} {...k} />)}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        <ChartCard title={t('jobsPosted')} loading={loading}
          empty={!jobData.length}>
          <BarChart
            labels={jobLabels}
            label={t('jobs')}
            title={t('jobsPosted')}
            data={jobData}
          />
        </ChartCard>

        <ChartCard title={t('servicesPosted')} loading={loading}
          empty={!serviceData.length}>
          <BarChart
            labels={serviceLabels}
            label={t('services')}
            data={serviceData}
          />
        </ChartCard>

      </div>

      <div className="grid xs:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">

        <ChartCard title={t('userStatuses')} loading={recentLoading}
          empty={!doughnutData.users.data.length}>
          <DoughnutChart
            labels={doughnutData.users.labels}
            data={doughnutData.users.data}
            colors={['#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395']}
          />
        </ChartCard>

        <ChartCard title={t('jobStatuses')}
          loading={recentLoading}
          empty={!doughnutData.jobs.data.length}>
          <DoughnutChart
            labels={doughnutData.jobs.labels}
            data={doughnutData.jobs.data}
            colors={['#ff9900', '#109618', '#990099', '#3b5998']}
          />
        </ChartCard>

        <ChartCard title={t('serviceStatuses')}
          loading={recentLoading}
          empty={!doughnutData.services.data.length}>
          <DoughnutChart
            labels={doughnutData.services.labels}
            data={doughnutData.services.data}
            colors={['#109618', '#3366cc', '#dc3912']}
          />
        </ChartCard>

        <ChartCard title={t('disputeStatuses')}
          loading={recentLoading}
          empty={!doughnutData.users.data.length}>
          <DoughnutChart
            labels={doughnutData.disputes.labels}
            data={doughnutData.disputes.data}
            colors={['#dc3912', '#ff9900', '#109618', '#3366cc', '#990099']}
          />
        </ChartCard>

      </div>


      {/* Recent activity */}
      <section className='mt-6 max-xl:space-y-6 xl:grid gap-6 xl:grid-cols-2'>
        <div className=''>
          <SectionHeader title={t('table.orders.title')} />
          <RecentTable rows={recent.orders} loading={recentLoading} empty={t('table.orders.empty')} />
        </div>
        <div className='space-y-6'>
          <SectionHeader title={t('table.withdrawals.title')} />
          <RecentTable rows={recent.withdrawals} loading={recentLoading} empty={t('table.withdrawals.empty')} />
        </div>
      </section>
    </div>
  );
}

function RecentTable({ rows, loading, empty }) {
  const t = useTranslations('Dashboard.overview');
  if (loading) {
    return (
      <div className='rounded-2xl border border-main-200 bg-white p-4'>
        <div className='space-y-2'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-12 w-full rounded-lg bg-main-50 animate-pulse' />
          ))}
        </div>
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return <div className='rounded-2xl border border-main-200 bg-white p-6 text-slate-500'>{empty}</div>;
  }
  return (
    <div className='overflow-hidden rounded-2xl border border-main-200 bg-white overflow-x-auto'>
      <table className='min-w-full'>
        <thead className='bg-main-50/60'>
          <tr className='text-justify text-sm text-slate-600'>
            <th className='px-4 py-3'>{t('table.headers.ref')}</th>
            <th className='px-4 py-3'>{t('table.headers.customer')}</th>
            <th className='px-4 py-3'>{t('table.headers.status')}</th>
            <th className='px-4 py-3'>{t('table.headers.amount')}</th>
            <th className='px-4 py-3'>{t('table.headers.date')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className='border-t border-main-100 text-sm hover:bg-main-50/40'>
              <td className='px-4 py-3 text-nowrap font-medium text-slate-800'>{r.ref || r.id || '-'}</td>
              <td className='px-4 py-3 text-nowrap text-slate-700'>{r?.buyer?.username || r?.user?.username || '-'}</td>
              <td className='px-4 py-3 text-nowrap'>
                <span className={`inline-flex text-nowrap items-center rounded-lg px-2 py-1 text-xs font-medium ${statusTone(r.status)}`}>{r.status || '-'}</span>
              </td>
              <td className='px-4 py-3 text-nowrap text-slate-800'>{typeof (r.amount || r.totalAmount) === 'number' ? `SAR ${formatNumber(r.amount || r.totalAmount)}` : (r.amount || r.totalAmount) || '-'}</td>
              <td className='px-4 py-3 text-nowrap text-slate-600'>{formatDate(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function exportCSV({ countsSummary, overview, statusSummary, recent }) {
  const lines = [];

  // ===================
  // HEADER
  // ===================
  lines.push(`Dashboard Export - ${new Date().toLocaleString()}`);
  lines.push("");

  // ===================
  // KPI COUNTS
  // ===================
  lines.push("=== KPIs ===");
  lines.push("Metric,Total Count,Last Period Count");
  lines.push(`Users,${countsSummary.users?.total_count || 0},${countsSummary.users?.last_days_count || 0}`);
  lines.push(`Jobs,${countsSummary.jobs?.total_count || 0},${countsSummary.jobs?.last_days_count || 0}`);
  lines.push(`Services,${countsSummary.services?.total_count || 0},${countsSummary.services?.last_days_count || 0}`);
  lines.push(`Orders,${countsSummary.orders?.total_count || 0},${countsSummary.orders?.last_days_count || 0}`);
  lines.push("");

  // ===================
  // JOBS OVERVIEW SEGMENTS
  // ===================
  lines.push("=== Jobs Timeline ===");
  lines.push("Date Segment,Count");
  overview.jobs.forEach(item => {
    lines.push(`${formatLabel(item.seg_start)} - ${formatLabel(item.seg_end)},${item.count}`);
  });
  lines.push("");

  // ===================
  // SERVICES OVERVIEW SEGMENTS
  // ===================
  lines.push("=== Services Timeline ===");
  lines.push("Date Segment,Count");
  overview.services.forEach(item => {
    lines.push(`${formatLabel(item.seg_start)} - ${formatLabel(item.seg_end)},${item.count}`);
  });
  lines.push("");

  // ===================
  // STATUSES SECTION
  // ===================
  lines.push("=== Entity Statuses ===");
  lines.push("");

  function printStatus(label, arr) {
    lines.push(`${label} Status,Count`);
    arr.forEach(s => {
      lines.push(`${s.status},${s.status_count}`);
    });
    lines.push("");
  }

  printStatus("User", statusSummary.users);
  printStatus("Job", statusSummary.jobs);
  printStatus("Service", statusSummary.services);
  printStatus("Dispute", statusSummary.disputes);

  // ===================
  // RECENT ORDERS
  // ===================
  lines.push("=== Recent Orders ===");
  if (!recent.orders.length) {
    lines.push("No orders");
  } else {
    lines.push("Order ID,User,status,Amount,Created At");
    recent.orders.forEach(o => {
      lines.push(`${o.id},${o.buyer.username},${o.status},${o.totalAmount},${o.created_at}`);
    });
  }
  lines.push("");

  // ===================
  // RECENT WITHDRAWALS
  // ===================
  lines.push("=== Recent Withdrawals ===");
  if (!recent.withdrawals.length) {
    lines.push("No withdrawals");
  } else {
    lines.push("Withdraw ID,User,status,Amount,Created At");
    recent.withdrawals.forEach(w => {
      lines.push(`${w.id},${o.user.username},${w.status},${w.amount},${w.created_at}`);
    });
  }
  lines.push("");

  // ===================
  // BUILD AND DOWNLOAD CSV
  // ===================
  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dashboard_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ----------------------------- UI Components ----------------------------- */
function formatLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}


function ChartCard({ title, loading, empty, children }) {

  return (
    <div className='rounded-2xl border border-main-200 bg-white p-4'>
      <h3 className='text-sm font-semibold text-slate-700 mb-4'>{title}</h3>

      {loading
        ? <ChartSkeleton />
        : empty
          ? <EmptyChart />
          : children
      }
    </div>
  );
}



function QuickPreset({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-2 py-1 text-xs rounded-lg transition ${active ? 'bg-main-600 text-white' : 'text-main-700 hover:bg-main-50'}`}>
      {label}
    </button>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className=' mb-2 flex items-center justify-between'>
      <div>
        <h2 className='text-base font-semibold text-slate-900'>{title}</h2>
        {subtitle && <p className='text-sm text-slate-600'>{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, lastDaysCount, icon: Icon, prefix }) {
  const positive = lastDaysCount >= 0;

  const percentChange = value
    ? Math.round((lastDaysCount / value) * 100)
    : 0; // avoid division by zero

  return (
    <div className='group rounded-2xl border border-main-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all'>
      <div className='flex flex-col items-start justify-between gap-4'>
        <div className='flex gap-3 justify-between w-full'>
          <p className='text-lg font-medium text-slate-700'>{label}</p>
          <div className='h-12 w-12 rounded-xl bg-main-50 border border-main-200 grid place-items-center text-main-700'>
            <Icon className='h-6 w-6' />
          </div>
        </div>
        <div className='flex gap-3 justify-between w-full'>
          <h3 className='text-3xl font-bold text-slate-900'>
            {prefix}
            {formatNumber(value)}
          </h3>
          <span className={`inline-flex items-center gap-1 text-sm ${positive ? 'text-main-600' : 'text-rose-600'}`}>
            {positive ? <ArrowUpRight className='h-4 w-4' /> : <ArrowDownRight className='h-4 w-4' />}
            {Math.abs(percentChange)}%
          </span>
        </div>
      </div>
    </div>
  );
}


/* ------------------------------ Visuals ------------------------------ */

function SparkArea({ data = [], width = 260, height = 56 }) {
  const pad = 6;
  const points = data && data.length ? data : [4, 5, 6, 5, 7, 8, 9, 7, 8, 10, 9, 11];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const coords = points.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / (points.length - 1);
    const y = height - pad - ((v - min) / Math.max(1, max - min)) * (height - pad * 2);
    return [x, y];
  });
  const poly = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${pad},${height - pad} ${poly} ${width - pad},${height - pad}`;
  const id = 'grad-' + Math.random().toString(36).slice(2);
  return (
    <svg height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full text-main-500">
      <defs>
        <linearGradient id={id} x1='0' x2='0' y1='0' y2='1'>
          <stop offset='0%' stopColor='#10b981' stopOpacity='0.25' />
          <stop offset='100%' stopColor='#10b981' stopOpacity='0.02' />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' points={poly} />
    </svg>
  );
}

function MiniBar({ value = 0 }) {
  const v = Math.max(0, Math.min(100, Number(value)));
  return (
    <div className='h-2 w-full rounded-full bg-main-50 border border-main-100'>
      <div className='h-full rounded-full bg-main-500' style={{ width: v + '%' }} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className='rounded-2xl border border-main-200 bg-white p-4'>
      <div className='h-5 w-28 bg-main-50 rounded animate-pulse' />
      <div className='mt-3 h-7 w-36 bg-main-50 rounded animate-pulse' />
      <div className='mt-4 h-10 w-full bg-main-50 rounded animate-pulse' />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 h-[400px] animate-pulse">
      <div className="h-[340px] bg-main-50 rounded" />
    </div>
  );
}


function EmptyChart({ message = "No data available" }) {
  return (
    <div className="h-[400px] flex items-center justify-center rounded-2xl border bg-white border-slate-200 text-slate-500">
      {message}
    </div>
  );
}


/* ------------------------------ Utilities ------------------------------- */

function formatNumber(n) {
  const num = Number(n || 0);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (['paid', 'completed', 'success', , 'Accepted', 'Delivered', 'approved', 'resolved'].includes(s)) return 'bg-main-50 text-main-700 border border-main-200';
  if (['pending', 'processing', 'open'].includes(s)) return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (['failed', 'rejected', 'canceled', 'cancelled', 'Missing Details'].includes(s)) return 'bg-rose-50 text-rose-700 border border-rose-200';
  return 'bg-slate-50 text-slate-700 border border-slate-200';
}

function randSeries(n = 12, base = 50) {
  const out = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += Math.round((Math.random() - 0.4) * 8);
    out.push(Math.max(0, v));
  }
  return out;
}
