'use client';

import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/atoms/Button';
import FavoriteButton from '@/components/atoms/FavoriteButton';
import Img from '@/components/atoms/Img';
import PriceTag from '@/components/atoms/priceTag';
import { Clock, CheckCircle2, Zap, Star, CircleArrowOutUpRight } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';

export const Stars = ({ value = 0, size = 12, stroke = 'stroke-white', dim = 'stroke-slate-400' }) => {
  const full = Math.floor(Math.min(Math.max(value, 0), 5));
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: full }).map((_, i) => (
        <Star size={size} key={`full-${i}`} className={`${stroke} fill-emerald-500 !stroke-emerald-500`} />
      ))}
      {half === 1 && <Star size={size} key='half' className={`${stroke} !stroke-emerald-500`} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star size={size} key={`empty-${i}`} className={`${dim} !stroke-emerald-500`} />
      ))}
    </div>
  );
};


// Optional tiny helpers for skeleton bits
const Sk = ({ className = '' }) => <div className={`bg-slate-200/70    rounded ${className}`} />;
const SkLine = ({ w = 'w-full', h = 'h-3', className = '' }) => <Sk className={`${w} ${h}`} />;
const SkAvatar = () => <Sk className='h-8 w-8 rounded-full' />;
const SkStars = () => (
  <div className='flex items-center gap-1'>
    <Sk className='h-3 w-12 rounded' />
  </div>
);

