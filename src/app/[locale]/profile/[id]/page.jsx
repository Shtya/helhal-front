'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Smartphone, Shield, Calendar, Clock, Award, User as UserIcon, DollarSign, Repeat, Star, Globe, ArrowRight, Sparkles, BadgeCheck, User, Receipt, FileText, Video } from 'lucide-react';
import api from '@/lib/axios';
import { StatCard } from '@/components/dashboard/Ui';
import { useAuth } from '@/context/AuthContext';
import { resolveUrl } from '@/utils/helper';

const mockJobs = [
  {
    id: "job-001",
    title: "Arabic-English Subtitle Translator Needed",
    description: "Translate short-form video content from Arabic to English.\nMust maintain tone and timing.\nExperience with subtitle tools preferred.",
    categoryId: "translation",
    budget: "50.00",
    budgetType: "fixed",
    preferredDeliveryDays: 5,
    skillsRequired: ["Translation", "Subtitling", "Arabic"],
    attachments: [],
    buyer: { username: "media_hub" },
  },
  {
    id: "job-002",
    title: "React Dashboard QA Tester (Freelance)",
    description: "We're looking for a QA tester to validate a React-based analytics dashboard.\nTasks include regression testing, edge case validation, and reporting UI bugs.\nMust be familiar with browser dev tools and responsive testing.",
    categoryId: "development",
    budget: "25.00",
    budgetType: "hourly",
    preferredDeliveryDays: 10,
    skillsRequired: ["QA Testing", "React", "Browser DevTools"],
    attachments: [
      { name: "test-plan.pdf", url: "uploads/test-plan.pdf", type: "document" }
    ],
    buyer: { username: "dash_ops" },
  },
  {
    id: "job-003",
    title: "Voiceover Artist for Educational Biology Series",
    description: "Seeking a warm, clear voice for a biology explainer series.\nEach episode is 3–5 minutes.\nScript provided.\nBonus if you can sync VO with visuals.",
    categoryId: "audio",
    budget: "100.00",
    budgetType: "fixed",
    preferredDeliveryDays: 7,
    skillsRequired: ["Voiceover", "Biology", "Audio Sync"],
    attachments: [],
    buyer: { username: "edu_studio" },
  },
  {
    id: "job-004",
    title: "Figma Designer for Arabic-first Mobile App",
    description: "Design clean, RTL-friendly mobile screens for a fintech app.\nMust understand Arabic UX conventions and currency formatting.\nDeliver layered Figma file with components.",
    categoryId: "design",
    budget: "40.00",
    budgetType: "hourly",
    preferredDeliveryDays: 14,
    skillsRequired: ["Figma", "Arabic UX", "Mobile Design"],
    attachments: [
      { name: "wireframes.png", url: "uploads/wireframes.png", type: "image" }
    ],
    buyer: { username: "fintech_lab" },
  }
];


