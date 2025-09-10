'use client';

import { useEffect, useState, use, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, FileText, Info, Trash2, Tag as TagIcon, CheckCircle2, Crown, AlertCircle, UploadCloud, Table2, LayoutGrid, ArrowLeft, ArrowRight, ChevronDown, MessageCircle, Zap, Repeat, Eye, MousePointer2, ShieldCheck, Gauge, Star, Clock, Box, Shield, ChevronRight, Globe, Calendar, MapPin, Award, ChevronLeft, Maximize2, X, GraduationCap, ExternalLink, Image as ImageIcon } from 'lucide-react';

import Breadcrumbs from '@/components/atoms/Breadcrumbs';
import Button from '@/components/atoms/Button';
import FavoriteButton from '@/components/atoms/FavoriteButton';
import PriceTag from '@/components/atoms/priceTag';
import Input from '@/components/atoms/Input';
import NotFound from '@/components/molecules/NotFound';
import ServiceSlider from '@/components/common/ServiceSlider';
import { apiService } from '@/services/GigServices';
import Img from '@/components/atoms/Img';
import FAQSection from '@/components/common/Faqs';
import api from '@/lib/axios';

/* ===================== HELPERS ===================== */
const buildOrderPayload = ({ serviceData, selectedPackage, requirementAnswers, notes }) => {
  const answers = (serviceData?.requirements || []).map(req => ({
    questionId: req.id,
    type: req.requirementType,
    answer: req.requirementType === 'file' ? requirementAnswers[req.id]?.name || requirementAnswers[req.id] || '' : requirementAnswers[req.id] ?? '',
  }));

  return {
    serviceId: serviceData.id,
    packageType: selectedPackage?.name || '',
    quantity: 1,
    notes: notes || '',
    requirementsAnswers: answers,
    // optional: include snapshot for analytics/traceability
    snapshot: {
      price: selectedPackage?.price ?? 0,
      deliveryTime: selectedPackage?.deliveryTime ?? 0,
      revisions: selectedPackage?.revisions ?? 0,
    },
  };
};

const getFirstInvalidRequirementId = (requirements = [], answers = {}) => {
  for (const r of requirements) {
    const raw = answers?.[r.id];
    const val = r.requirementType === 'file' ? (raw ? true : false) : String(raw ?? '').trim();
    if (r.isRequired && !val) return r.id;
  }
  return null;
};