export default memo(function AmazingServiceCard({
  isHoverScale = true,
  service,
  href,
  index = 0,
  loading = false, // <-- NEW
}) {
  const t = useTranslations('Explore');
  const cover = service?.cover || service?.gallery?.[0]?.url || service?.category?.image || '/icons/file.png';

  const sellerAvatar = service?.seller?.avatar || service?.seller?.profileImage || '/icons/file.png';

  const sellerName = service?.seller?.name || service?.seller?.username || 'Unknown Seller';
  const serviceTitle = service?.title || service?.name || 'Untitled service';
  const serviceBrief = service?.brief || service?.description || '';
  const minPrice = Array.isArray(service?.packages) && service.packages.length ? Math.min(...service.packages.map(p => Number(p.price || 0))) : null;

  const deliveryTime = (Array.isArray(service?.packages) && service.packages.length ? Math.min(...service.packages.map(p => Number(p.deliveryTime || 0) || Number.POSITIVE_INFINITY)) : null) || service?.metadata?.deliveryTime || null;

  const rating = typeof service?.rating === 'number' && Number.isFinite(service.rating) ? service.rating : 0;
  const ratingText = typeof service?.rating === 'number' ? service.rating.toFixed(1) : '—';
  const ratingCount = service?.ratingCount ?? service?.ordersCount ?? 0;
  const categoryName = service?.category?.name || '—';
  const to = href || `/services/${service?.category?.slug}/${service?.slug}`;

  const featureBullets = useMemo(() => {
    const feats = service?.packages?.[0]?.features ?? service?.packages?.find(p => Array.isArray(p.features) && p.features.length)?.features ?? [];
    const tags = Array.isArray(service?.searchTags) ? service.searchTags : [];
    const extras = [];
    if (deliveryTime) extras.push(`Delivery in ${deliveryTime} day(s)`);
    if (service?.fastDelivery) extras.push('Fast delivery available');
    if (service?.additionalRevision) extras.push('Extra revisions available');
    return [...feats, ...tags.map(t => `Tag: ${t}`), ...extras].slice(0, 5);
  }, [service, deliveryTime]);

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, delay: 0.05 * index, ease: 'easeOut' } },
    hover: { rotateX: 2, transition: { type: 'spring', stiffness: 220, damping: 18 } },
  };

  if (loading) {
    // ---------- SKELETON ----------
    return (
      <motion.article variants={cardVariants} initial='initial' animate='in' role='article' className='relative pb-[60px] h-full group service-card !rounded-[10px] !overflow-hidden bg-white text-black border border-slate-200 shadow-sm'>
        <div className='relative group animate-pulse'>
          <div className='relative w-full aspect-[16/10] overflow-hidden rounded-[20px_20px_0_0]'>
            <Sk className='absolute inset-0' />
            {/* Seller pill skeleton */}
            <div className='pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3'>
              <div className='flex items-center gap-3 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5 text-white'>
                <SkAvatar />
                <div className='min-w-0'>
                  <SkLine w='w-28' h='h-3.5' />
                  <div className='mt-1 flex items-center gap-2'>
                    <SkLine w='w-6' h='h-3' />
                    <SkStars />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Favorite / Level placeholders */}
          <div className='absolute top-3 right-3'>
            <Sk className='h-8 w-8 rounded-full' />
          </div>
          <div className='absolute top-3 left-3'>
            <Sk className='h-6 w-20 rounded-full' />
          </div>
        </div>

        {/* Body skeleton */}
        <div className='p-4 animate-pulse space-y-3'>
          <SkLine w='w-10/12' h='h-4' />
          <SkLine w='w-9/12' />
          <div className='flex items-center justify-between'>
            <SkLine w='w-24' />
            <SkLine w='w-20' />
          </div>
        </div>

        {/* CTA button skeleton */}
        <div className='absolute bottom-[10px] left-[10px] right-[10px]'>
          <Sk className='h-10 w-full rounded-[12px]' />
        </div>
      </motion.article>
    );
  }

  // ---------- REAL CARD ----------
  return (
    <motion.article className={`${isHoverScale ? 'hover:scale-[1.05]' : 'hover:scale-[1.01]'} relative pb-[60px] h-full group service-card !rounded-[10px] !overflow-hidden bg-white text-black border border-slate-200 shadow-sm transition-all duration-300 will-change-transform`} variants={cardVariants} initial='initial' animate='in' whileHover='hover' role='article'>
      {/* Cover */}
      <div className='relative group'>
        <div className='relative w-full aspect-[16/10] overflow-hidden rounded-[10px_10px_0_0]'>
          {/* Image + subtle zoom on group hover */}
          <Img src={cover} alt={serviceTitle} className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]' />
          <Img src={cover} alt='' aria-hidden='true' className='absolute inset-0 blur-[80px] scale-110 opacity-40 object-cover pointer-events-none' />

          {/* Seller pill */}
          <div className='pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3'>
            <div className='flex items-center gap-3 bg-black/45 backdrop-blur-sm rounded-full px-2.5 py-1.5 text-white'>
              <Img src={sellerAvatar} alt={sellerName} className='h-8 w-8 rounded-full object-cover border border-white/40' />
              <div className='min-w-0'>
                <div className='text-sm font-semibold truncate'>{sellerName}</div>
                {/* <div className='text-white flex items-center gap-1.5'>
                  <span className='text-xs font-semibold'>{ratingText}</span>
                  <Stars value={rating} ratingCount={ratingCount} size={16} stroke='stroke-white' dim='stroke-white/30' />
                </div> */}
              </div>
            </div>
          </div>

          {/* Hover overlay */}
          <div className='absolute inset-0 text-white p-4 flex flex-col justify-end backdrop-blur-xs bg-gradient-to-t from-black/70 via-black/30 to-transparent translate-y-full opacity-0 transition-all duration-400 ease-out group-hover:translate-y-0 group-hover:opacity-100 overflow-hidden'>
            <ul className='space-y-2 max-h-[50%] overflow-hidden pr-1'>
              {(featureBullets?.length ? featureBullets.slice(0, 4) : ['No details provided']).map((b, i) => (
                <li key={i} className='flex items-start gap-2 text-sm leading-snug'>
                  <CheckCircle2 className='text-emerald-500 w-4 h-4 mt-0.5 flex-none' />
                  <span className='whitespace-nowrap truncate'>{b}</span>
                </li>
              ))}
            </ul>

            <div className='mt-3 flex items-center justify-between text-xs opacity-95'>
              <div className='flex items-center gap-2'>
                <Clock className='w-4 h-4' />
                {deliveryTime ? `${deliveryTime} day${deliveryTime > 1 ? 's' : ''}` : '—'}
              </div>
              <div className='flex items-center gap-2'>
                <Zap className='w-4 h-4' />
                {service?.fastDelivery ? 'Fast' : 'Standard'}
              </div>
            </div>
          </div>
        </div>

        {/* Favorite / seller level */}
        <FavoriteButton serviceId={service.id} className='absolute top-3 right-3 z-[2]' />
        <SellerLevelBadge level={service?.seller?.sellerLevel} />
      </div>

      {/* Body */}
      <div className='p-4 space-y-3'>
        <Link href={to} className='block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'>
          <h3 className='text-[17px] font-semibold line-clamp-1  '>{serviceTitle}</h3>
        </Link>
        {serviceBrief ? <p className='text-[13px] text-slate-600 line-clamp-2'>{serviceBrief}</p> : null}

        <div className='flex items-center justify-between'>
          <div className='text-[14px] text-slate-700'>{categoryName}</div>
          <div className='text-[14px] font-semibold'>
            From <PriceTag price={minPrice ?? 0} />
          </div>
        </div>
      </div>

      <Button icon={<CircleArrowOutUpRight className='-mb-1' size={18} />} className='absolute bottom-[10px] !w-[calc(100%-20px)] mx-[10px]' name={t('discovery.showMore')} href={to} />
    </motion.article>
  );
});


const SellerLevelBadge = ({ level }) => {
  const levelConfig = {
    lvl1: { text: 'Level 1', color: 'bg-gray-200 text-gray-800' },
    lvl2: { text: 'Level 2', color: 'bg-blue-200 text-blue-800' },
    new: { text: 'New', color: 'bg-green-200 text-green-800' },
    top: { text: 'Top Rated', color: 'bg-yellow-300 text-yellow-900 font-semibold' },
  };

  const { text, color } = levelConfig[level] || { text: level, color: 'bg-slate-200 text-slate-700' };

  return <div className={` border border-white/20 backdrop-blur-sm absolute top-3 left-3 z-[10] px-3 py-1 rounded-lg text-xs shadow-md ${color}`}>{text}</div>;
};
