'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/atoms/Button';
import FavoriteButton from '@/components/atoms/FavoriteButton';
import Img from '@/components/atoms/Img';
import PriceTag from '@/components/atoms/priceTag';
import { Clock, CheckCircle2, Zap, Star, CircleArrowOutUpRight } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import TopRatedBadge from '@/components/atoms/TopRatedBadge';

export const Stars = ({
  value = 0,
  size = 12,
  stroke = 'stroke-white',
  dim = 'stroke-slate-400 dark:stroke-dark-text-secondary',
}) => {
  const full = Math.floor(Math.min(Math.max(value, 0), 5));
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className='flex items-center gap-0.5'>
      {Array.from({ length: full }).map((_, i) => (
        <Star
          size={size}
          key={`full-${i}`}
          className={`${stroke} fill-main-500 !stroke-main-500`}
        />
      ))}

      {half === 1 && (
        <Star
          size={size}
          key='half'
          className={`${stroke} !stroke-main-500`}
        />
      )}

      {Array.from({ length: empty }).map((_, i) => (
        <Star
          size={size}
          key={`empty-${i}`}
          className={`${dim} !stroke-main-500`}
        />
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
  const pathname = usePathname()
  const t = useTranslations('Explore');
  const locale = useLocale();
  const cover = service?.cover || service?.gallery?.[0]?.url || service?.category?.image || '/icons/file.png';

  const sellerAvatar = service?.seller?.avatar || service?.seller?.profileImage || '/icons/file.png';

  const sellerName = service?.seller?.name || service?.seller?.username || 'Unknown Seller';
  const serviceTitle = service?.title || service?.name || 'Untitled service';
  const serviceBrief = service?.brief || service?.description || '';
  const minPrice = Array.isArray(service?.packages) && service.packages.length ? Math.min(...service.packages.map(p => Number(p.price || 0))) : null;

  const deliveryTime = (Array.isArray(service?.packages) && service.packages.length ? Math.min(...service.packages.map(p => Number(p.deliveryTime || 0) || Number.POSITIVE_INFINITY)) : null) || service?.metadata?.deliveryTime || null;

  const rating = service?.rating && Number.isFinite(service.rating) ? service.rating : 0;
  const ratingText = service?.rating ? service.rating.toFixed(1) : '—';
  const ratingCount = service?.ratingCount ?? service?.ordersCount ?? 0;
  const categoryName = locale === 'ar' ? service?.category?.name_ar : service?.category?.name_en;
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
      <motion.article
        variants={cardVariants}
        initial='initial'
        animate='in'
        role='article'
        className='relative pb-[60px] h-full group service-card !rounded-[10px] !overflow-hidden bg-white dark:bg-dark-bg-card text-black dark:text-white border border-slate-200 dark:border-dark-border shadow-sm transition-colors duration-200'
      >
        <div className='relative group animate-pulse'>
          {/* Image Area Skeleton */}
          <div className='relative w-full aspect-[16/10] overflow-hidden rounded-[20px_20px_0_0] bg-slate-100 dark:bg-dark-bg-input'>
            <Sk className='absolute inset-0' />

            {/* Seller pill skeleton */}
            <div className='pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3'>
              <div className='flex items-center gap-3 bg-black/30 dark:bg-black/50 backdrop-blur-sm rounded-full px-2 md:px-2.5 py-1.5 text-white'>
                <SkAvatar className="dark:bg-dark-border" />
                <div className='min-w-0'>
                  <SkLine w='w-28' h='h-3.5' className="dark:bg-dark-border" />
                  <div className='mt-1 flex items-center gap-2'>
                    <SkLine w='w-6' h='h-3' className="dark:bg-dark-border" />
                    <SkStars className="dark:opacity-30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Favorite / Level placeholders */}
          <div className='absolute top-3 right-3'>
            <Sk className='h-8 w-8 rounded-full dark:bg-dark-bg-input/80' />
          </div>
          <div className='absolute top-3 left-3'>
            <Sk className='h-6 w-20 rounded-full dark:bg-dark-bg-input/80' />
          </div>
        </div>

        {/* Body skeleton */}
        <div className='p-4 animate-pulse space-y-3'>
          <SkLine w='w-10/12' h='h-4' className="dark:bg-dark-bg-input" />
          <SkLine w='w-9/12' className="dark:bg-dark-bg-input" />
          <div className='flex items-center justify-between pt-1'>
            <SkLine w='w-24' className="dark:bg-dark-bg-input" />
            <SkLine w='w-20' className="dark:bg-dark-bg-input" />
          </div>
        </div>

        {/* CTA button skeleton */}
        <div className='absolute bottom-[10px] left-[10px] right-[10px]'>
          <Sk className='h-10 w-full rounded-[12px] dark:bg-dark-bg-input' />
        </div>
      </motion.article>
    );
  }

  // ---------- REAL CARD ----------
  return (
    <div className='relative'>
      <motion.article
        variants={cardVariants}
        initial='initial'
        animate='in'
        whileHover='hover'
        role='article'
        className={`${isHoverScale ? 'hover:scale-[1.05]' : 'hover:scale-[1.01]'
          } relative h-full group service-card !rounded-[10px] !overflow-hidden bg-white dark:bg-dark-bg-card text-black dark:text-dark-text-primary border border-slate-200 dark:border-dark-border shadow-sm transition-all duration-300 will-change-transform`}
      >
        <Link href={to}>
          {/* Cover Section */}
          <div className='relative group'>
            <div className='relative w-full aspect-[16/10] overflow-hidden rounded-[10px_10px_0_0] bg-slate-100 dark:bg-dark-bg-input'>
              <Img
                src={cover}
                alt={serviceTitle}
                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]'
              />
              {/* Ambient blur effect - keeping opacity low for dark mode */}
              <Img src={cover} alt='' aria-hidden='true' className='absolute inset-0 blur-[80px] scale-110 opacity-30 dark:opacity-20 object-cover pointer-events-none' />

              {/* Seller Info Pill */}
              <div className='pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3'>
                <div className='relative flex items-center gap-3 bg-black/45 dark:bg-black/60 backdrop-blur-md rounded-full px-1.5 md:px-2.5 py-1.5 text-white'>
                  <div className='relative'>
                    <Img
                      src={sellerAvatar}
                      alt={sellerName}
                      className='w-8 h-8 md:h-10 md:w-10 rounded-full object-cover border border-white/20'
                    />
                    {service?.seller?.topRated && (
                      <div className='absolute -bottom-1 -start-1'>
                        <TopRatedBadge isTopRated={true} size='xs' />
                      </div>
                    )}
                  </div>
                  <div className='min-w-0'>
                    <div className='text-xs md:text-sm font-semibold truncate'>{sellerName}</div>
                    <div className='flex items-center gap-1.5'>
                      {ratingText && <span className='text-[10px] md:text-xs font-medium opacity-90'>{ratingText}</span>}
                      {rating ? <Stars value={rating} size={14} stroke='stroke-white' dim='stroke-white/30' /> : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover Features Overlay */}
              <div className='absolute inset-0 text-white p-4 flex flex-col justify-end backdrop-blur-sm bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full opacity-0 transition-all duration-400 ease-out group-hover:translate-y-0 group-hover:opacity-100 overflow-hidden'>
                <ul className='space-y-2 max-h-[50%] overflow-hidden'>
                  {(featureBullets?.length ? featureBullets.slice(0, 4) : ['No details provided']).map((b, i) => (
                    <li key={i} className='flex items-start gap-2 text-sm leading-snug'>
                      <CheckCircle2 className='text-main-400 w-4 h-4 mt-0.5 flex-none' />
                      <span className='whitespace-nowrap truncate'>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className='mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider opacity-90'>
                  <div className='flex items-center gap-1.5'>
                    <Clock className='w-3.5 h-3.5' />
                    {deliveryTime ? `${deliveryTime}d` : '—'}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Zap className='w-3.5 h-3.5' />
                    {service?.fastDelivery ? 'Fast' : 'Std'}
                  </div>
                </div>
              </div>
            </div>

            <SellerLevelBadge level={service?.seller?.sellerLevel} />
          </div>

          {/* Content Body */}
          <div className='p-4 space-y-2.5'>
            <h3 className='text-[16px] font-bold line-clamp-1 group-hover:text-main-600 dark:group-hover:text-main-400 transition-colors'>
              {serviceTitle}
            </h3>

            {serviceBrief && (
              <p className='text-[13px] text-slate-500 dark:text-dark-text-secondary line-clamp-2 leading-relaxed'>
                {serviceBrief}
              </p>
            )}

            <div className='flex items-center justify-between pt-1'>
              <div className='text-[12px] font-medium text-slate-400 dark:text-dark-text-secondary/60 uppercase tracking-wide'>
                {categoryName || 'General'}
              </div>
              <div className='text-[14px] font-bold'>
                <span className="text-[11px] font-normal text-slate-400 mr-1">{t('from')}</span>
                <PriceTag price={minPrice ?? 0} className="text-main-600 dark:text-main-400" />
              </div>
            </div>
          </div>
        </Link>

        <FavoriteButton serviceId={service.id} className='absolute top-3 right-3 z-[2]' redirect={pathname} />
      </motion.article>
    </div>
  );
});


const SellerLevelBadge = ({ level }) => {
  const levelConfig = {
    lvl1: { text: 'Level 1', color: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100' },
    lvl2: { text: 'Level 2', color: 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100' },
    new: { text: 'New', color: 'bg-main-200 text-main-800 dark:bg-main-700 dark:text-white' },
    top: { text: 'Top Rated', color: 'bg-yellow-300 text-yellow-900 dark:bg-yellow-500 dark:text-black font-semibold' },
  };

  const { text, color } =
    levelConfig[level] || {
      text: level,
      color: 'bg-slate-200 text-slate-700 dark:bg-dark-bg-input dark:text-dark-text-primary',
    };

  return (
    <div
      className={`border border-white/20 backdrop-blur-sm 
                  absolute top-3 left-3 z-[10] 
                  px-3 py-1 rounded-lg text-xs shadow-md 
                  ${color}`}
    >
      {text}
    </div>
  );
};;