const scrollToRequirement = id => {
  const el = document.getElementById(`requirement-${id}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

export default function ServiceDetailsPage({ params }) {
  const { category, service } = use(params);
  const [serviceData, setServiceData] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [requirementAnswers, setRequirementAnswers] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [notes, setNotes] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiService
      .getService(service)
      .then(res => {
        if (!mounted) return;
        setServiceData(res);
        const firstPkg = Array.isArray(res?.packages) && res.packages.length ? res.packages[0] : null;
        setSelectedPackage(firstPkg);
      })
      .catch(err => console.error('Error fetching service:', err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [service]);

  // keep errors reactive
  useEffect(() => {
    if (!serviceData?.requirements?.length) return;
    const errs = {};
    serviceData.requirements.forEach(r => {
      if (r.isRequired) {
        const raw = requirementAnswers?.[r.id];
        const filled = r.requirementType === 'file' ? !!raw : String(raw ?? '').trim().length > 0;
        if (!filled) errs[r.id] = 'This field is required';
      }
    });
    setValidationErrors(errs);
  }, [serviceData?.requirements, requirementAnswers]);

  const handleRequirementChange = (questionId, answer) => {
    setRequirementAnswers(prev => ({ ...prev, [questionId]: answer }));
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const tryOpenOrderOptions = () => {
    const firstInvalidId = getFirstInvalidRequirementId(serviceData?.requirements, requirementAnswers);
    if (firstInvalidId) {
      setIsSidebarOpen(false);
      scrollToRequirement(firstInvalidId);
      setValidationErrors(v => ({ ...v, [firstInvalidId]: 'This field is required' }));
      return;
    }
    setIsSidebarOpen(true);
  };

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const handleCompleteOrder = async () => {
    if (!serviceData || !selectedPackage) return;

    const firstInvalidId = getFirstInvalidRequirementId(serviceData?.requirements, requirementAnswers);
    if (firstInvalidId) {
      scrollToRequirement(firstInvalidId);
      setValidationErrors(v => ({ ...v, [firstInvalidId]: 'This field is required' }));
      return;
    }

    // Build payload (JSON for now). If you need to send files, switch to FormData here.
    const orderData = buildOrderPayload({
      serviceData,
      selectedPackage,
      requirementAnswers,
      notes,
    });

    try {
      setLoadingSubmit(true);
      await api.post('/orders', { ...orderData });
      router.push('/orders');
    } catch (e) {
      console.error('Error creating order:', e);
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loading) return <SkeletonPage />;
  if (!serviceData) return <NotFound />;

  return (
    <div className='min-h-screen'>
      <div className='container'>
        {/* Breadcrumbs */}
        <div className='mb-6 max-md:hidden '>
          <Breadcrumbs items={[{ label: 'Services', href: '/services' }, { label: serviceData.category?.name || category, href: `/services/${category}` }, { label: serviceData.title }]} />
        </div>

        <div className='flex flex-col lg:flex-row gap-4 max-md:mt-8 '>
          {/* Main */}
          <div className='w-full lg:w-[calc(100%-400px)]'>
            <HeaderPanel serviceData={serviceData}   />
            <Features />
            <MediaGallery images={serviceData.gallery} />
            <AboutService serviceData={serviceData} />

            {!!serviceData.packages?.length && <PackagesSection packages={serviceData.packages} selectedPackage={selectedPackage} setSelectedPackage={setSelectedPackage} />}

            {!!serviceData.requirements?.length && <RequirementsSection requirements={serviceData.requirements} answers={requirementAnswers} onChange={handleRequirementChange} validationErrors={validationErrors}    />}

            <AboutSeller serviceData={serviceData}   />

            {!!serviceData.faq?.length && (
              <div className='bg-white rounded-2xl  border border-slate-200  shadow-inner md:p-6 py-6 mb-6'>
                <FAQSection className='!my-0' faqs={serviceData.faq} showTitle={true} />
              </div>
            )}

            <div className='bg-white rounded-2xl  border border-slate-200  shadow-inner p-6'>
              <ServiceSlider services={serviceData.relatedServices} title='Related Services' />
            </div>
          </div>

          {/* Sidebar */}
          <PurchaseSidebar selectedPackage={selectedPackage} setIsSidebarOpen={setIsSidebarOpen} handleContactSeller={() => router.push(`/chat?userId=${serviceData?.seller?.id}`)} serviceData={serviceData} onTryOpenOrderOptions={tryOpenOrderOptions} />
        </div>
      </div>

      {selectedPackage && (
        <div className='lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50'>
          <div className='container mx-auto flex items-center justify-between'>
            <div>
              <PriceTag price={selectedPackage.price} className='text-lg font-bold' />
              <p className='text-xs text-gray-500'>{selectedPackage.name} Package</p>
            </div>
            <div className='flex gap-2'>
              <Button name='Contact' variant='outline' className='text-sm' onClick={() => router.push(`/chat?userId=${serviceData?.seller?.id}`)} icon={<MessageCircle size={14} className='mr-1' />} />
              {/* NEW: block opening when invalid */}
              <Button name='Continue' className='text-sm' onClick={tryOpenOrderOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <OrderOptions loadingSubmit={loadingSubmit} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} serviceData={serviceData} selectedPackage={selectedPackage} onComplete={handleCompleteOrder} notes={notes} setNotes={setNotes} />
    </div>
  );
}

export const Divider = ({ className }) => {
  return <div className={`w-full h-[2px] border-b border-b-slate-200 my-[30px] ${className}`}></div>;
};

function HeaderPanel({ serviceData }) {
  function countryFlag(code) {
    if (!code) return '🏳️';
    try {
      const cc = code.trim().slice(0, 2).toUpperCase();
      return cc.replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
    } catch {
      return '🏳️';
    }
  }

  const chips = [
    serviceData?.seller?.sellerLevel && {
      icon: <Award className='h-3.5 w-3.5' />,
      text: serviceData.seller.sellerLevel.toUpperCase(),
      classes: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    serviceData.fastDelivery && {
      icon: <Zap className='h-3.5 w-3.5' />,
      text: 'Fast delivery',
      classes: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    serviceData.additionalRevision && {
      icon: <Repeat className='h-3.5 w-3.5' />,
      text: 'Extra revisions',
      classes: 'border-slate-200 bg-slate-50 text-slate-700',
    },
  ].filter(Boolean);

  return (
    <div className='relative rounded-2xl border border-slate-200 bg-white p-5 shadow-inner hover:shadow-md focus-within:shadow-md'>
      {/* animated gradient ring */}
      <div className='pointer-events-none absolute -inset-px rounded-2xl [background:conic-gradient(from_180deg,theme(colors.emerald.200/.35),transparent_30%,theme(colors.sky.200/.35),transparent_70%,theme(colors.emerald.200/.35))] [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-[1px]' />

      {/* subtle top halo */}
      <div className='pointer-events-none absolute inset-x-6 -top-10 h-16 rounded-full bg-gradient-to-r from-emerald-200/40 via-transparent to-emerald-200/40 blur-2xl' />

      <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-5'>
        <div className='min-w-0'>
          {/* title + chips */}
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-2xl md:text-3xl font-bold tracking-tight text-slate-900'>{serviceData.title}</h1>
            {chips.map((c, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.classes}`}>
                {c.icon}
                {c.text}
              </span>
            ))}
          </div>

          {/* meta row */}
          <div className='mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600'>
            <div className='inline-flex items-center'>
              <Star className='mr-1 h-4 w-4 text-amber-500 fill-current' />
              <span className='font-medium'>{serviceData.rating ?? 0}</span>
              <span className='ml-1'>({serviceData.reviews?.length ?? 0})</span>
            </div>

            <span className='h-4 w-px bg-slate-200' />

            <span className='inline-flex items-center gap-1'>
              <ShieldCheck className='h-4 w-4' />
              {serviceData.ordersCount ?? 0} orders completed
            </span>

            {!!serviceData.performanceScore && (
              <>
                <span className='h-4 w-px bg-slate-200' />
                <span className='inline-flex items-center gap-1'>
                  <Gauge className='h-4 w-4' />
                  Score: <span className='font-medium'>{Number(serviceData.performanceScore).toFixed(2)}</span>
                </span>
              </>
            )}

            {serviceData?.seller?.country && (
              <>
                <span className='h-4 w-px bg-slate-200' />
                <span className='inline-flex items-center gap-1'>
                  <span aria-hidden className='text-base'>
                    {countryFlag(serviceData.seller.country)}
                  </span>
                  From {serviceData.seller.country}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* seller strip (glass) */}
      <div className='mt-6 grid grid-cols-[auto,1fr] items-center gap-4 rounded-xl border border-slate-200 bg-white/60 p-4 backdrop-blur-sm'>
        <div className='relative'>
          <img src={serviceData.seller?.profileImage || '/images/placeholder-avatar.png'} alt={serviceData.seller?.username || 'Seller'} className='h-16 w-16 rounded-xl object-cover ring-2 ring-white shadow-inner' />
        </div>

        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='font-semibold text-slate-900'>{serviceData.seller?.username || 'Unknown Seller'}</h3>
            {!!serviceData?.seller?.skills?.length && (
              <span className='truncate text-xs text-slate-500'>
                {serviceData.seller.skills.slice(0, 3).join(' • ')}
                {serviceData.seller.skills.length > 3 ? ` +${serviceData.seller.skills.length - 3}` : ''}
              </span>
            )}
          </div>

          <p className='mt-1 line-clamp-1 text-sm text-slate-600'>{serviceData.seller?.description || serviceData.brief}</p>

          {/* quick stats */}
          <div className='mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600'>
            <Chip icon={<Eye className='h-3.5 w-3.5' />} label={`Impressions: ${serviceData.impressions ?? 0}`} />
            <Chip icon={<MousePointer2 className='h-3.5 w-3.5' />} label={`Clicks: ${serviceData.clicks ?? 0}`} />
            {Array.isArray(serviceData.searchTags) && serviceData.searchTags.length > 0 && (
              <span className='hidden sm:inline rounded-md bg-white px-2 py-1 shadow-inner'>
                Tags: {serviceData.searchTags.slice(0, 2).join(', ')}
                {serviceData.searchTags.length > 2 ? ` +${serviceData.searchTags.length - 2}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Features({ className = '' }) {
  const features = [
    {
      title: 'Top Rated',
      desc: 'Consistently delivers high-quality service meeting our strict standards.',
      Icon: (
        <svg className='stroke-blue-600' width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
          {' '}
          <path d='M26.5999 16.2202L29.2399 21.5002C29.5999 22.2202 30.5599 22.9402 31.3599 23.0602L36.1399 23.8602C39.1999 24.3802 39.9199 26.5802 37.7199 28.7802L33.9999 32.5002C33.3799 33.1202 33.0199 34.3402 33.2199 35.2202L34.28 39.8402C35.12 43.4802 33.18 44.9002 29.96 43.0002L25.4799 40.3402C24.6599 39.8602 23.34 39.8602 22.52 40.3402L18.0399 43.0002C14.8199 44.9002 12.8799 43.4802 13.7199 39.8402L14.78 35.2202C14.98 34.3602 14.6199 33.1402 13.9999 32.5002L10.28 28.7802C8.07996 26.5802 8.79992 24.3602 11.8599 23.8602L16.6399 23.0602C17.4399 22.9202 18.3999 22.2202 18.7599 21.5002L21.4 16.2202C22.82 13.3602 25.1799 13.3602 26.5999 16.2202Z' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' /> <path d='M12 18V4' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' /> <path d='M36 18V4' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' /> <path d='M24 8V4' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />{' '}
        </svg>
      ),
      accent: 'from-blue-50 to-indigo-50',
      border: 'border-blue-100/80',
      iconWrap: 'bg-blue-100 text-blue-700',
      glow: 'from-blue-300/30 via-blue-200/0 to-indigo-300/30',
    },
    {
      title: 'Verified Quality',
      desc: 'Individually selected after meeting benchmarks for excellence and trust.',
      Icon: (
        <svg width='48' className='stroke-emerald-600' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
          {' '}
          <path d='M8.52344 22.0399V31.9799C8.52344 35.6199 8.52344 35.6199 11.9634 37.9399L21.4234 43.3999C22.8434 44.2199 25.1634 44.2199 26.5834 43.3999L36.0434 37.9399C39.4834 35.6199 39.4834 35.6199 39.4834 31.9799V22.0399C39.4834 18.3999 39.4834 18.3999 36.0434 16.0799L26.5834 10.6199C25.1634 9.79988 22.8434 9.79988 21.4234 10.6199L11.9634 16.0799C8.52344 18.3999 8.52344 18.3999 8.52344 22.0399Z' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' /> <path d='M35 15.26V10C35 6 33 4 29 4H19C15 4 13 6 13 10V15.12' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' /> <path d='M25.2635 21.9799L26.4035 23.7599C26.5835 24.0399 26.9835 24.3199 27.2835 24.3999L29.3235 24.9199C30.5835 25.2399 30.9235 26.3199 30.1035 27.3199L28.7635 28.9399C28.5635 29.1999 28.4035 29.6599 28.4235 29.9799L28.5435 32.0799C28.6235 33.3799 27.7035 34.0399 26.5035 33.5599L24.5435 32.7799C24.2435 32.6599 23.7435 32.6599 23.4435 32.7799L21.4835 33.5599C20.2835 34.0399 19.3635 33.3599 19.4435 32.0799L19.5635 29.9799C19.5835 29.6599 19.4235 29.1799 19.2235 28.9399L17.8835 27.3199C17.0635 26.3199 17.4035 25.2399 18.6635 24.9199L20.7035 24.3999C21.0235 24.3199 21.4235 24.0199 21.5835 23.7599L22.7235 21.9799C23.4435 20.8999 24.5635 20.8999 25.2635 21.9799Z' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />{' '}
        </svg>
      ),
      accent: 'from-emerald-50 to-green-50',
      border: 'border-emerald-100/80',
      iconWrap: 'bg-emerald-100 text-emerald-700',
      glow: 'from-emerald-300/30 via-emerald-200/0 to-green-300/30',
    },
  ];

  return (
    <div className={`relative my-8 ${className}`}>
      {/* subtle page halo */}
      <div className='pointer-events-none absolute inset-x-0 -top-8 h-24 bg-gradient-to-r from-emerald-200/20 via-sky-200/0 to-violet-200/20 blur-2xl' />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' }} whileHover={{ y: -2 }} className={`group relative rounded-2xl p-5 bg-gradient-to-r ${f.accent} border ${f.border} shadow-inner hover:shadow-md focus-within:shadow-md`} tabIndex={0}>
            <div className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r ${f.glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />

            <div className='flex items-start gap-3'>
              <div className={`shrink-0 p-2 rounded-xl ${f.iconWrap} ring-1 ring-white/60 dark:ring-white/10`} aria-hidden>
                {f.Icon}
              </div>

              <div className='min-w-0'>
                <h3 className='text-base font-semibold tracking-tight text-slate-900  '>{f.title}</h3>
                <p className='mt-1 text-sm text-slate-600/90 '>{f.desc}</p>
              </div>
            </div>

            {/* focus outline for a11y */}
            <span className='absolute inset-0 rounded-2xl ring-2 ring-transparent focus-visible:ring-slate-400/50 transition' />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MediaGallery({ images = [], initialIndex = 0 }) {
  const safeImages = useMemo(() => (Array.isArray(images) && images.length ? images : [{ url: '/images/placeholder.png', alt: 'No image' }]), [images]);

  const [active, setActive] = useState(Math.min(initialIndex, safeImages.length - 1));
  const [loaded, setLoaded] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const stripRef = useRef(null);
  const thumbRefs = useRef([]);

  useEffect(() => {
    setLoaded(false);
    const el = thumbRefs.current[active];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active]);

  const prev = () => setActive(i => (i - 1 + safeImages.length) % safeImages.length);
  const next = () => setActive(i => (i + 1) % safeImages.length);

  const onKeyDown = e => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Enter' || e.key === ' ') setLightbox(true);
  };

  return (
    <div className='relative rounded-2xl border border-slate-200 bg-white shadow-inner overflow-hidden'>
      <div className='relative group outline-none' tabIndex={0} role='region' aria-label='Service gallery' onKeyDown={onKeyDown}>
        <div className='relative w-full aspect-[16/9] bg-slate-100'>
          {!loaded && <div className='absolute inset-0 animate-pulse bg-slate-100' />}

          <AnimatePresence mode='wait'>
            <motion.img key={safeImages[active]?.url} src={safeImages[active]?.url} alt={`Image ${active + 1}`} onLoad={() => setLoaded(true)} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${loaded ? 'opacity-100' : 'opacity-0'}`} initial={{ opacity: 0, scale: 1.01 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.2, scale: 1.005 }} />
          </AnimatePresence>

          {/* edge fades */}
          <div className='pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-white/70 to-transparent' />
          <div className='pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white/70 to-transparent' />

          {/* controls */}
          {safeImages.length > 1 && (
            <>
              <button type='button' aria-label='Previous image' onClick={prev} className='absolute flex-none left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-2.5 py-2 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500'>
                <ChevronLeft className='h-[25px] w-[21px] cursor-pointer flex-none ' />
              </button>
              <button type='button' aria-label='Next image' onClick={next} className='absolute flex-none right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-2.5 py-2 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500'>
                <ChevronRight className='h-[25px] w-[21px] cursor-pointer flex-none ' />
              </button>
            </>
          )}

          {/* index pill + open lightbox */}
          <div className='absolute bottom-3 left-3 flex items-center gap-2'>
            <span className='rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow'>
              {active + 1} / {safeImages.length}
            </span>
            <button type='button' onClick={() => setLightbox(true)} className='inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white'>
              <Maximize2 className='h-3.5 w-3.5' />
              View
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnails strip */}
      <div className='relative p-3'>
        {/* edge masks */}
        <div className='pointer-events-none absolute inset-y-0 left-0  w-8 bg-gradient-to-r from-white to-transparent' />
        <div className='pointer-events-none absolute inset-y-0 right-0  w-8 bg-gradient-to-l from-white to-transparent' />

        <div ref={stripRef} className='flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1' role='tablist' aria-label='Select image'>
          {safeImages.map((img, i) => {
            const activeState = i === active;
            return (
              <button
                key={i}
                ref={el => (thumbRefs.current[i] = el)}
                role='tab'
                aria-selected={activeState}
                aria-label={`Show image ${i + 1}`}
                onClick={() => setActive(i)}
                className={`relative h-20 w-28 flex-shrink-0 snap-start overflow-hidden rounded-lg border transition 
                 ${activeState ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <img src={img.url} alt={img.alt || `Thumbnail ${i + 1}`} className='h-full w-full object-cover' loading='lazy' decoding='async' />
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className='fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button aria-label='Close' onClick={() => setLightbox(false)} className=' z-[10] absolute right-4 top-4 rounded-full bg-white/90 p-2 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500'>
              <X className='h-5 w-5' />
            </button>

            {/* lightbox content */}
            <div className='absolute inset-0 flex items-center justify-center p-4'>
              <div className='relative max-h-[90vh] max-w-[92vw]'>
                <motion.img key={`lb-${safeImages[active]?.url}`} src={safeImages[active]?.url} alt={`Image ${active + 1}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className='max-h-[90vh] max-w-[92vw] rounded-xl object-contain shadow-2xl' />
                {safeImages.length > 1 && (
                  <>
                    <button onClick={prev} className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white' aria-label='Previous image'>
                      <ChevronLeft className='h-5 w-5' />
                    </button>
                    <button onClick={next} className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white' aria-label='Next image'>
                      <ChevronRight className='h-5 w-5' />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AboutService({ serviceData, onTagClick }) {
  const [expanded, setExpanded] = useState(false);

  const tags = useMemo(() => {
    const arr = Array.isArray(serviceData?.searchTags) ? serviceData.searchTags : [];
    const map = new Map();
    arr.forEach(t => {
      const key = String(t).trim();
      const lk = key.toLowerCase();
      const val = map.get(lk);
      if (val) map.set(lk, { label: val.label, count: val.count + 1 });
      else map.set(lk, { label: key, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [serviceData?.searchTags]);

  const brief = String(serviceData?.brief || '');

  return (
    <section aria-labelledby='about-title' className=' my-8 bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden mb-6'>
      {/* header */}
      <div className='flex items-center justify-between px-6 pt-6'>
        <div className='flex items-center gap-2'>
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700'>
            <Info className='h-4 w-4' />
          </span>
          <h2 id='about-title' className='text-xl font-semibold text-slate-900'>
            About this Service
          </h2>
        </div>
      </div>

      {/* brief with collapse */}
      <div className='px-6 pb-4'>
        <div className={`relative mt-4 text-slate-700 leading-7 ${expanded ? '' : 'max-h-32 overflow-hidden pr-1'}`}>
          <p className='whitespace-pre-line'>{brief}</p>
          {!expanded && brief.length > 180 && <div className='pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent' />}
        </div>

        {brief.length > 180 && (
          <button onClick={() => setExpanded(v => !v)} className='mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800' aria-expanded={expanded} aria-controls='about-content'>
            {expanded ? 'Show less' : 'Read more'}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden='true' />
          </button>
        )}
      </div>

      {/* tags */}
      {tags.length > 0 && (
        <div className='px-6 pb-6 pt-4 border-t border-slate-100'>
          <div className='mb-2 flex items-center gap-2'>
            <TagIcon className='h-4 w-4 text-slate-500' />
            <h3 className='text-sm font-medium text-slate-900'>Tags</h3>
            <span className='text-xs text-slate-500'>({tags.length})</span>
          </div>

          <AnimatePresence initial={false}>
            <motion.div layout className='flex flex-wrap gap-2' transition={{ layout: { duration: 0.2 } }}>
              {tags.slice(0, expanded ? tags.length : 10).map((t, i) => (
                <motion.button key={t.label + i} layout onClick={() => onTagClick?.(t.label)} className='group inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-100' title={t.count > 1 ? `${t.label} (${t.count})` : t.label}>
                  <span>#{t.label}</span>
                  {t.count > 1 && <span className='rounded-full bg-white/70 px-1.5 text-xs text-emerald-700 group-hover:bg-white'>×{t.count}</span>}
                </motion.button>
              ))}
              {!expanded && tags.length > 10 && (
                <button onClick={() => setExpanded(true)} className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50'>
                  +{tags.length - 10} more
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function scoreValue(p) {
  // simple value score = features / price
  const f = Array.isArray(p.features) ? p.features.length : 0;
  const price = Number(p.price || 1);
  return f / Math.max(price, 1);
}

function PackagesSection({ packages, selectedPackage, setSelectedPackage }) {
  const [view, setView] = useState('cards');
  const containerRef = useRef(null);

  const { list, recommendedIndex } = useMemo(() => {
    const list = packages || [];
    const stdIdx = list.findIndex(p => /standard/i.test(p?.name || ''));
    const rec = stdIdx !== -1 ? stdIdx : list.reduce((best, p, i) => (scoreValue(p) > scoreValue(list[best]) ? i : best), 0);
    return { list, recommendedIndex: Math.max(0, rec) };
  }, [packages]);

  // keep selected in sync if not set yet
  const selectedName = selectedPackage?.name ?? list[0]?.name;

  const onKeyDown = e => {
    if (!list.length) return;
    const idx = Math.max(
      0,
      list.findIndex(p => p.name === selectedName),
    );
    if (e.key === 'ArrowRight') {
      setSelectedPackage(list[(idx + 1) % list.length]);
    }
    if (e.key === 'ArrowLeft') {
      setSelectedPackage(list[(idx - 1 + list.length) % list.length]);
    }
  };

  return (
    <section className='bg-white rounded-2xl shadow-inner border border-slate-200 p-6 mb-6' aria-labelledby='packages-title'>
      <div className='mb-6 flex items-center justify-between gap-3'>
        <h2 id='packages-title' className='text-xl font-semibold text-slate-900'>
          Packages
        </h2>
        <div className='flex items-center gap-2'>
          <button type='button' onClick={() => setView('cards')} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${view === 'cards' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`} aria-pressed={view === 'cards'}>
            <LayoutGrid className='h-4 w-4' /> Cards
          </button>
          <button type='button' onClick={() => setView('compare')} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${view === 'compare' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`} aria-pressed={view === 'compare'}>
            <Table2 className='h-4 w-4' /> Compare
          </button>
        </div>
      </div>

      <div ref={containerRef} tabIndex={0} onKeyDown={onKeyDown} className='outline-none' aria-label='Package selection (use left/right arrows to switch)'>
        <AnimatePresence mode='wait'>
          {view === 'cards' ? (
            <motion.div key='cards' initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className=' relative grid h-full  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              {list.map((pkg, index) => {
                const active = selectedName === pkg.name;
                const recommended = index === recommendedIndex;
                return (
                  <motion.div
                    type='button'
                    key={pkg.name + index}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedPackage(pkg)}
                    className={` h-full flex flex-col items-start relative text-left rounded-xl border p-5 transition shadow-inner
                      ${active ? 'border-emerald-300 card-glow' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <div className={`  mb-1 flex items-start justify-between gap-3 `}>
                      <h3 className='text-lg font-bold text-slate-900'>{pkg.name}</h3>
                      <PriceTag price={pkg.price} className='!text-lg' />
                    </div>

                    {recommended && (
                      <span className=' mb-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800'>
                        <Crown className='h-3.5 w-3.5' /> Recommended
                      </span>
                    )}

                    {pkg.description && <p className='mb-4 text-sm text-slate-600 line-clamp-2'>{pkg.description}</p>}

                    <div className='mb-4 flex items-center justify-between text-sm text-slate-700'>
                      <span className='inline-flex items-center gap-1'>
                        <Clock className='h-4 w-4' />
                        {pkg.deliveryTime} Day(s)
                      </span>
                      <span className='inline-flex items-center gap-1'>
                        <Box className='h-4 w-4' />
                        {pkg.revisions} Revisions
                      </span>
                    </div>

                    <ul className='mb-4 space-y-2 pb-[30px] '>
                      {(pkg.features || []).slice(0, 4).map((feature, i) => (
                        <li key={i} className='flex items-start text-sm'>
                          <CheckCircle2 className='mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600' />
                          <span className='text-slate-700'>{feature}</span>
                        </li>
                      ))}
                      {pkg.features?.length > 4 && <li className='pl-6 text-xs text-slate-500'>+ {pkg.features.length - 4} more</li>}
                    </ul>

                    <Button
                      name={active ? 'Selected' : 'Select Package'}
                      className={` absolute bottom-[10px] !w-[calc(100%-20px)] left-[10px] h-[40px] ${active ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-950'}`}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedPackage(pkg);
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key='compare' initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className='overflow-x-auto'>
              <div className='min-w-[720px]'>
                <div className='grid grid-cols-[200px_repeat(3,minmax(160px,1fr))] gap-2'>
                  {/* header row */}
                  <div></div>
                  {list.map((p, i) => {
                    const active = selectedName === p.name;
                    return (
                      <div
                        key={'h' + i}
                        className={`rounded-lg border px-4 py-3 text-center text-sm font-semibold
                        ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-900'}`}>
                        {p.name}
                      </div>
                    );
                  })}

                  {/* price */}
                  <div className='py-3 text-sm text-slate-600'>Price</div>
                  {list.map((p, i) => (
                    <div key={'price' + i} className='rounded-lg border border-slate-200 bg-white px-4 py-3 text-center'>
                      <PriceTag price={p.price} className='!text-base' />
                    </div>
                  ))}

                  {/* delivery */}
                  <div className='py-3 text-sm text-slate-600'>Delivery</div>
                  {list.map((p, i) => (
                    <div key={'del' + i} className='rounded-lg border border-slate-200 bg-white px-4 py-3 text-center'>
                      {p.deliveryTime} Day(s)
                    </div>
                  ))}

                  {/* revisions */}
                  <div className='py-3 text-sm text-slate-600'>Revisions</div>
                  {list.map((p, i) => (
                    <div key={'rev' + i} className='rounded-lg border border-slate-200 bg-white px-4 py-3 text-center'>
                      {p.revisions}
                    </div>
                  ))}

                  {/* features count */}
                  <div className='py-3 text-sm text-slate-600'>Features</div>
                  {list.map((p, i) => (
                    <div key={'fc' + i} className='rounded-lg border border-slate-200 bg-white px-4 py-3 text-center'>
                      {(p.features || []).length}
                    </div>
                  ))}

                  {/* CTA row */}
                  <div></div>
                  {list.map((p, i) => {
                    const active = selectedName === p.name;
                    return (
                      <div key={'cta' + i} className='px-2 py-3 text-center'>
                        <Button name={active ? 'Selected' : 'Select'} className={`w-full ${active ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-950'}`} onClick={() => setSelectedPackage(p)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function RequirementsSection({ requirements, answers, onChange, validationErrors = {}, onComplete }) {
  const [expanded, setExpanded] = useState({});
  const [triedSubmit, setTriedSubmit] = useState(false);

  const total = requirements.length;
  const answered = useMemo(
    () =>
      requirements.filter(r => {
        const raw = answers?.[r.id];
        return r.requirementType === 'file' ? !!raw : String(raw ?? '').trim() !== '';
      }).length,
    [requirements, answers],
  );

  const progress = total ? Math.round((answered / total) * 100) : 0;

  const firstInvalidId = useMemo(() => getFirstInvalidRequirementId(requirements, answers), [requirements, answers]);

  const handleSubmit = () => {
    setTriedSubmit(true);
    if (firstInvalidId) {
      scrollToRequirement(firstInvalidId);
      return;
    }
    onComplete();
  };

  return (
    <section className='relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner'>
      {/* header */}
      <div className='flex items-center justify-between gap-3 px-6 pt-6'>
        <div className='min-w-0'>
          <h2 className='text-xl font-semibold text-slate-900'>Requirements</h2>
          <p className='mt-1 text-sm text-slate-600'>Please provide the following information to help us tailor the service to your needs.</p>
        </div>
        {total > 0 && (
          <div className='shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800'>
            {answered}/{total} complete
          </div>
        )}
      </div>

      {/* progress */}
      <div className='mx-6 mt-4 h-2 rounded-full bg-slate-100'>
        <div className='h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600' style={{ width: `${progress}%` }} />
      </div>

      {/* list */}
      <div className='px-6 py-6'>
        <div className='space-y-6'>
          {requirements.map((req, idx) => {
            const val = answers?.[req.id];
            const missing = req.isRequired && (req.requirementType === 'file' ? !val : !String(val ?? '').trim());
            const showErr = (triedSubmit && missing) || !!validationErrors?.[req.id];
            const errMsg = validationErrors?.[req.id] || (triedSubmit && missing ? 'This field is required' : '');

            return (
              <motion.div key={req.id} id={`requirement-${req.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className=' '>
                <div className='flex items-start justify-between gap-4'>
                  <label className='block text-base font-semibold text-slate-900'>
                    {idx + 1}. {req.question}
                    {req.isRequired && <span className='ml-1 text-red-500'>*</span>}
                  </label>

                  {!req.isRequired && (
                    <button onClick={() => setExpanded(e => ({ ...e, [req.id]: !e[req.id] }))} className='inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900'>
                      {expanded[req.id] ? 'Hide' : 'Details'} <ChevronDown className={`h-3.5 w-3.5 transition ${expanded[req.id] ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {/* TEXT */}
                {req.requirementType === 'text' && <div className='mt-3'>{String(val ?? '').length > 80 ? <textarea rows={4} placeholder='Type your answer…' value={val || ''} onChange={e => onChange(req.id, e.target.value)} className={`w-full transition  `} /> : <Input type='text' placeholder='Your answer' value={val || ''} onChange={e => onChange(req.id, e.target.value)} required={req.isRequired} showMsgError={false} />}</div>}

                {/* MULTIPLE CHOICE */}
                {req.requirementType === 'multiple_choice' && Array.isArray(req.options) && <MultipleChoiceFancy req={req} value={val} onSelect={val => onChange(req.id, val)} />}

                {/* FILE */}
                {req.requirementType === 'file' && (
                  <div className='mt-3'>
                    <label
                      className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed bg-slate-50 p-6 transition hover:bg-slate-100
                      ${showErr ? 'border-red-300' : 'border-slate-300'}`}>
                      <div className='text-center'>
                        <UploadCloud className='mx-auto h-7 w-7 text-slate-500' />
                        <p className='mt-2 text-sm text-slate-700'>
                          <span className='font-medium'>Click to upload</span> or drag & drop
                        </p>
                        <p className='text-xs text-slate-500'>Any file type</p>
                      </div>
                      <input type='file' className='hidden' onChange={e => onChange(req.id, e.target.files?.[0] || null)} />
                    </label>

                    {!!val && (
                      <div className='mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700'>
                        <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                        Selected: <span className='font-medium'>{val?.name || String(val)}</span>
                      </div>
                    )}
                  </div>
                )}

                {showErr && (
                  <p className='mt-2 inline-flex items-center gap-1.5 text-sm text-red-600'>
                    <AlertCircle className='h-4 w-4' />
                    {errMsg}
                  </p>
                )}

                {!req.isRequired && expanded[req.id] && <p className='mt-3 text-sm text-slate-500'>Optional input—add any extra notes that help tailor your request.</p>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AboutSeller({ serviceData }) {
  const seller = serviceData?.seller || {};

  const languages = useMemo(() => {
    const arr = Array.isArray(seller.languages) ? seller.languages : [];
    const seen = new Set();
    return arr
      .map(l => String(l).trim())
      .filter(l => {
        const k = l.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return !!l;
      });
  }, [seller?.languages]);

  const skills = useMemo(() => {
    const arr = Array.isArray(seller.skills) ? seller.skills : [];
    const seen = new Set();
    return arr.filter(s => {
      const k = String(s).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return !!s;
    });
  }, [seller?.skills]);

  const certifications = Array.isArray(seller.certifications) ? seller.certifications : [];
  const education = Array.isArray(seller.education) ? seller.education : [];
  const portfolio = Array.isArray(seller.portfolioItems) ? seller.portfolioItems.slice(0, 3) : [];

  const verified = !!seller.sellerLevel || certifications.length > 0;
  const topRated = (serviceData?.rating ?? 0) >= 4.5;

  const [descOpen, setDescOpen] = useState(false);

  function countryFlag(code) {
    if (!code) return '🏳️';
    try {
      const cc = code.trim().slice(0, 2).toUpperCase();
      return cc.replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
    } catch {
      return '🏳️';
    }
  }
  function timeSince(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (months < 1) return 'Joined recently';
    if (months < 12) return `${months} mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem ? `${years} yr ${rem} mo` : `${years} yr`;
  }

  return (
    <section className='bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden mb-6'>
      {/* header */}
      <div className='p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-4 min-w-0'>
            <Img src={seller?.profileImage || '/images/placeholder-avatar.png'} alt={seller?.username || 'Seller'} className='h-16 w-16 rounded-xl object-cover ring-2 ring-white shadow' />
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='text-xl font-semibold text-slate-900'>About the Seller</h2>
                {verified && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800'>
                    <ShieldCheck className='h-3.5 w-3.5' /> Verified
                  </span>
                )}
                {seller?.sellerLevel && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800'>
                    <Award className='h-3.5 w-3.5' /> {String(seller.sellerLevel).toUpperCase()}
                  </span>
                )}
                {topRated && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800'>
                    <Star className='h-3.5 w-3.5' /> Top Rated
                  </span>
                )}
              </div>
              <p className='mt-1 text-sm text-slate-600'>{seller?.username} is a verified professional with expertise in this field.</p>
            </div>
          </div>
        </div>

        {/* quick stats */}
        <div className='mt-4 flex flex-wrap items-center gap-2 text-xs'>
          <StatPill icon={<Star className='h-3.5 w-3.5 text-amber-600' />} label='Rating' value={(serviceData?.rating ?? 0).toFixed(1)} />
          <StatPill icon={<Gauge className='h-3.5 w-3.5' />} label='Performance' value={(serviceData?.performanceScore ?? 0).toFixed(2)} />
          <StatPill icon={<Calendar className='h-3.5 w-3.5' />} label='Orders' value={String(serviceData?.ordersCount ?? 0)} />
        </div>
      </div>

      {/* info grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-6 border-y border-slate-100'>
        <InfoRow
          icon={<MapPin className='h-5 w-5 text-slate-400' />}
          title='From'
          value={
            <span className='inline-flex items-start gap-1'>
              <span aria-hidden className='text-base'>
                {countryFlag(seller?.country)}
              </span>
              {seller?.country || 'Not specified'}
            </span>
          }
        />
        <InfoRow icon={<Calendar className='h-5 w-5 text-slate-400' />} title='Member Since' value={seller?.memberSince ? `${new Date(seller.memberSince).toLocaleDateString()} • ${timeSince(seller.memberSince)}` : 'Not specified'} />
        <InfoRow
          icon={<Globe className='h-5 w-5 text-slate-400' />}
          title={`Languages${languages.length ? ` (${languages.length})` : ''}`}
          value={
            languages.length ? (
              <div className='flex flex-wrap  mt-1 gap-1.5'>
                {languages.map((l, i) => (
                  <span key={i} className='rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs'>
                    {l}
                  </span>
                ))}
              </div>
            ) : (
              'Not specified'
            )
          }
        />
      </div>

      {/* description */}
      {(seller?.description || serviceData?.brief) && (
        <div className='px-6 pt-4'>
          <div className={`relative text-slate-700 leading-7 ${descOpen ? '' : 'max-h-24 overflow-hidden pr-1'}`}>
            <p className='whitespace-pre-line'>{seller?.description || serviceData?.brief}</p>
            {!descOpen && (seller?.description || serviceData?.brief || '').length > 160 && <div className='pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent' />}
          </div>
          {(seller?.description || serviceData?.brief || '').length > 160 && (
            <button onClick={() => setDescOpen(v => !v)} className='mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800'>
              {descOpen ? 'Show less' : 'Read more'}
              <ChevronDown className={`h-4 w-4 transition ${descOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* extras: skills / certification / education / portfolio */}
      <div className='px-6 pb-6 pt-4 space-y-6'>
        {!!skills.length && (
          <div>
            <div className='mb-1 text-sm font-medium text-slate-900'>Key Skills</div>
            <div className='flex flex-wrap gap-1.5'>
              {skills.slice(0, 6).map((s, i) => (
                <span key={i} className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800'>
                  {s}
                </span>
              ))}
              {skills.length > 6 && <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600'>+{skills.length - 6} more</span>}
            </div>
          </div>
        )}

        {!!certifications.length && (
          <div>
            <div className='mb-1 flex items-center gap-2 text-sm font-medium text-slate-900'>
              <ShieldCheck className='h-4 w-4 text-emerald-600' /> Certifications
            </div>
            <ul className='space-y-1 text-sm text-slate-700'>
              {certifications.slice(0, 3).map((c, i) => (
                <li key={i}>
                  {c.name} — <span className='text-slate-600'>{c.issuingOrganization}</span> ({c.year})
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!education.length && (
          <div>
            <div className='mb-1 flex items-center gap-2 text-sm font-medium text-slate-900'>
              <GraduationCap className='h-4 w-4 text-sky-600' /> Education
            </div>
            <ul className='space-y-1 text-sm text-slate-700'>
              {education.slice(0, 2).map((e, i) => (
                <li key={i}>
                  {e.degree} — <span className='text-slate-600'>{e.institution}</span> ({e.year})
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!portfolio.length && (
          <div>
            <div className='mb-2 flex items-center gap-2 text-sm font-medium text-slate-900'>
              <ImageIcon className='h-4 w-4' /> Portfolio
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              {portfolio.map((p, i) => (
                <a key={i} href={p.url} target='_blank' rel='noopener noreferrer' className='group relative block overflow-hidden rounded-lg border border-slate-200 bg-slate-50' title={p.title}>
                  <img src={p.image} alt={p.title || 'Portfolio'} className='h-28 w-full object-cover transition group-hover:scale-[1.02]' />
                  <div className='absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition'>
                    <span className='line-clamp-1'>{p.title}</span>
                    <ExternalLink className='h-3.5 w-3.5' />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PurchaseSidebar({ selectedPackage, handleContactSeller, serviceData, onTryOpenOrderOptions }) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const features = Array.isArray(selectedPackage?.features) ? selectedPackage.features : [];
  const featuresPreview = features.slice(0, showAllFeatures ? features.length : 3);
  const hasMore = features.length > featuresPreview.length;

  const valueMeta = useMemo(() => {
    const count = features.length || 1;
    const price = Number(selectedPackage?.price || 0);
    return { perFeature: count ? (price / count).toFixed(2) : '0.00', count };
  }, [features, selectedPackage?.price]);

  return (
    <div className='w-full lg:w-full'>
      <aside className='sticky top-28'>
        <div className='relative rounded-2xl border border-slate-200 bg-white p-6 shadow-inner'>
          <div className='pointer-events-none absolute -inset-px rounded-2xl p-[1px] card-glow ' />

          {selectedPackage ? (
            <>
              <div className='mb-4 flex items-start justify-between'>
                <h3 className='text-lg font-semibold text-slate-900'>{selectedPackage.name}</h3>
                <FavoriteButton service={serviceData} packageType={selectedPackage.name} />
              </div>

              <div className='mb-3 flex items-center justify-between'>
                <span className='text-slate-600'>Price</span>
                <PriceTag price={selectedPackage.price} className='!text-xl font-bold' />
              </div>

              <div className='mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500'>
                <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5'>{valueMeta.count} features</span>
                <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5'>~ {valueMeta.perFeature} / feature</span>
                {serviceData?.fastDelivery && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800'>
                    <Zap className='h-3.5 w-3.5' /> Fast delivery
                  </span>
                )}
                {serviceData?.additionalRevision && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5'>
                    <Repeat className='h-3.5 w-3.5' /> Extra revisions
                  </span>
                )}
              </div>

              {selectedPackage.description && <p className='mb-5 text-sm leading-6 text-slate-600'>{selectedPackage.description}</p>}

              <div className='mb-5 space-y-2 text-sm text-slate-700'>
                <div className='flex items-center'>
                  <Clock className='mr-2 h-4 w-4 text-slate-400' /> <span>{selectedPackage.deliveryTime} Day Delivery</span>
                </div>
                <div className='flex items-center'>
                  <Box className='mr-2 h-4 w-4 text-slate-400' /> <span>{selectedPackage.revisions} Revisions</span>
                </div>
              </div>

              <ul className='mb-4 space-y-2'>
                {featuresPreview.map((f, i) => (
                  <li key={i} className='flex items-start text-sm'>
                    <CheckCircle2 className='mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600' />
                    <span className='text-slate-700'>{f}</span>
                  </li>
                ))}
                {hasMore && (
                  <button onClick={() => setShowAllFeatures(true)} className='pl-6 text-left text-xs font-medium text-emerald-700 hover:text-emerald-800'>
                    + {features.length - featuresPreview.length} more
                  </button>
                )}
              </ul>

              <div className='flex items-center gap-2'>
                {/* NEW: gate opening */}
                <Button name='Continue' className='flex-1' onClick={onTryOpenOrderOptions} />
                <button type='button' onClick={handleContactSeller} aria-label='Chat with seller' className='inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-inner hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500'>
                  <MessageCircle size={18} />
                </button>
              </div>

              <div className='mt-4 flex items-center justify-center text-xs text-slate-500'>
                <Shield className='mr-1 h-4 w-4' />
                Secure checkout • Buyer protection
              </div>
            </>
          ) : (
            <div className='py-8 text-center text-slate-500'>Select a package to continue</div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* tiny atoms */
function InfoRow({ icon, title, value }) {
  return (
    <div className=''>
      <div className='flex items-center gap-1'>
        <div className='mt-0.5'>{icon}</div>
        <p className='text-sm font-medium text-slate-500'>{title}</p>
      </div>
      <div className='text-slate-900'>{value}</div>
    </div>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <span className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-inner text-slate-700'>
      {icon}
      <span className='font-medium'>{value}</span>
      <span className='text-slate-500'>· {label}</span>
    </span>
  );
}

/* === tiny helper === */
function Chip({ icon, label }) {
  return (
    <span className='inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 shadow-inner'>
      {icon}
      {label}
    </span>
  );
}

function SkeletonLine({ className = '' }) {
  return <div className={`!h-3 shimmer rounded bg-slate-200/80 ${className}`} />;
}

function SkeletonPage() {
  return (
    <div className='container  !px-4 !py-8  '>
      {/* crumbs */}
      <div className='mb-6'>
        <SkeletonLine className='w-1/3 h-4 mb-2' />
        <SkeletonLine className='w-1/4' />
      </div>

      <div className='flex flex-col lg:flex-row gap-8'>
        <div className='w-full lg:w-2/3 space-y-6'>
          {/* Header */}
          <div>
            <SkeletonLine className='w-2/3 h-7 mb-4' />
            <SkeletonLine className='w-1/2 mb-6' />
            <div className='flex items-center gap-4 pt-6 border-t border-gray-100'>
              <div className='w-16 h-16 bg-slate-200 rounded-xl' />
              <div>
                <SkeletonLine className='w-32 h-4 mb-2' />
                <SkeletonLine className='w-48' />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {[1, 2].map(i => (
              <div key={i}>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-9 h-9 bg-slate-200 rounded-lg' />
                  <SkeletonLine className='w-24' />
                </div>
                <SkeletonLine className='w-full' />
              </div>
            ))}
          </div>

          {/* Gallery */}
          <div className='rounded-2xl shadow-inner overflow-hidden border border-slate-100 bg-white'>
            <div className='h-72 bg-slate-200' />
            <div className='p-4 flex gap-2'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='w-20 h-20 bg-slate-200 rounded-lg' />
              ))}
            </div>
          </div>

          {/* About */}
          <div>
            <SkeletonLine className='w-1/4 h-5 mb-4' />
            <SkeletonLine className='w-full mb-2' />
            <SkeletonLine className='w-3/4 mb-2' />
            <SkeletonLine className='w-2/3' />
          </div>

          {/* Packages */}
          <div>
            <SkeletonLine className='w-1/4 h-5 mb-6' />
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
              {[1, 2, 3].map(i => (
                <div key={i} className='bg-slate-50 rounded-xl p-5 border border-slate-100'>
                  <SkeletonLine className='w-1/3 h-4 mb-4' />
                  <SkeletonLine className='w-1/2 mb-4' />
                  <SkeletonLine className='w-full mb-3' />
                  <SkeletonLine className='w-3/4 mb-2' />
                  <SkeletonLine className='w-1/2 mb-4' />
                  <div className='h-10 bg-slate-200 rounded' />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className='w-full h-[200px] lg:w-1/3'>
          <div>
            <SkeletonLine className=' !h-8 w-1/3  mb-4' />
            <SkeletonLine className=' !h-8 w-1/2 mb-4' />
            <SkeletonLine className=' !h-8 w-full mb-6' />
            <SkeletonLine className=' !h-8 w-3/4 mb-2' />
            <SkeletonLine className=' !h-8 w-1/2 mb-6' />
            <div className='h-10 bg-slate-200 rounded mb-3' />
            <div className='h-10 bg-slate-200 rounded' />
          </div>
        </div>
      </div>
    </div>
  );
}

function MultipleChoiceFancy({ req, value, onSelect }) {
  const { options = [], isRequired } = req || {};
  const containerRef = useRef(null);

  // normalize: allow strings or objects {label, value, hint, icon}
  const normalized = useMemo(() => {
    return options.map((opt, i) => {
      if (typeof opt === 'string') return { label: opt, value: opt, hint: '', icon: null, _k: i };
      const label = opt.label ?? opt.value ?? `Option ${i + 1}`;
      const val = opt.value ?? opt.label ?? label;
      return { label, value: val, hint: opt.hint || '', icon: opt.icon || null, _k: i };
    });
  }, [options]);

  // keyboard nav (←/→/↑/↓, 1..9, enter/space)
  const currentIndex = Math.max(
    0,
    normalized.findIndex(o => o.value === value),
  );
  const focusMove = dir => {
    const next = (currentIndex + dir + normalized.length) % normalized.length;
    onSelect(normalized[next].value);
  };

  const onKeyDown = e => {
    if (!normalized.length) return;
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      focusMove(+1);
    }
    if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      focusMove(-1);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(value || normalized[0].value);
    }
    if (/^[1-9]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < normalized.length) {
        e.preventDefault();
        onSelect(normalized[idx].value);
      }
    }
  };

  // is "Other" selected?
  const isOther = typeof value === 'string' && value.toLowerCase() === 'other';
  const [otherText, setOtherText] = useState('');
  useEffect(() => {
    if (!isOther) setOtherText('');
  }, [isOther]);

  return (
    <div className='mt-3'>
      <div ref={containerRef} role='radiogroup' aria-required={isRequired ? 'true' : 'false'} aria-label={req?.question || 'Multiple choice'} tabIndex={0} onKeyDown={onKeyDown} className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 outline-none'>
        {normalized.map((opt, i) => {
          const active = value === opt.value;
          return (
            <motion.button
              key={opt._k}
              type='button'
              role='radio'
              aria-checked={active}
              onClick={() => onSelect(opt.value)}
              whileHover={{ y: 0 }}
              whileTap={{ scale: 0.98 }}
              className={`group cursor-pointer relative text-left rounded-xl border px-3.5 py-3 transition
                ${active ? 'border-emerald-500 bg-gradient-to-b from-emerald-50 to-white ring-2 ring-emerald-100 shadow-inner' : 'border-slate-300 hover:border-slate-400 bg-white'}`}>
              {/* decorative halo */}
              <div className='  pointer-events-none absolute -inset-px rounded-xl opacity-0 transition group-hover:opacity-100 bg-gradient-to-r from-emerald-200/20 via-transparent to-sky-200/20' />

              <div className='flex items-start gap-3'>
                {/* bullet / check */}
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border transition
                  ${active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                  <svg viewBox='0 0 20 20' className='h-3.5 w-3.5 fill-current'>
                    <path d='M7.629 13.233 4.4 10.004l1.2-1.2 2.029 2.029 6.771-6.771 1.2 1.2z' />
                  </svg>
                </span>

                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span className='ml-auto text-[10px] text-slate-400'>[{i + 1}]</span>

                    <span className={`text-sm font-medium ${active ? 'text-emerald-800' : 'text-slate-800'}`}>{opt.label}</span>
                  </div>

                  {opt.hint && <p className={`mt-1 text-xs leading-5 ${active ? 'text-emerald-700' : 'text-slate-600'}`}>{opt.hint}</p>}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Inline "Other" text field if chosen */}
      {isOther && (
        <div className='mt-3'>
          <label className='mb-1 block text-sm font-medium text-slate-900'>Please specify</label>
          <input type='text' value={otherText} onChange={e => setOtherText(e.target.value)} placeholder='Type here…' className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100' />
          <div className='mt-1 text-[11px] text-slate-500'>We’ll include this with your selection.</div>
        </div>
      )}
    </div>
  );
}

function OrderOptions({ notes, loadingSubmit, setNotes, isSidebarOpen, onComplete, setIsSidebarOpen, serviceData, selectedPackage }) {
  const drawerRef = useRef(null);
  const firstFocusRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (isSidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      firstFocusRef.current?.focus();
      const onKey = e => {
        if (e.key === 'Escape') setIsSidebarOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [isSidebarOpen, setIsSidebarOpen]);

  const summaryItems = useMemo(
    () => [
      {
        icon: <FileText className='h-4 w-4' />,
        label: `${selectedPackage?.name ?? ''} Package`,
      },
      {
        icon: <Timer className='h-4 w-4' />,
        label: `${selectedPackage?.deliveryTime ?? '-'} Day Delivery`,
      },
      {
        icon: <Repeat className='h-4 w-4' />,
        label: `${selectedPackage?.revisions ?? '-'} Revisions`,
      },
    ],
    [selectedPackage],
  );

  return (
    <div className='relative z-[90]'>
      {/* Overlay */}
      {isSidebarOpen && <div className='fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm transition-opacity' onClick={toggleSidebar} aria-hidden='true' />}

      {/* Drawer */}
      <aside ref={drawerRef} role='dialog' aria-modal='true' aria-labelledby='order-options-title' className={`overflow-y-auto !h-screen fixed right-0 top-0 z-[100] w-[360px] sm:w-[420px] bg-white border-l shadow-2xl transition-transform duration-300 ease-out will-change-transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className='pointer-events-none absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-200/50 via-transparent to-emerald-200/50' />

        {/* Header */}
        <div className='overflow-y-auto h-[calc(100dvh-140px)]'>
          <div className='sticky top-0 z-10 bg-white px-6 pt-6 pb-4'>
            <div className='flex items-start justify-between gap-3'>
              <h2 id='order-options-title' className='text-2xl font-bold text-slate-900'>
                Order Options
              </h2>
              <button ref={firstFocusRef} onClick={toggleSidebar} aria-label='Close order options' className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50'>
                <X className='h-5 w-5' />
              </button>
            </div>
            <Divider className='my-4' />
            <div className='mb-2'>
              <div className='flex items-center justify-between gap-2'>
                <h3 className='text-lg font-semibold text-slate-900 line-clamp-1'>{serviceData?.title}</h3>
                <PriceTag price={selectedPackage?.price ?? 0} className='!text-lg font-bold' />
              </div>
              {selectedPackage?.description && <p className='mt-1 text-sm text-slate-600 line-clamp-2'>{selectedPackage.description}</p>}
            </div>
          </div>

          {/* Content */}
          <div className='px-6 pt-2 space-y-6 '>
            <div>
              <label className='mb-2 flex items-center gap-2 text-sm font-medium text-slate-900'>
                <FileText className='h-4 w-4 text-slate-500' />
                Special instructions (optional)
              </label>
              <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder='Anything the seller should know…' className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100' />
              <div className='mt-1 text-right text-xs text-slate-500'>{notes.length} chars</div>
            </div>

            {/* Summary card */}
            <div className='rounded-xl border border-emerald-200 bg-emerald-50/50 p-4'>
              <div className='text-slate-800'>
                <PriceTag price={selectedPackage?.price ?? 0} />
                <div className='mt-4 space-y-2 text-slate-700'>
                  {summaryItems.map((it, i) => (
                    <div key={i} className='flex items-center gap-2'>
                      <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200'>{it.icon}</span>
                      <span className='text-sm font-medium'>{it.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className='mt-4 text-sm text-slate-600'>You can always modify these options later in your order management.</div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className='absolute bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur'>
          <div className='mb-3 flex items-center justify-between'>
            <span className='text-sm text-slate-600'>Total</span>
            <PriceTag price={selectedPackage?.price ?? 0} className='!text-xl font-bold' />
          </div>

          <Button name='Continue to Requirements' loading={loadingSubmit} className='w-full' onClick={onComplete} iconRight={<ChevronRight className='ml-1 h-4 w-4' />} />
        </div>
      </aside>
    </div>
  );
}