export default function ProfilePageClient() {
  const { id } = useParams();
  const { user } = useAuth();
  const isSameUser = user?.id === id;
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/auth/user/${id}`);
        const data = res?.data || res;
        if (!ignore) setBuyer(data);
      } catch (e1) {
        if (!ignore) setError('Failed to load user. Try again.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      ignore = true;
    };
  }, [id]);

  const name = buyer?.username || buyer?.email || 'Unknown';
  const initials = useMemo(() => getInitials(name), [name]);
  const role = buyer?.role || 'buyer';

  if (loading) return <SkeletonPage />;
  if (error) {
    return (
      <main className='mx-auto max-w-6xl p-6 text-center min-h-[250px] flex items-center justify-center '>
        <div className='flex-1 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-4'>{error || "Failed to load user. Try again."}</div>
      </main>
    );
  }
  if (!buyer) return null;


  return (
    <main className='container !my-10'>
      {/* ===== Hero / Header ===== */}
      <section className='relative overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-lg'>
        <div className='absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 opacity-95' />
        <div className='relative p-6 sm:p-8 text-white'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
            {/* Avatar */}
            <div className='h-20 w-20 grid place-items-center rounded-2xl bg-white/15 ring-4 ring-white/10 text-white text-3xl font-extrabold shadow'>{initials}</div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center flex-wrap gap-3'>
                <h1 className='text-2xl sm:text-3xl font-semibold tracking-tight truncate drop-shadow'>{toTitle(name)}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-white/30 bg-white/15`}>
                  <Shield className='h-3.5 w-3.5' /> {toTitle(role)}
                </span>
              </div>

              <div className='mt-2 text-sm/6 flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90'>
                <span className='inline-flex items-center gap-1.5'>
                  <Mail className='h-4 w-4' /> {buyer?.email || '—'}
                </span>
                <span className='inline-flex items-center gap-1.5'>
                  <Calendar className='h-4 w-4' /> Member since {prettyDate(buyer?.memberSince || buyer?.created_at)}
                </span>
                <span className='inline-flex items-center gap-1.5'>
                  <Clock className='h-4 w-4' /> Last login {prettyDate(buyer?.lastLogin)} <em className='text-white/70'>({fromNow(buyer?.lastLogin)})</em>
                </span>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {!isSameUser && <Link href={`/chat?userId=${buyer?.id || ''}`} className='px-4 py-2 text-sm font-semibold rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 transition shadow'>
                Message
              </Link>}
            </div>
          </div>

          {/* KPIs */}
          <div className='mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {/* <StatCard title='Orders Completed' value={Number(stats.ordersCompleted || 0)} hint='All-time' icon={CheckCircle2} gradient='from-emerald-500 via-teal-500 to-cyan-400' /> */}

            <StatCard gradient='from-emerald-500 via-teal-500 to-cyan-400' icon={Star} title='Orders' value={buyer?.ordersCompleted ?? 0} />
            <StatCard gradient='from-sky-500 via-indigo-500 to-violet-500' icon={DollarSign} title='Total Spent' value={formatMoney(buyer?.totalSpent ?? 0)} />
            <StatCard gradient='from-amber-400 via-orange-500 to-rose-500' icon={Repeat} title='Repeat Buyers' value={buyer?.repeatBuyers ?? 0} />
            <StatCard gradient='from-fuchsia-500 via-rose-500 to-orange-400' icon={Award} title='Reputation' value={buyer?.reputationPoints ?? 0} />
          </div>
        </div>
      </section>

      {/* ===== Main ===== */}
      <section className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left rail */}
        <div className='lg:col-span-1'>
          <div className='sticky top-30 space-y-6 '>
            <Card title='About'>
              <p className='text-slate-700 leading-relaxed'>{buyer?.description || 'No description provided.'}</p>
              <div className='mt-3 flex flex-wrap gap-2'>
                {buyer?.verified && <Badge icon={BadgeCheck} text='Verified' />}
                {buyer?.pro && <Badge icon={Sparkles} text='Pro Member' />}
              </div>
            </Card>

            <Card title='Contact'>
              <InfoRow icon={Mail} label='Email' value={buyer?.email || '—'} copyable />
              <InfoRow icon={Smartphone} label='Phone' value={buyer?.phone ? [buyer?.countryCode?.dial_code, buyer?.phone].join(" ") : '—'} />
              <InfoRow icon={Globe} label='Country' value={buyer?.country?.name || '—'} />
            </Card>

            <Card title='Account'>
              <InfoRow icon={UserIcon} label='User ID' value={buyer?.id || '—'} copyable />
              <InfoRow icon={Calendar} label='Created' value={prettyDate(buyer?.created_at)} />
              <InfoRow icon={Clock} label='Updated' value={prettyDate(buyer?.updated_at)} />
              <InfoRow icon={Award} label='Referral Code' value={buyer?.referralCode || '—'} copyable />
            </Card>
          </div>
        </div>

        {/* Right column */}
        <div className='space-y-6 lg:col-span-2'>
          <Card title='Activity'>
            <InfoRow icon={Clock} label='Last Activity' value={prettyDate(buyer?.lastActivity)} />
            <InfoRow icon={Clock} label='Response Time' value={buyer?.responseTime || '—'} />
            <InfoRow icon={Clock} label='Delivery Time' value={buyer?.deliveryTime || '—'} />
            <InfoRow icon={Calendar} label='Deactivated At' value={prettyDate(buyer?.deactivatedAt)} />
          </Card>

          <Card title='Intro video'>
            {buyer?.introVideoUrl ? <video src={resolveUrl(buyer?.introVideoUrl)} controls className='aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black' />
              : (<div>
                <div type='button' className='group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-10 text-slate-600'>
                  <Video className='h-5 w-5' />
                  <span className='font-medium'>This user hasn’t uploaded an intro video yet.</span>
                </div>
              </div>
              )}
          </Card>

          <Card title='Portfolio'>
            <div className='mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4'>
              {buyer?.portfolioItems && buyer.portfolioItems.length > 0 ? (
                buyer.portfolioItems.map((item, index) => (
                  <figure
                    key={index}
                    className='group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'
                  >
                    <img
                      src={resolveUrl(item)}
                      alt='Portfolio'
                      className='aspect-[16/11] w-full object-cover'
                    />
                  </figure>
                ))
              ) : (
                <div className='col-span-full text-center text-slate-500'>
                  This user has no portfolio items yet.
                </div>
              )}
            </div>
          </Card>

          <Card title='Portfolio file'>

            {/* Preview / state */}
            <div className='mt-4'>
              {buyer?.portfolioFile ? (
                <div className='relative flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3'>
                  <a
                    href={resolveUrl(buyer.portfolioFile.url)}
                    target='_blank'
                    rel='noreferrer'
                    className='flex items-center gap-3 text-slate-800 hover:underline flex-1 min-w-0'
                    title={resolveUrl(buyer.portfolioFile.url)}
                  >
                    <FileText className='h-5 w-5' />
                    <span className='truncate text-ellipsis flex-1 min-w-0'>{buyer.portfolioFile.filename}</span>
                  </a>

                  {/* Overlay to indicate read-only */}
                  <div className='absolute inset-0 rounded-xl bg-black/5 pointer-events-none' />
                </div>
              ) : (
                <div className='cursor-default rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500'>
                  No file uploaded.
                </div>
              )}
            </div>
          </Card>



          {/* ===== Services (Redesigned) ===== */}
          {buyer?.role === 'seller' ? (
            <Card title="Services">
              {Array.isArray(buyer?.services) && buyer.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {buyer.services.map(svc => (
                    <ServiceCard key={svc?.id || svc?.title} service={svc} />
                  ))}
                </div>
              ) : (
                <EmptyState text="No services yet." />
              )}
            </Card>
          ) : (
            <Card title="Jobs">
              {Array.isArray(buyer?.jobs) && buyer?.jobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {buyer?.jobs.map(job => (
                    <JobCard key={job?.id || job?.title} job={job} />
                  ))}
                </div>
              ) : (
                <EmptyState text="No jobs yet." />
              )}
            </Card>
          )}

        </div>
      </section>
    </main>
  );
}

