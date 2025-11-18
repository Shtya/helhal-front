'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, FolderTree, ShoppingBag, Briefcase, Rocket, Wallet, Receipt, HelpCircle, Newspaper, BookOpen, ShieldCheck, MessageSquare, BarChart3, Settings, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Download, Folder, ArrowDownCircle } from 'lucide-react';
import api from '@/lib/axios';

export default function StatisticsPage() {
  const today = new Date();
  const [range, setRange] = useState({
    from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30),
    to: today,
    preset: '30d',
  });

  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(false);
  const [error, setError] = useState(null);


  // Overview KPIs
  const [overview, setOverview] = useState({
    users: { total: 0, change: 0, trend: [] },
    categories: { total: 0, change: 0, trend: [] },
    services: { total: 0, change: 0, trend: [] },
    jobs: { total: 0, change: 0, trend: [] },
    orders: { total: 0, change: 0, trend: [] },
    revenue: { total: 0, change: 0, trend: [] },
    withdraws: { total: 0, change: 0, trend: [] },
  });

  // Entities grid (pages)
  const [entities, setEntities] = useState([
    { key: 'users', label: 'Users', href: '/dashboard/users', icon: Users, total: 0, change: 0, trend: [] },
    { key: 'categories', label: 'Categories', href: '/dashboard/categories', icon: FolderTree, total: 0, change: 0, trend: [] },
    { key: 'services', label: 'Services', href: '/dashboard/services', icon: ShoppingBag, total: 0, change: 0, trend: [] },
    { key: 'jobs', label: 'Job', href: '/dashboard/jobs', icon: Briefcase, total: 0, change: 0, trend: [] },
    { key: 'levelup', label: 'Level Up', href: '/dashboard/level-up', icon: Rocket, total: 0, change: 0, trend: [] },
    { key: 'orders', label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag, total: 0, change: 0, trend: [] },
    { key: 'withdraw', label: 'Withdraw', href: '/dashboard/withdraws', icon: Wallet, total: 0, change: 0, trend: [] },
    { key: 'invoices', label: 'Invoices', href: '/dashboard/invoices', icon: Receipt, total: 0, change: 0, trend: [] },
    { key: 'faqs', label: 'FAQs', href: '/dashboard/faqs', icon: HelpCircle, total: 0, change: 0, trend: [] },
    { key: 'blogs', label: 'Blogs', href: '/dashboard/blogs', icon: Newspaper, total: 0, change: 0, trend: [] },
    { key: 'guides', label: 'Guides', href: '/dashboard/guides', icon: BookOpen, total: 0, change: 0, trend: [] },
    { key: 'terms', label: 'Terms & Policies', href: '/dashboard/terms', icon: ShieldCheck, total: 0, change: 0, trend: [] },
    { key: 'chat', label: 'Chat', href: '/dashboard/chat', icon: MessageSquare, total: 0, change: 0, trend: [] },
    { key: 'reports', label: 'Reports', href: '/dashboard/reports', icon: BarChart3, total: 0, change: 0, trend: [] },
    { key: 'settings', label: 'Settings', href: '/dashboard/settings', icon: Settings, total: 0, change: 0, trend: [] },
  ]);

  const [recent, setRecent] = useState({ orders: [], withdraws: [], reports: [] });

  const params = useMemo(
    () => ({
      from: range.from.toISOString().split('T')[0], // "YYYY-MM-DD"
      to: range.to.toISOString().split('T')[0],
    }),
    [range]
  );


  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [{ data: ov }, { data: ent }] = await Promise.all([
        api.get('/admin/stats/overview', { params }).catch(() => ({ data: mockOverview() })),
        api.get('/admin/stats/entities', { params }).catch(() => ({ data: mockEntities() })),
        // api.get('/admin/stats/recent', { params }).catch(() => ({ data: mockRecent() }))
      ]);

      setOverview(ov);
      setEntities(prev => prev.map(item => ({ ...item, ...(ent[item.key] || {}) })));
      // setRecent(rec);
    } catch (e) {

      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, [params]);

  async function fetchRecent() {
    setRecentLoading(true);
    try {
      const { data: rec } = await api.get('/admin/stats/recent').catch(() => ({ data: mockRecent() }));
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
  function setPreset(preset) {
    const now = new Date();
    let from = new Date(now);
    if (preset === '7d') from.setDate(now.getDate() - 7);
    else if (preset === '30d') from.setDate(now.getDate() - 30);
    else if (preset === '90d') from.setDate(now.getDate() - 90);
    else if (preset === 'ytd') from = new Date(now.getFullYear(), 0, 1);
    setRange({ from, to: now, preset });
  }

  function exportCSV() {
    const rows = [['Metric', 'Total', 'Change%']];

    // Append each entity row
    entities.forEach(ent => {
      rows.push([ent.label, ent.total, ent.change]);
    });
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard_stats.csv';
    a.click();
    URL.revokeObjectURL(url);
  }


  return (
    <div className="!py-6" >
      {/* Page header */}
      <div className='  flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight text-slate-900'>Analytics</h1>
          <p className='text-slate-600'>Green, clean, and fast: your operation at a glance.</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='hidden sm:flex items-center gap-1 rounded-xl border border-emerald-200 bg-white px-2 py-1'>
            <Calendar className='h-4 w-4 text-emerald-600' />
            <QuickPreset label='7D' active={range.preset === '7d'} onClick={() => setPreset('7d')} />
            <QuickPreset label='30D' active={range.preset === '30d'} onClick={() => setPreset('30d')} />
            <QuickPreset label='90D' active={range.preset === '90d'} onClick={() => setPreset('90d')} />
            <QuickPreset label='YTD' active={range.preset === 'ytd'} onClick={() => setPreset('ytd')} />
          </div>
          <button onClick={exportCSV} className='inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50'>
            <Download className='h-4 w-4' /> Export CSV
          </button>
          <button onClick={() => Refreash()} title='Refresh' className='inline-grid place-items-center rounded-xl border border-emerald-200 bg-white h-10 w-10 text-emerald-700 hover:bg-emerald-50'>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3'>{error}</div>}

      {/* KPI row */}
      <section className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : [
            { label: 'Users', value: overview.users.total, change: overview.users.change, trend: overview.users.trend, icon: Users },
            { label: 'Services', value: overview.services.total, change: overview.services.change, trend: overview.services.trend, icon: ShoppingBag },
            { label: 'Orders', value: overview.orders.total, change: overview.orders.change, trend: overview.orders.trend, icon: ShoppingBag },
            { label: 'Revenue', value: overview.revenue.total, change: overview.revenue.change, trend: overview.revenue.trend, icon: Wallet, prefix: '$' },
          ].map(k => <StatCard key={k.label} {...k} />)}
      </section>

      {/* Secondary insights */}
      <section className='mt-6 '>
        <div className='rounded-2xl border border-emerald-200 bg-white p-4 '>
          <SectionHeader title='Performance by Module' subtitle='Totals & momentum across key areas.' />
          <div className='mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-4'>
            {entities.map(e => (
              <ModuleRow key={e.key} entity={e} loading={loading} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className='mt-6 max-xl:space-y-6 xl:grid gap-6 xl:grid-cols-2'>
        <div className=''>
          <SectionHeader title='Recent Orders' />
          <RecentTable rows={recent.orders} loading={recentLoading} empty='No recent orders' />
        </div>
        <div className='space-y-6'>
          <SectionHeader title='Recent Withdrawals' />
          <RecentTable rows={recent.withdraws} loading={recentLoading} empty='No withdrawal requests' />
        </div>
      </section>
    </div>
  );
}

/* ----------------------------- UI Components ----------------------------- */

function QuickPreset({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-2 py-1 text-xs rounded-lg transition ${active ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'}`}>
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

function StatCard({ label, value, change, trend, icon: Icon, prefix }) {
  const positive = change >= 0;
  return (
    <div className='group rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm hover:shadow-md transition'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='text-sm text-slate-500'>{label}</p>
          <div className='mt-1 flex items-baseline gap-2'>
            <h3 className='text-2xl font-semibold text-slate-900'>
              {prefix}
              {formatNumber(value)}
            </h3>
            <span className={`inline-flex items-center gap-1 text-xs ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {positive ? <ArrowUpRight className='h-3.5 w-3.5' /> : <ArrowDownRight className='h-3.5 w-3.5' />}
              {Math.abs(change)}%
            </span>
          </div>
        </div>
        <div className='h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 grid place-items-center text-emerald-700'>
          <Icon className='h-5 w-5' />
        </div>
      </div>
      <div className='mt-4'>
        <SparkArea data={trend} />
      </div>
    </div>
  );
}

function ModuleRow({ entity, loading }) {
  const Icon = entity.icon || BarChart3;
  if (loading) return <div className='h-20 rounded-xl border border-emerald-100 bg-white animate-pulse' />;
  const positive = (entity.change ?? 0) >= 0;
  return (
    <Link href={entity.href} className='block rounded-xl border border-emerald-100 bg-white p-4 hover:border-emerald-300 hover:shadow-sm transition'>
      <div className='flex items-start justify-between flex-col sm:flex-row gap-3'>
        <div className='min-w-0 max-sm:w-full flex max-sm:justify-between flex-row sm:flex-col'>
          <div className='flex flex-col flex-none items-center gap-2'>
            <div className='h-9 w-9 flex-none rounded-lg bg-emerald-50 border border-emerald-200 grid place-items-center text-emerald-700'>
              <Icon className='h-5 w-5' />
            </div>
            <p title={entity.label} className='text-xs font-medium text-slate-800 truncate'>
              {entity.label}
            </p>
          </div>
          <div>
            <div className='mt-2 flex items-center gap-3'>
              <span className='text-lg font-semibold text-slate-900'>{formatNumber(entity.total)}</span>
              <span className={`inline-flex items-center gap-1 text-xs ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {positive ? <ArrowUpRight className='h-3.5 w-3.5' /> : <ArrowDownRight className='h-3.5 w-3.5' />}
                {Math.abs(entity.change ?? 0)}%
              </span>
            </div>
            <div className='mt-2'>
              <MiniBar value={progressFromTrend(entity.trend)} />
            </div>
          </div>
        </div>
        <div className='w-full'>
          <SparkArea width={140} height={48} data={entity.trend || []} />
        </div>
      </div>
    </Link>
  );
}

function RecentTable({ rows, loading, empty }) {
  if (loading) {
    return (
      <div className='rounded-2xl border border-emerald-200 bg-white p-4'>
        <div className='space-y-2'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-12 w-full rounded-lg bg-emerald-50 animate-pulse' />
          ))}
        </div>
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return <div className='rounded-2xl border border-emerald-200 bg-white p-6 text-slate-500'>{empty}</div>;
  }
  return (
    <div className='overflow-hidden rounded-2xl border border-emerald-200 bg-white overflow-x-auto'>
      <table className='min-w-full'>
        <thead className='bg-emerald-50/60'>
          <tr className='text-left text-sm text-slate-600'>
            <th className='px-4 py-3'>Ref</th>
            <th className='px-4 py-3'>Customer</th>
            <th className='px-4 py-3'>Status</th>
            <th className='px-4 py-3'>Amount</th>
            <th className='px-4 py-3'>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className='border-t border-emerald-100 text-sm hover:bg-emerald-50/40'>
              <td className='px-4 py-3 text-nowrap font-medium text-slate-800'>{r.ref || r.id || '-'}</td>
              <td className='px-4 py-3 text-nowrap text-slate-700'>{r.customer || r.user || '-'}</td>
              <td className='px-4 py-3 text-nowrap'>
                <span className={`inline-flex text-nowrap items-center rounded-lg px-2 py-1 text-xs font-medium ${statusTone(r.status)}`}>{r.status || '-'}</span>
              </td>
              <td className='px-4 py-3 text-nowrap text-slate-800'>{typeof r.amount === 'number' ? `$${formatNumber(r.amount)}` : r.amount || '-'}</td>
              <td className='px-4 py-3 text-nowrap text-slate-600'>{formatDate(r.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <svg height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full text-emerald-500">
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
    <div className='h-2 w-full rounded-full bg-emerald-50 border border-emerald-100'>
      <div className='h-full rounded-full bg-emerald-500' style={{ width: v + '%' }} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className='rounded-2xl border border-emerald-200 bg-white p-4'>
      <div className='h-6 w-28 bg-emerald-50 rounded animate-pulse' />
      <div className='mt-3 h-8 w-36 bg-emerald-50 rounded animate-pulse' />
      <div className='mt-4 h-12 w-full bg-emerald-50 rounded animate-pulse' />
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
  if (['paid', 'completed', 'success', , 'Accepted', 'Delivered', 'approved', 'resolved'].includes(s)) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
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

function mockOverview() {
  return {
    users: { total: 12840, change: 6.2, trend: randSeries() },
    categories: { total: 42, change: 2.1, trend: randSeries(10, 20) },
    services: { total: 980, change: 4.8, trend: randSeries(12, 60) },
    jobs: { total: 154, change: 3.1, trend: randSeries(12, 15) },
    orders: { total: 2371, change: 5.7, trend: randSeries(12, 70) },
    revenue: { total: 184320, change: 7.9, trend: randSeries(12, 100) },
    withdraws: { total: 312, change: -1.4, trend: randSeries(12, 30) },
  };
}

function mockEntities() {
  const o = mockOverview();
  return {
    users: o.users,
    categories: o.categories,
    services: o.services,
    jobs: o.jobs,
    levelup: { total: 87, change: 9.2, trend: randSeries(12, 10) },
    orders: o.orders,
    withdraw: o.withdraws,
    invoices: { total: 1432, change: 4.1, trend: randSeries(12, 50) },
    faqs: { total: 128, change: 1.3, trend: randSeries(12, 5) },
    blogs: { total: 64, change: 2.9, trend: randSeries(12, 8) },
    guides: { total: 37, change: 0.5, trend: randSeries(12, 6) },
    terms: { total: 12, change: 0, trend: randSeries(12, 2) },
    chat: { total: 4890, change: 12.4, trend: randSeries(12, 80) },
    reports: { total: 73, change: -3.2, trend: randSeries(12, 12) },
    settings: { total: 1, change: 0, trend: randSeries(12, 1) },
  };
}

function mockRecent() {
  const now = Date.now();
  const mk = (idx, status, amount) => ({ id: 'INV-' + (7000 + idx), ref: 'INV-' + (7000 + idx), customer: ['Omar', 'Lina', 'Yousef', 'Hana', 'Mona'][idx % 5], status, amount, date: new Date(now - idx * 86400000).toISOString() });
  return {
    orders: [mk(1, 'paid', 320), mk(2, 'pending', 145), mk(3, 'paid', 690), mk(4, 'failed', 120), mk(5, 'paid', 240), mk(6, 'paid', 510)],
    withdraws: [mk(1, 'processing', 1200), mk(2, 'approved', 900), mk(3, 'rejected', 480)],
    reports: [
      { id: 'RPT-101', ref: 'RPT-101', user: 'Admin', status: 'open', amount: '-', date: new Date(now - 3600e3).toISOString() },
      { id: 'RPT-102', ref: 'RPT-102', user: 'Support', status: 'resolved', amount: '-', date: new Date(now - 7200e3).toISOString() },
    ],
  };
}

function progressFromTrend(trend = []) {
  if (!trend || !trend.length) return 45;
  const first = trend[0];
  const last = trend[trend.length - 1];
  const delta = last - first;
  const pct = 50 + Math.max(-40, Math.min(40, delta));
  return pct; // mocked mapping
}
