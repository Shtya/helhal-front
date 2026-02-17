'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Smartphone, Shield, Calendar, Clock, Award, User as UserIcon, DollarSign, Repeat, Star, Globe, ArrowRight, Sparkles, BadgeCheck, User, Receipt, FileText, Video, CheckCircle2, AlertCircle, ChevronUp, ChevronDown, GraduationCap } from 'lucide-react';
import api from '@/lib/axios';
import { StatCard } from '@/components/dashboard/Ui';
import { useAuth } from '@/context/AuthContext';
import { resolveUrl } from '@/utils/helper';
import { formatResponseTime } from '@/utils/profile';
import { FiClipboard } from 'react-icons/fi';
import { Link } from '@/i18n/navigation';
import IdentityStatus from '@/components/atoms/IdentityStatus';
import TopRatedBadge from '@/components/atoms/TopRatedBadge';
import Img from '@/components/atoms/Img';

export default function ProfilePageClient() {
  const t = useTranslations('Profile.public');
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
        if (!ignore) setError(t('failedToLoad'));
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchUser();
    return () => {
      ignore = true;
    };
  }, [id, t]);


  const name = buyer?.username || t('unknown');
  const initials = useMemo(() => getInitials(name), [name]);
  const role = buyer?.role || 'buyer';

  const [reviews, setReviews] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReviews = async (cursor = null) => {
    try {
      const params = {
        limit: 5,
        cursor: cursor
      };
      const res = await api.get(`/ratings/user/${id}/reviews`, { params });

      if (cursor) {
        setReviews(prev => [...prev, ...res.data.items]);
      } else {
        setReviews(res.data.items);
      }
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoadingRates(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (id) fetchReviews();
  }, [id, role]);

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchReviews(nextCursor);
  };


  if (loading) return <SkeletonPage />;
  if (error) {
    return (
      <main className='mx-auto max-w-6xl p-6 text-center min-h-[250px] flex items-center justify-center '>
        <div className='flex-1 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-4'>{error || t('failedToLoad')}</div>
      </main>
    );
  }
  if (!buyer) return null;

  const emailVerified = !!buyer?.email || false;
  const phoneVerified = buyer?.isPhoneVerified || false;

  return (
    <main className='container !my-10'>
      {/* ===== Hero / Header ===== */}
      <section className='relative rounded-3xl border border-main-200 bg-white shadow-lg'>
        <div className='absolute inset-0 bg-gradient-to-r from-main-500 to-main-400 opacity-95' />
        <div className='relative p-6 sm:p-8 text-white'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
            {/* Avatar */}
            <div className='h-20 w-20 grid place-items-center rounded-2xl bg-white/15 ring-4 ring-white/10 text-white text-3xl font-extrabold shadow'>{initials}</div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center flex-wrap gap-3'>
                <h1 className='text-2xl sm:text-3xl font-semibold tracking-tight truncate drop-shadow'>{toTitle(name)}</h1>
                <IdentityStatus user={buyer} />
                <TopRatedBadge isTopRated={buyer?.topRated} />
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-white/30 bg-white/15`}>
                  <Shield className='h-3.5 w-3.5' /> {toTitle(role)}
                </span>
              </div>

              <div className='mt-2 text-sm/6 flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90'>
                {user?.role !== 'seller' && <span className='inline-flex items-center gap-1.5'>
                  <Mail className='h-4 w-4' /> {buyer?.email || '—'}
                </span>}
                <span className='inline-flex items-center gap-1.5'>
                  <Calendar className='h-4 w-4' /> {t('memberSince')} {prettyDate(buyer?.memberSince || buyer?.created_at)}
                </span>
                <span className='inline-flex items-center gap-1.5'>
                  <Clock className='h-4 w-4' /> {t('lastLogin')} {prettyDate(buyer?.lastLogin)} <em className='text-white/70'>({fromNow(buyer?.lastLogin)})</em>
                </span>
              </div>
            </div>

            <Link
              href={`/chat?userId=${buyer?.id || ''}`}
              // Mobile: Full width, Desktop: auto width. Prominent main-600 background.
              className='inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-bold rounded-xl bg-white text-main-700 hover:bg-main-50 active:scale-95 transition shadow-lg sm:min-w-[140px]'
            >
              <Mail className="w-5 h-5" />
              {t('message') || 'Chat with Seller'}
            </Link>
          </div>

          {/* KPIs */}
          <div className='mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
            {/* <StatCard title='Orders Completed' value={Number(stats.ordersCompleted || 0)} hint='All-time' icon={CheckCircle2} gradient='from-main-500 via-teal-500 to-cyan-400' /> */}
            <StatCard
              gradient='from-yellow-400 via-amber-500 to-orange-400'
              icon={Star}
              title={t('rating')}
              value={buyer?.rating ? `${Number(buyer?.rating || 0).toFixed(1)} / 5` : '—'}
            // hint={`${buyer?.reviewsCount || 0} ${t('rating')}`}
            />
            <StatCard gradient='from-main-500 via-teal-500 to-cyan-400' icon={Star} title={t('orders')} value={buyer?.ordersCompleted ?? 0} />
            <StatCard gradient='from-amber-400 via-orange-500 to-rose-500' icon={Repeat} title={t('repeatBuyers')} value={buyer?.repeatBuyers ?? 0} />
            <StatCard
              gradient="from-sky-500 via-indigo-500 to-violet-500"
              icon={Award}
              title={t('responseTime')}
              value={formatResponseTime(buyer.responseTime)}
              hint={buyer.responseTime ? t('averageTime') : t('notYetCalculated')}
            />

            {/* <StatCard gradient='from-fuchsia-500 via-rose-500 to-orange-400' icon={Award} title='Reputation' value={buyer?.reputationPoints ?? 0} /> */}
          </div>
        </div>
      </section>

      {/* ===== Main ===== */}
      <section className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left rail */}
        <div className='lg:col-span-1'>
          <div className='sticky top-30 space-y-6 '>
            <Card title={t('about')}>
              <p className='text-slate-700 leading-relaxed'>{buyer?.description || t('noDescription')}</p>
              <div className='mt-3 flex flex-wrap gap-2'>
                {buyer?.verified && <Badge icon={BadgeCheck} text={t('verified')} />}
                {buyer?.pro && <Badge icon={Sparkles} text={t('proMember')} />}
              </div>
            </Card>

            <Card title={t('contact')}>
              <VerificationStatusRow icon={Mail} label={t('email')} value={user?.role !== 'seller' ? buyer?.email || '—' : ''} copyable={true} verified={emailVerified} />
              <VerificationStatusRow icon={Smartphone} label={t('phone')} value={user?.role !== 'seller' ? buyer?.phone ? [buyer?.countryCode?.dial_code, buyer?.phone].join(" ") : '—' : ''} verified={phoneVerified} />
              <InfoRow icon={Globe} label={t('country')} value={buyer?.country?.name || '—'} />
            </Card>

            {buyer.role !== 'seller' && <Card title={t('account')}>
              <InfoRow icon={UserIcon} label={t('userId')} value={buyer?.id || '—'} copyable />
              <InfoRow icon={Calendar} label={t('created')} value={prettyDate(buyer?.created_at)} />
              <InfoRow icon={Clock} label={t('updated')} value={prettyDate(buyer?.updated_at)} />
              <InfoRow icon={Award} label={t('referralCode')} value={buyer?.referralCode || '—'} copyable />
            </Card>}

            {buyer?.role === 'seller' && (
              <Card title={t('education')}>
                {Array.isArray(buyer?.education) && buyer.education.length > 0 ? (
                  <div className="space-y-3">
                    {buyer.education.map((ed, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-start gap-3">
                          <GraduationCap className="h-5 w-5 text-main-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">{ed?.degree || '—'}</div>
                            <div className="text-sm text-slate-600">{ed?.institution || '—'}</div>
                            {ed?.year && <div className="text-xs text-slate-500 mt-1">{t('year')}: {ed.year}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-slate-500 text-sm">{t('noEducation')}</div>
                )}
              </Card>
            )}

            {buyer?.role === 'seller' && (
              <Card title={t('certifications')}>
                {Array.isArray(buyer?.certifications) && buyer.certifications.length > 0 ? (
                  <div className="space-y-3">
                    {buyer.certifications.map((cert, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-main-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">{cert?.name || '—'}</div>
                            <div className="text-sm text-slate-600">{cert?.issuingOrganization || '—'}</div>
                            {cert?.year && <div className="text-xs text-slate-500 mt-1">{t('year')}: {cert.year}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-slate-500 text-sm">{t('noCertifications')}</div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className='space-y-6 lg:col-span-2'>
          {buyer.role !== 'seller' && <Card title={t('activity')}>
            <InfoRow icon={Clock} label={t('lastActivity')} value={prettyDate(buyer?.lastActivity)} />
            <InfoRow icon={Clock} label={t('responseTime')} value={formatResponseTime(buyer?.responseTime)} />
            <InfoRow icon={Clock} label={t('deliveryTime')} value={buyer?.deliveryTime || '—'} />
            <InfoRow icon={Calendar} label={t('deactivatedAt')} value={prettyDate(buyer?.deactivatedAt)} />
          </Card>}

          {/* <Card title={t('introVideo')}>
            {buyer?.introVideoUrl ? <video src={resolveUrl(buyer?.introVideoUrl)} controls className='aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black' />
              : (<div>
                <div type='button' className='group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-10 text-slate-600'>
                  <Video className='h-5 w-5' />
                  <span className='font-medium'>{t('noIntroVideo')}</span>
                </div>
              </div>
              )}
          </Card>

          <Card title={t('portfolio')}>
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
                  {t('noPortfolio')}
                </div>
              )}
            </div>
          </Card>

          <Card title={t('portfolioFile')}>

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

                  <div className='absolute inset-0 rounded-xl bg-black/5 pointer-events-none' />
                </div>
              ) : (
                <div className='cursor-default rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500'>
                  {t('noFileUploaded')}
                </div>
              )}
            </div>
          </Card> */}



          {/* ===== Services (Redesigned) ===== */}
          {buyer?.role === 'seller' ? (
            <Card title={t('services')}>
              {Array.isArray(buyer?.services) && buyer.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {buyer.services.map(svc => (
                    <ServiceCard key={svc?.id || svc?.title} service={svc} />
                  ))}
                </div>
              ) : (
                <EmptyState text={t('noServices')} />
              )}
            </Card>
          ) : (
            <Card title={t('jobs')}>
              {Array.isArray(buyer?.jobs) && buyer?.jobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {buyer?.jobs.map(job => (
                    <JobCard key={job?.id || job?.title} job={job} />
                  ))}
                </div>
              ) : (
                <EmptyState text={t('noJobs')} />
              )}
            </Card>
          )}
          {loadingRates ? (
            <RatingSkeleton />
          ) : (
            <Card title={t('rates')}>

              {/* List Container - Always grid-cols-1 */}
              <div className="grid grid-cols-1 gap-4">
                {reviews.length > 0 ? reviews.map((review) => (
                  <ReviewItem
                    key={review.id}
                    review={review}
                    profileId={id}
                    t={t}
                  />
                )) : <EmptyState text={t('noReviews')} />}
              </div>

              {/* Load More Button */}
              {nextCursor && (
                <div className="pt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center px-6 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {loadingMore ? t('loading') : t('loadMore')}
                  </button>
                </div>
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

function RatingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-2 w-16 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-5/6 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
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
  const t = useTranslations('Profile.public');
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
            {t('copy')}
          </button>
        )}
      </div>
    </div>
  );
}
function VerificationStatusRow({ icon: Icon, value, copyable, label, verified }) {
  const t = useTranslations('Profile.accountVerification');
  // Use translations for common copy feedback if needed
  const tc = useTranslations('Profile.public');

  return (
    <div className='flex items-center justify-between gap-3 py-2'>
      {/* Label Section */}
      <div className='flex items-center gap-2 min-w-0'>
        {Icon && <Icon className='h-4 w-4 text-slate-500' />}
        <span className='text-sm text-slate-500'>{label}</span>
      </div>

      {/* Value & Status Section */}
      <div className='flex items-center gap-2 min-w-0'>
        {/* 1. Show Value and Copy Button if value exists */}
        {value && (
          <div className="flex items-center gap-2">
            <span
              className='text-sm font-medium text-slate-900 truncate max-w-[150px]'
              title={String(value)}
            >
              {String(value).trim()}
            </span>
            {copyable && (
              <button
                type='button'
                onClick={() => navigator.clipboard.writeText(String(value).trim())}
                className='inline-flex items-center justify-center rounded-md border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-50 active:scale-95'
              >
                {tc('copy')}
              </button>
            )}
          </div>
        )}

        {/* 2. Verification Badge */}
        {verified ? (
          <div className="flex items-center gap-1.5 text-main-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className='text-sm font-medium'>{t('verified')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className='text-sm font-medium'>{t('notVerified')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ icon: Icon, text }) {
  return (
    <span className='inline-flex items-center gap-1.5 rounded-full bg-main-50 text-main-700 ring-1 ring-main-200 px-2.5 py-1 text-xs font-semibold'>
      <Icon className='h-3.5 w-3.5' /> {text}
    </span>
  );
}

/* ===== Service Card (Redesign) ===== */
function ServiceCard({ service }) {
  const t = useTranslations('Profile.public');
  const initials = getInitials(service?.title || 'Service');
  const price = pickPrice(service?.packages);
  const delivery = service?.packages?.[0]?.deliveryTime ?? service?.deliveryTime ?? '—';
  const ordersCount = service?.ordersCount ?? 0;

  return (
    <div className='group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300'>
      {/* Top row */}
      <div className='flex items-center gap-3'>
        <div className=' flex-none h-11 w-11 grid place-items-center rounded-xl bg-gradient-to-r from-main-500 to-main-400 text-white font-semibold shadow'>{initials}</div>
        <div className='min-w-0 truncate whitespace-nowrap'>
          <Link href={`/services/category/${service?.slug || service?.id || ''}`} className='  font-semibold text-slate-900 group-hover:text-main-600 ' title={service?.title || t('untitledService')}>
            {service?.title || t('untitledService')}
          </Link>
          {service?.category && <div className='mt-0.5 text-xs text-slate-500 truncate'>{service.category}</div>}
        </div>
      </div>

      {/* Metrics */}
      <div className='mt-3 grid grid-cols-3 gap-2 text-sm'>
        <Metric icon={DollarSign} label={t('from')} value={formatMoney(price)} />
        <Metric icon={FiClipboard} label={t('ordersCount')} value={ordersCount} />
        <Metric icon={Clock} label={t('deliveryTime')} value={`${delivery}d`} />
      </div>

    </div>
  );
}



function JobCard({ job }) {
  const t = useTranslations('Profile.public');
  const initials = getInitials(job?.title || 'Job');
  const budget = job?.budget ? parseFloat(job.budget) : null;
  const delivery = job?.preferredDeliveryDays ?? '—';
  const buyer = job?.buyer?.username || t('unknown');
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
            title={job?.title || t('untitledJob')}
          >
            {job?.title || t('untitledJob')}
          </Link>
          {job?.buyer?.username && (
            <div className="mt-0.5 text-xs text-slate-500 truncate">{t('postedBy')} {job.buyer.username}</div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <Metric icon={DollarSign} label={t('budget')} value={budgetLabel} />
        <Metric icon={Clock} label={t('deliveryTime')} value={`${delivery}d`} />
        <Metric
          icon={Receipt}
          label={t('type')}
          value={job?.budgetType === 'hourly' ? t('hourly') : t('fixed')}
        />

      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap line-clamp-4">
        {job?.description}
      </p>
    </div>
  );
}

const RatingStars = ({ score }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-3.5 h-3.5 ${s <= Math.round(score) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
      />
    ))}
  </div>
);

function ReviewItem({ review, profileId }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('Profile.public');

  if (!profileId) return;
  // If the profileId matches the sellerId, the profile owner is the seller.
  // This means we show the BUYER'S review of them.
  const isProfileOwnerSeller = review.seller.id === profileId;

  const reviewer = isProfileOwnerSeller ? review.buyer : review.seller;
  const score = isProfileOwnerSeller ? review.buyer_total_score : review.seller_total_score;
  const text = isProfileOwnerSeller ? review.buyer_review_text : review.seller_review_text;
  const ratedAt = isProfileOwnerSeller ? review.buyer_rated_at : review.seller_rated_at;


  const hasText = !!text && text.trim().length > 0;
  const shouldTruncate = text?.length > 200;
  const displayText = isExpanded ? text : `${text?.substring(0, 200)}...`;

  return (
    <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-indigo-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Reviewer Image */}
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50">
            <Img
              src={reviewer?.profileImage}
              fallback='/public/no-user.png'
              alt={reviewer?.username}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Reviewer Name & Date */}
          <div className="min-w-0">
            <Link
              href={`/profile/${reviewer?.id}`}
              className="block font-bold text-slate-900 hover:text-indigo-600 truncate transition-colors"
            >
              {reviewer?.username}
            </Link>
            <div className="text-[10px] font-medium text-slate-400">
              {ratedAt ? new Date(ratedAt).toLocaleDateString() : ''}
            </div>
          </div>
        </div>

        {/* Total Score */}
        <div className="flex flex-col items-end gap-1">
          <RatingStars score={score} />
          <span className="text-xs font-bold text-slate-700">{score?.toFixed(1)}</span>
        </div>
      </div>

      {/* Review Text */}
      <div className="mt-4 text-sm leading-relaxed">
        {hasText ? (
          <>
            <p className="whitespace-pre-wrap text-slate-600">
              {shouldTruncate ? displayText : text}
            </p>

            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
              >
                {isExpanded ? (
                  <>{t('showLess')} <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>{t('showMore')} <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </>
        ) : (
          /* Fallback message for empty text */
          <p className="text-slate-400 italic">
            {t('noTextFeedback')}
          </p>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className='rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2'>
      <div className='flex items-center gap-1.5 text-slate-600 text-xs'>
        <Icon className='h-3.5 w-3.5 text-main-500' />
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
        <Link href={actionHref} className='mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-main-500 to-main-400 text-white text-sm font-semibold shadow-lg transition-all duration-300 hover:brightness-110 active:scale-95'>
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
    // Use Saudi Riyal (SAR)
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(n);
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