/* =============================== Components =============================== */

function SkeletonPage() {
  return (

    <main className='container !my-10'>
      <div className=' mx-auto px-4 sm:px-6 lg:px-8 animate-pulse'>



        <div className='h-36 rounded-3xl bg-slate-100' />
        <div className='mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='h-20 rounded-xl bg-slate-100' />
          ))}
        </div>
        <div className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='h-64 rounded-2xl bg-slate-100' />
          <div className='lg:col-span-2 h-64 rounded-2xl bg-slate-100' />
        </div>
      </div>
    </main>
  );
}

function Card({ title, children }) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm'>
      {title && <h2 className='text-sm font-semibold text-slate-900 tracking-wide mb-3'>{title}</h2>}
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, copyable }) {
  const val = value ?? '—';
  return (
    <div className='flex items-center justify-between gap-3 py-2'>
      <div className='flex items-center gap-2 min-w-0'>
        {Icon && <Icon className='h-4 w-4 text-slate-500' />}
        <span className='text-sm text-slate-500'>{label}</span>
      </div>
      <div className='flex items-center gap-2 min-w-0'>
        <span className='text-sm font-medium text-slate-900 truncate max-w-[280px]' title={String(val)}>
          {String(val)}
        </span>
        {copyable && (
          <button type='button' onClick={() => navigator.clipboard.writeText(String(val))} className='inline-flex items-center justify-center rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 active:scale-95'>
            Copy
          </button>
        )}
      </div>
    </div>
  );
}

function Badge({ icon: Icon, text }) {
  return (
    <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2.5 py-1 text-xs font-semibold'>
      <Icon className='h-3.5 w-3.5' /> {text}
    </span>
  );
}

/* ===== Service Card (Redesign) ===== */
function ServiceCard({ service }) {
  const initials = getInitials(service?.title || 'Service');
  const price = pickPrice(service?.packages);
  const delivery = service?.packages?.[0]?.deliveryTime ?? service?.deliveryTime ?? '—';
  const rating = clampToOneDecimal(service?.rating ?? 0);

  return (
    <div className='group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300'>
      {/* Top row */}
      <div className='flex items-center gap-3'>
        <div className=' flex-none h-11 w-11 grid place-items-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-semibold shadow'>{initials}</div>
        <div className='min-w-0 truncate whitespace-nowrap'>
          <Link href={`/services/category/${service?.slug || service?.id || ''}`} className='  font-semibold text-slate-900 group-hover:text-emerald-600 ' title={service?.title || 'Untitled service'}>
            {service?.title || 'Untitled service'}
          </Link>
          {service?.category && <div className='mt-0.5 text-xs text-slate-500 truncate'>{service.category}</div>}
        </div>
      </div>

      {/* Metrics */}
      <div className='mt-3 grid grid-cols-3 gap-2 text-sm'>
        <Metric icon={DollarSign} label='From' value={formatMoney(price)} />
        <Metric icon={Star} label='Rating' value={rating} />
        <Metric icon={Clock} label='Delivery' value={`${delivery}d`} />
      </div>

    </div>
  );
}



function JobCard({ job }) {
  const initials = getInitials(job?.title || 'Job');
  const budget = job?.budget ? parseFloat(job.budget) : null;
  const delivery = job?.preferredDeliveryDays ?? '—';
  const buyer = job?.buyer?.username || 'Unknown';
  const budgetLabel = job?.budgetType === 'hourly' ? `${formatMoney(budget)}/hr` : formatMoney(budget);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Top row */}
      <div className="flex items-center gap-3">
        <div className="flex-none h-11 w-11 grid place-items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 text-white font-semibold shadow">
          {initials}
        </div>
        <div className="min-w-0 truncate whitespace-nowrap">
          <Link
            href={`/jobs?job=${job?.id}`}
            className="font-semibold text-slate-900 group-hover:text-indigo-600"
            title={job?.title || 'Untitled job'}
          >
            {job?.title || 'Untitled job'}
          </Link>
          {job?.buyer?.username && (
            <div className="mt-0.5 text-xs text-slate-500 truncate">Posted by {job.buyer.username}</div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <Metric icon={DollarSign} label="Budget" value={budgetLabel} />
        <Metric icon={Clock} label="Delivery" value={`${delivery}d`} />
        <Metric
          icon={Receipt}
          label="Type"
          value={job?.budgetType === 'hourly' ? 'Hourly' : 'Fixed'}
        />

      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap line-clamp-4">
        {job?.description}
      </p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className='rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2'>
      <div className='flex items-center gap-1.5 text-slate-600 text-xs'>
        <Icon className='h-3.5 w-3.5 text-emerald-500' />
        <span>{label}</span>
      </div>
      <div className='mt-0.5 text-sm font-semibold text-slate-900'>{value}</div>
    </div>
  );
}

function EmptyState({ text, actionHref, actionText }) {
  return (
    <div className='rounded-xl border border-dashed border-slate-300 p-8 text-center bg-slate-50/60'>
      <div className='text-slate-600 text-sm'>{text}</div>
      {actionHref && (
        <Link href={actionHref} className='mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-sm font-semibold shadow-lg transition-all duration-300 hover:brightness-110 active:scale-95'>
          <Sparkles className='h-4 w-4' />
          {actionText || 'Create'}
        </Link>
      )}
    </div>
  );
}

/* =============================== Helpers =============================== */

function getInitials(nameOrEmail) {
  if (!nameOrEmail) return '?';
  const s = String(nameOrEmail).trim();
  if (!s) return '?';
  if (s.includes('@')) return s[0].toUpperCase();
  const parts = s
    .replace(/[_.-]+/g, ' ')
    .split(' ')
    .filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = parts[1]?.[0] || '';
  return (first + last).toUpperCase() || s[0].toUpperCase();
}

function toTitle(s) {
  if (!s) return s;
  return String(s)
    .split(' ')
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

function prettyDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  } catch {
    return String(iso);
  }
}

function fromNow(iso) {
  if (!iso) return '—';
  try {
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    const now = Date.now();
    const t = new Date(iso).getTime();
    const diffMs = t - now;
    const abs = Math.abs(diffMs);
    const min = Math.round(abs / 60000);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    if (min < 60) return rtf.format(Math.sign(diffMs) * -min, 'minute');
    if (hr < 24) return rtf.format(Math.sign(diffMs) * -hr, 'hour');
    return rtf.format(Math.sign(diffMs) * -day, 'day');
  } catch {
    return '—';
  }
}

function formatMoney(numLike) {
  const n = Number(numLike ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(n);
  }
}

function clampToOneDecimal(n) {
  const x = Number(n || 0);
  if (Number.isNaN(x)) return '0.0';
  return x.toFixed(1);
}

function pickPrice(pkgs) {
  if (!Array.isArray(pkgs) || pkgs.length === 0) return 0;
  const prices = pkgs.map(p => Number(p?.price || 0)).filter(n => !Number.isNaN(n));
  if (!prices.length) return 0;
  return Math.min(...prices);
}
