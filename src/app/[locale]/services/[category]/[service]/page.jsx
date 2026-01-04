'use client';

import { useEffect, useState, use, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, FileText, Info, Tag as TagIcon, CheckCircle2, Crown, AlertCircle, UploadCloud, Table2, LayoutGrid, ChevronDown, MessageCircle, Zap, Repeat, Eye, MousePointer2, ShieldCheck, Gauge, Star, Clock, Box, Shield, ChevronRight, Globe, Calendar, MapPin, Award, ChevronLeft, Maximize2, X, GraduationCap, ExternalLink, Image as ImageIcon, Clock3, Globe2, BadgeCheck, FolderTree, Layers, Images, PlayCircle, Beaker } from 'lucide-react';
import Button from '@/components/atoms/Button';
import PriceTag from '@/components/atoms/priceTag';
import Input from '@/components/atoms/Input';
import NotFound from '@/components/molecules/NotFound';
import ServiceSlider from '@/components/common/ServiceSlider';
import { apiService } from '@/services/GigServices';
import Img from '@/components/atoms/Img';
import FAQSection from '@/components/common/Faqs';
import api, { baseImg } from '@/lib/axios';
import { getInitials } from '@/components/molecules/Header';
import { Link } from '@/i18n/navigation';
import ReactPlayer from 'react-player';
import AttachmentList from '@/components/common/AttachmentList';
import { useAuth } from '@/context/AuthContext';
import AttachFilesButton from '@/components/atoms/AttachFilesButton';
import Textarea from '@/components/atoms/Textarea';
import FavoriteButton from '@/components/atoms/FavoriteButton';
import { useLocale, useTranslations } from 'next-intl'; // Add this import
import { resolveUrl } from '@/utils/helper';
import toast from 'react-hot-toast';
import CountryFlag from '@/components/common/CountryFlag';

/* ===================== HELPERS ===================== */
const buildOrderPayload = ({ serviceData, selectedPackage, requirementAnswers, notes }) => {

  const answers = (serviceData?.requirements || []).map(req => {
    const baseAnswer =
      req.requirementType === 'file'
        ? requirementAnswers[req.id]?.url || ''
        : req.requirementType === 'multiple_choice'
          ? requirementAnswers[req.id]?.option
          : requirementAnswers[req.id] ?? '';

    const obj = {
      question: req.question,
      requirementType: req.requirementType,
      answer: baseAnswer,
    };

    // ✅ Only add otherAnswer if it exists
    if (
      req.requirementType === 'multiple_choice' &&
      requirementAnswers[req.id]?.option?.toLowerCase() === 'other' &&
      requirementAnswers[req.id]?.otherText
    ) {
      obj.otherAnswer = requirementAnswers[req.id].otherText;
    }

    // Add filename if it file
    if (
      req.requirementType === 'file' &&
      requirementAnswers[req.id]?.filename
    ) {
      obj.filename = requirementAnswers[req.id]?.filename;
    }

    return obj;
  });

  return {
    serviceId: serviceData.id,
    packageType: selectedPackage?.type || '',
    quantity: 1,
    notes: notes || '',
    requirementsAnswers: answers,
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
  const t = useTranslations('ServiceDetails'); // Add this
  const { service } = use(params);
  const { user, role } = useAuth()
  const [serviceData, setServiceData] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [requirementAnswers, setRequirementAnswers] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const canOrder = user?.id != serviceData?.seller?.id && role === 'buyer' && serviceData?.status === 'Active';
  console.log(user?.id, serviceData?.seller?.id, role, serviceData?.status)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const router = useRouter();

  // ✅ Separate useEffect to increase click count
  useEffect(() => {

    const increaseClick = async () => {
      if (!serviceData?.id) return;
      try {

        await apiService.increaseServiceClick({
          serviceId: serviceData?.id,
        });
      } catch (err) {
        console.error("Error increasing service click:", err);
      }
    };

    increaseClick();
  }, [serviceData?.id]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);

        const res = await apiService.getService(service);

        setServiceData(res);

        const firstPkg =
          Array.isArray(res?.packages) && res.packages.length
            ? res.packages[0]
            : null;
        setSelectedPackage(firstPkg);
      } catch (err) {
        console.error('Error fetching service:', err);
      } finally {
        setLoading(false); // fixed typo: etLoading → setLoading
      }
    };

    if (service) {
      fetchService();
    }
  }, [service]);


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

  const [triedSubmit, setTriedSubmit] = useState(false);

  const tryOpenOrderOptions = () => {
    if (!canOrder) return;
    if (!user) {
      router.push('/auth?tab=login');
      return;
    }
    const firstInvalidId = getFirstInvalidRequirementId(serviceData?.requirements, requirementAnswers);

    setTriedSubmit(true)
    if (firstInvalidId) {
      setIsSidebarOpen(false);
      scrollToRequirement(firstInvalidId);
      setValidationErrors(v => ({ ...v, [firstInvalidId]: 'This field is required' }));
      return;
    }
    setIsSidebarOpen(true);
  };

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const handleCompleteOrder = async (notes) => {
    if (!user) {
      router.push('/auth?tab=login');
      return;
    }
    if (!serviceData || !selectedPackage || !canOrder) return;

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
      const res = await api.post('/orders/checkout', { ...orderData });
      router.push(res.data.paymentUrl + `?orderId:${res.data.order.id}`);
    } catch (err) {
      console.error('Error creating order:', err);
      toast.error(err.response?.data?.message)
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loading) return <SkeletonPage />;
  if (!serviceData) return <NotFound />;



  return (
    <div className='min-h-screen'>
      <div className='container'>
        <div className=' flex flex-col lg:flex-row gap-6  mt-8 '>
          {/* Main */}
          <div className='w-full lg:w-[calc(100%-400px)]'>
            <HeaderPanel serviceData={serviceData} />

            <MediaGallery images={serviceData.gallery} />
            <VedioPlayer gallery={serviceData.gallery} />
            <DocumentViewer gallery={serviceData.gallery} />
            <AboutService serviceData={serviceData} />

            {!!serviceData.packages?.length && <PackagesSection packages={serviceData.packages} selectedPackage={selectedPackage} setSelectedPackage={setSelectedPackage} />}

            {!!serviceData.requirements?.length && <RequirementsSection triedSubmit={triedSubmit} requirements={serviceData.requirements} answers={requirementAnswers} onChange={handleRequirementChange} validationErrors={validationErrors} />}

            <AboutSeller serviceData={serviceData} />

            {!!serviceData.faq?.length && (
              <div className='bg-white rounded-xl  border border-slate-200  shadow-custom  md:py-12 py-6 '>
                <FAQSection className='!my-0' faqs={serviceData.faq} showTitle={true} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <PurchaseSidebar canOrder={canOrder} selectedPackage={selectedPackage} setIsSidebarOpen={setIsSidebarOpen} serviceData={serviceData} onTryOpenOrderOptions={tryOpenOrderOptions} />
        </div>

        <div className=' mt-8 bg-white rounded-xl  border border-slate-200  shadow-custom  p-6'>
          <ServiceSlider services={serviceData.relatedServices} className={"!mt-4"} title='Related Services' />
        </div>
      </div>

      {selectedPackage && (
        <div className='lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50'>
          <div className='container mx-auto flex flex-col sm:flex-row gap-2 items-center justify-between'>
            <div>
              <PriceTag price={selectedPackage.price} className='text-lg font-bold' />
              <p className='text-xs text-gray-500'>{selectedPackage.name} Package</p>
            </div>
            <div className='flex gap-2'>
              <Link href={`/chat?userId=${serviceData?.seller?.id}`} className='text-sm' onClick={() => router.push(`/chat?userId=${serviceData?.seller?.id}`)} icon={<MessageCircle size={14} className='mr-1' />} />
              <Button name='Continue' className='text-sm' onClick={tryOpenOrderOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <OrderOptions loadingSubmit={loadingSubmit} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} serviceData={serviceData} selectedPackage={selectedPackage} onComplete={handleCompleteOrder} />
    </div>
  );
}

export const Divider = ({ className = '' }) => <div className={`my-8 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent ${className}`} />;

const Separator = () => <span aria-hidden className='h-4 w-px bg-slate-200' />;

const Stat = ({ icon: Icon, value, label, title }) => (
  <div className='flex items-center gap-2' title={title || label}>
    <Icon className='h-4 w-4 text-slate-700' />
    <span className='font-semibold text-slate-900'>{value}</span>
    <span className='text-slate-500'>{label}</span>
  </div>
);

const countryFlag = code => {
  if (!code) return '🏳️';
  try {
    const cc = code.trim().slice(0, 2).toUpperCase();
    return cc.replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
  } catch {
    return '🏳️';
  }
};

function HeaderPanel({ serviceData = {}, Img }) {
  const t = useTranslations('ServiceDetails');

  const locale = useLocale()
  const isArabic = locale === 'ar'
  const { user } = useAuth()
  const seller = serviceData?.seller || {};
  const rating = Number(serviceData?.rating ?? 0);
  const ratingFmt = rating.toFixed(1);
  const reviewsCount = serviceData?.reviews?.length ?? 0;
  const ordersCount = serviceData?.ordersCount ?? 0;
  const serviceCountry = serviceData?.country ?? 0;
  const state = serviceData?.state ?? 0;
  const country = seller?.country;

  const serviceCountryName =
    locale === 'ar'
      ? serviceData?.country?.name_ar || serviceData?.country?.name || '—'
      : serviceData?.country?.name || '—';

  const serviceStateName =
    locale === 'ar'
      ? serviceData?.state?.name_ar || serviceData?.state?.name || '—'
      : serviceData?.state?.name || '—';

  const hasLocation =
    serviceCountryName !== '—' || serviceStateName !== '—';


  const chips = useMemo(
    () =>
      [
        serviceData?.seller?.sellerLevel && {
          icon: <Award className='h-3.5 w-3.5' />,
          text: String(serviceData.seller.sellerLevel).toUpperCase(),
          classes: 'border-amber-200 bg-amber-50 text-amber-800',
        },
        // serviceData?.fastDelivery && {
        //   icon: <Zap className='h-3.5 w-3.5' />,
        //   text: 'Fast delivery',
        //   classes: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        // },
        // serviceData?.additionalRevision && {
        //   icon: <Repeat className='h-3.5 w-3.5' />,
        //   text: 'Extra revisions',
        //   classes: 'border-slate-200 bg-slate-50 text-slate-700',
        // },
      ].filter(Boolean),
    [serviceData],
  );

  let features = []
  if (seller?.topRated) {
    features.push({
      title: t('features.topRated.title'),
      desc: t('features.topRated.desc'),
      Icon: (
        <svg className='stroke-blue-600' width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
          {' '}
          <path d='M26.5999 16.2202L29.2399 21.5002C29.5999 22.2202 30.5599 22.9402 31.3599 23.0602L36.1399 23.8602C39.1999 24.3802 39.9199 26.5802 37.7199 28.7802L33.9999 32.5002C33.3799 33.1202 33.0199 34.3402 33.2199 35.2202L34.28 39.8402C35.12 43.4802 33.18 44.9002 29.96 43.0002L25.4799 40.3402C24.6599 39.8602 23.34 39.8602 22.52 40.3402L18.0399 43.0002C14.8199 44.9002 12.8799 43.4802 13.7199 39.8402L14.78 35.2202C14.98 34.3602 14.6199 33.1402 13.9999 32.5002L10.28 28.7802C8.07996 26.5802 8.79992 24.3602 11.8599 23.8602L16.6399 23.0602C17.4399 22.9202 18.3999 22.2202 18.7599 21.5002L21.4 16.2202C22.82 13.3602 25.1799 13.3602 26.5999 16.2202Z' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' /> <path d='M12 18V4' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' /> <path d='M36 18V4' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' /> <path d='M24 8V4' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />{' '}
        </svg>
      ),
      accent: 'from-blue-50 to-indigo-50',
      border: 'border-blue-100/80',
      iconWrap: 'bg-blue-100 text-blue-700',
      glow: ' ',
    })
  }


  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }} className='relative mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-custom hover:shadow-md'>

      {/* ✅ Preview Tag */}
      {serviceData?.seller?.id === user?.id && serviceData?.status !== 'Active' && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-700 flex items-center gap-2">
          <Eye className="h-4 w-4 text-amber-600" />
          <span>{t('preview.message')}</span>
        </div>
      )}
      {/* Title + Chips */}
      <div className='relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='text-[22px] leading-tight md:text-3xl font-extrabold tracking-tight text-slate-900'>{serviceData?.title || 'Untitled Service'}</h1>
            {chips.map((c, i) => (
              <Chip key={i} icon={c.icon} label={c.text} className={c.classes} />
            ))}
          </div>

          {/* Meta */}
          <div className='mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700'>
            {!!rating && <span className='inline-flex items-center' aria-label={`Rating ${ratingFmt} out of 5`} title='Rating'>
              <Star className='mr-1 h-4 w-4 text-amber-500 fill-current' />
              <span className='font-semibold'>{ratingFmt}</span>
              <span className='ml-1 text-slate-500'>({reviewsCount})</span>
            </span>}

            <Separator />

            <Stat icon={ShieldCheck} value={ordersCount} label={t('ordersCompleted')} title={t('ordersCompleted')} />

            {hasLocation && (
              <>
                <Separator />
                <span
                  className="inline-flex items-center gap-2 text-slate-600"
                  title={`${serviceCountryName}${serviceStateName ? ` · ${serviceStateName}` : ''}`}
                >
                  {/* Flag */}
                  {serviceData?.country?.iso2 && (
                    <CountryFlag countryCode={serviceData.country.iso2} />
                  )}

                  {/* Location text */}
                  <span className="truncate max-w-[14rem]">
                    {serviceCountryName}
                    {serviceCountryName && serviceStateName ? ' · ' : ''}
                    {serviceStateName}
                  </span>
                </span>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Seller strip */}
      <div className='mt-6 grid grid-cols-[auto,1fr] items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 backdrop-blur'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <span className='absolute -inset-0.5 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-emerald-400 via-sky-400 to-violet-400 blur opacity-30' />
            <div className='relative size-12 overflow-hidden rounded-full border border-white shadow-sm ring-1 ring-slate-200 bg-white flex items-center justify-center'>{seller?.profileImage && Img ? <Img src={seller.profileImage} alt={`${seller?.username || 'Seller'} avatar`} className='h-full w-full object-cover' /> : <span className='text-sm font-semibold text-slate-600 select-none'>{getInitials(seller?.username)}</span>}</div>
          </div>

          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <Link href={`/profile/${seller?.id}`} className='font-semibold text-slate-900 leading-none'>
                {seller?.username || 'Unknown Seller'}
              </Link>
              {!!seller?.sellerLevel && (
                <span className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600'>
                  <BadgeCheck className='h-3 w-3 text-emerald-600' />
                  {String(seller.sellerLevel).toUpperCase()}
                </span>
              )}
            </div>

            <p className='mt-1 line-clamp-1 text-sm text-slate-600'>{seller?.description || serviceData?.brief || 'No description provided.'}</p>

            {!!seller?.skills?.length && (
              <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                {seller.skills.slice(0, 4).map(s => (
                  <span key={s} className='rounded-md bg-white px-2 py-0.5 text-[11px] text-slate-600 ring-1 ring-slate-200'>
                    {s}
                  </span>
                ))}
                {seller.skills.length > 4 ? <span className='text-[11px] text-slate-500'>+{seller.skills.length - 4} more</span> : null}
              </div>
            )}
          </div>
        </div>

        {/* Right mini-stats */}
        <div className='justify-self-end hidden md:flex items-center gap-4 text-sm'>
          <div className={`flex items-center gap-2  ${isArabic && "flex-row-reverse"}`}>
            <Clock3 className='h-4 w-4 text-slate-600' />
            <span className='text-slate-700'>Avg. response</span>
            <span className='font-semibold text-slate-900'>{serviceData?.seller?.responseTimeFormatted || '—'}</span>
          </div>
          <div className={`flex items-center gap-2  ${isArabic && "flex-row-reverse"}`}>
            <Globe2 className='h-4 w-4 text-slate-600' />
            <span className='text-slate-700'>Lang</span>
            <span className='font-semibold text-slate-900'>{Array.isArray(seller?.languages) && seller.languages.length ? seller.languages.slice(0, 2).join(', ') : '—'}</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className='mt-5 flex gap-4 '>
        {features.map(f => (
          <div key={f.title} className={`flex-1 group relative rounded-xl border ${f.border} bg-[#f9fbfd] p-5  transition-shadow hover:shadow-md`}>
            <div className='flex items-start gap-3'>
              <div className={`shrink-0 rounded-xl p-2 ring-1 ring-white/60 ${f.iconWrap}`}>{f.Icon}</div>
              <div className='min-w-0'>
                <h3 className='text-base font-semibold tracking-tight text-slate-900'>{f.title}</h3>
                <p className='mt-1 text-sm text-slate-600/90'>{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}


function DocumentViewer({ gallery }) {
  const t = useTranslations('ServiceDetails');
  // get all files that are not images or videos
  const documents = useMemo(() => {
    return Array.isArray(gallery)
      ? gallery.filter(gal => gal.type !== 'image' && gal.type !== 'video').map(gal => ({
        ...gal,
        filename: gal.fileName
      }))

      : [];
  }, [gallery]);

  if (!documents.length) return null;

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white shadow-custom overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <FileText className="h-4 w-4" />
          </span>
          <h2 id="documents-title" className="text-xl font-semibold text-slate-900">
            {t('documents.title')}
          </h2>
        </div>
      </div>

      {/* Document List */}
      <div className="p-4">
        <AttachmentList attachments={documents} />
      </div>
    </div>
  );
}

function VedioPlayer({ gallery }) {
  const t = useTranslations('ServiceDetails');
  // find first video in gallery 
  const vedio = useMemo(() => {
    return gallery?.find(gal => gal.type === 'video')
  }, [gallery]);

  if (!vedio) return null;

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white shadow-custom overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <PlayCircle className="h-4 w-4" />
          </span>
          <h2 id="video-title" className="text-xl font-semibold text-slate-900">
            {t('video.title')}
          </h2>
        </div>
      </div>

      {/* Video Player */}
      <div className="p-4 aspect-video relative">
        <ReactPlayer
          src={vedio?.url?.startsWith('http') ? vedio?.url : baseImg + vedio?.url}
          controls
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}

function MediaGallery({ images = [], initialIndex = 0 }) {
  const safeImages = useMemo(() => {
    if (Array.isArray(images) && images.length) {
      const onlyImages = images.filter(img => img.type === 'image')
      return onlyImages.length
        ? onlyImages
        : [{ url: '/images/placeholder.png', alt: 'No image' }];
    }
    return [{ url: '/images/placeholder.png', alt: 'No image' }];
  }, [images]);


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
    <div className='mb-8 relative p-4 rounded-xl border border-slate-200 bg-white shadow-custom  overflow-hidden'>
      <div className='relative group outline-none' tabIndex={0} role='region' aria-label='Service gallery' onKeyDown={onKeyDown}>
        <div className='relative w-full aspect-[16/9] bg-slate-100'>
          {!loaded && <div className='absolute inset-0 animate-pulse bg-slate-100' />}

          <motion.img key={safeImages[active]?.url} src={safeImages[active]?.url?.startsWith('http') ? safeImages[active]?.url : baseImg + safeImages[active]?.url} alt={`Image ${active + 1}`} onLoad={() => setLoaded(true)} className={` rounded-xl absolute inset-0 h-full w-full object-cover transition-transform duration-300   ${loaded ? 'opacity-100' : 'opacity-0'}`} initial={{ opacity: 0, scale: 1.01 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.2, scale: 1.005 }} />

          {/* edge fades */}
          <div className='pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-white/50 to-transparent' />
          <div className='pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white/50 to-transparent' />

          {/* controls */}
          {safeImages.length > 1 && (
            <>
              <button type='button' aria-label='Previous image' onClick={prev} className=' cursor-pointer absolute flex-none left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-2.5 py-2 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500'>
                <ChevronLeft className='h-[25px] w-[21px] cursor-pointer flex-none ' />
              </button>
              <button type='button' aria-label='Next image' onClick={next} className=' cursor-pointer absolute flex-none right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur px-2.5 py-2 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500'>
                <ChevronRight className='h-[25px] w-[21px] cursor-pointer flex-none ' />
              </button>
            </>
          )}

          {/* index pill + open lightbox */}
          <div className='absolute bottom-3 left-3 flex items-center gap-2'>
            <span className='rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow'>
              {active + 1} / {safeImages.length}
            </span>
            <button type='button' onClick={() => setLightbox(true)} className=' cursor-pointer inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white'>
              <Maximize2 className='h-3.5 w-3.5' />
              View
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnails strip */}
      <div className='relative  pt-4 '>
        {/* edge masks */}
        <div className='pointer-events-none absolute inset-y-0 left-0  w-8 bg-gradient-to-r from-white to-transparent' />
        <div className='pointer-events-none absolute inset-y-0 right-0  w-8 bg-gradient-to-l from-white to-transparent' />

        <div ref={stripRef} className='flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory ' role='tablist' aria-label='Select image'>
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
                className={` hover:scale-[.95] duration-300 cursor-pointer relative h-20 w-28 flex-shrink-0 snap-start overflow-hidden rounded-xl border transition 
                 ${activeState ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'}`}>
                <Img src={img.url} alt={img.alt || `Thumbnail ${i + 1}`} className='h-full w-full object-cover' loading='lazy' decoding='async' />
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
              <div className='relative max-h-[90vh] w-full max-w-[92vw]'>
                <motion.img key={`lb-${safeImages[active]?.url}`} src={safeImages[active]?.url?.startsWith('http') ? safeImages[active]?.url : baseImg + safeImages[active]?.url} alt={`Image ${active + 1}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className='max-h-[90vh] w-full mx-auto max-w-[92vw] rounded-xl object-contain shadow-2xl' />
                {safeImages.length > 1 && (
                  <>
                    <button onClick={prev} className='absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white' aria-label='Previous image'>
                      <ChevronLeft className='h-5 w-5' />
                    </button>
                    <button onClick={next} className='absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white' aria-label='Next image'>
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

function AboutService({ serviceData = {}, onTagClick }) {
  const t = useTranslations('ServiceDetails');
  const [expanded, setExpanded] = useState(false);

  const tags = useMemo(() => {
    const arr = Array.isArray(serviceData?.searchTags) ? serviceData.searchTags : [];
    const map = new Map();
    arr.forEach(t => {
      const key = String(t || '').trim();
      if (!key) return;
      const lk = key.toLowerCase();
      const val = map.get(lk);
      map.set(lk, { label: key, count: val ? val.count + 1 : 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [serviceData?.searchTags]);

  const brief = String(serviceData?.brief || '');
  const longBrief = brief.length > 180;

  return (
    <section aria-labelledby='about-title' className='my-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between px-6 pt-6'>
        <div className='flex items-center gap-2'>
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700'>
            <Info className='h-4 w-4' />
          </span>
          <h2 id='about-title' className='text-xl font-semibold text-slate-900'>
            {t('about.title')}
          </h2>
        </div>
      </div>

      {/* Brief with collapse */}
      <div className='px-6 pb-4'>
        <div className={`relative mt-4 text-slate-700 leading-7 ${expanded ? '' : 'max-h-32 overflow-hidden pr-1'}`}>
          <p className='whitespace-pre-line'>{brief || t('about.noDescription')}</p>
          {!expanded && longBrief && <div className='pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent' />}
        </div>

        {longBrief && (
          <button onClick={() => setExpanded(v => !v)} className='mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800' aria-expanded={expanded}>
            {expanded ? t('about.showLess') : t('about.readMore')}
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden='true' />
          </button>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className='border-t border-slate-100 px-6 pb-6 pt-4'>
          <div className='mb-2 flex items-center gap-2'>
            <TagIcon className='h-4 w-4 text-slate-500' />
            <h3 className='text-sm font-medium text-slate-900'>{t('about.tags')}</h3>
            <span className='text-xs text-slate-500'>({tags.length})</span>
          </div>

          <AnimatePresence initial={false}>
            <motion.div layout className='flex flex-wrap gap-2' transition={{ layout: { duration: 0.2 } }}>
              {tags.slice(0, expanded ? tags.length : 10).map((t, i) => (
                <motion.button key={t.label + i} layout onClick={() => onTagClick?.(t.label)} className='group inline-flex items-center gap-1 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-100' title={t.count > 1 ? `${t.label} (${t.count})` : t.label}>
                  <span>#{t.label}</span>
                  {t.count > 1 && <span className='rounded-xl bg-white/70 px-1.5 text-xs text-emerald-700 group-hover:bg-white'>×{t.count}</span>}
                </motion.button>
              ))}
              {!expanded && tags.length > 10 && (
                <button onClick={() => setExpanded(true)} className='inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50'>
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

function PackagesSection({ packages, selectedPackage, setSelectedPackage }) {
  const t = useTranslations('ServiceDetails');
  const [view, setView] = useState('cards');
  const containerRef = useRef(null);

  function scoreValue(p) {
    const f = Array.isArray(p.features) ? p.features.length : 0;
    const price = Number(p.price || 1);
    return f / Math.max(price, 1);
  }

  const { list, recommendedIndex } = useMemo(() => {
    const list = packages || [];
    const stdIdx = list.findIndex(p => /standard/i.test(p?.type || ''));
    const rec = stdIdx !== -1 ? stdIdx : list.reduce((best, p, i) => (scoreValue(p) > scoreValue(list[best]) ? i : best), 0);
    return { list, recommendedIndex: Math.max(0, rec) };
  }, [packages]);

  const selectedName = selectedPackage?.type ?? list[0]?.type;

  const onKeyDown = e => {
    if (!list.length) return;
    const idx = Math.max(
      0,
      list.findIndex(p => p.type === selectedName),
    );
    if (e.key === 'ArrowRight') setSelectedPackage(list[(idx + 1) % list.length]);
    if (e.key === 'ArrowLeft') setSelectedPackage(list[(idx - 1 + list.length) % list.length]);
  };

  return (
    <section className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6' aria-labelledby='packages-title'>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <Table2 className="h-4 w-4 text-slate-700" />
          </div>
          <h2 id="packages-title" className="text-lg md:text-xl font-semibold text-slate-900">
            {t('packages.title')}
          </h2>
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setView('cards')}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm transition
        ${view === 'cards' ? 'gradient text-white' : 'text-slate-700 hover:bg-slate-50'}`}
            aria-pressed={view === 'cards'}
            aria-label={t('packages.cardsView')}
          >
            <LayoutGrid className="h-4 w-4" /> {t('packages.cards')}
          </button>
          <button
            type="button"
            onClick={() => setView('compare')}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm transition
        ${view === 'compare' ? 'gradient text-white' : 'text-slate-700 hover:bg-slate-50'}`}
            aria-pressed={view === 'compare'}
            aria-label={t('packages.compareView')}
          >
            <Table2 className="h-4 w-4" /> {t('packages.compare')}
          </button>
        </div>
      </div>


      {/* Content */}
      <div ref={containerRef} tabIndex={0} onKeyDown={onKeyDown} className='outline-none '  >
        <AnimatePresence mode='wait'>
          {view === 'cards' ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-cols-fr gap-5 w-full min-w-0"
            >

              {list.map((pkg, index) => {
                const active = selectedName === pkg.type;
                const recommended = index === recommendedIndex;
                return (
                  <motion.div type='button' key={pkg.type + index} whileHover={{ y: -3 }} className={` group relative flex h-full flex-col items-start rounded-xl border p-5 transition ${active ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                    <div className='mb-2 flex flex-wrap w-full items-start justify-between gap-1'>
                      <div className='flex items-center flex-wrap gap-2'>
                        <h3 className='text-lg font-bold uppercase tracking-wide text-slate-900'>{pkg.type}</h3>
                        {recommended && (
                          <span className='inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800'>
                            <Crown className='h-3.5 w-3.5' /> {t('packages.recommended')}
                          </span>
                        )}
                        {/* ✅ Show Test flag if pkg.test is true */}
                        {pkg.test && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-800">
                            <Beaker className="h-3.5 w-3.5" /> {t('packages.test')}
                          </span>
                        )}
                      </div>
                      <PriceTag price={pkg.price} className='!text-lg !font-bold !text-slate-900' />
                    </div>
                    {/* Second title */}
                    {pkg.title && (
                      <h4 className="mb-2 text-base font-semibold text-slate-800">
                        {pkg.title}
                      </h4>
                    )}
                    {/* Description */}
                    {pkg.description && <p className='mb-4 line-clamp-2 text-sm leading-6 text-slate-600'>{pkg.description}</p>}

                    {/* Meta */}
                    <div className='mb-4 flex w-full items-center justify-between flex-wrap text-sm text-slate-700'>
                      <span className='inline-flex items-center gap-1.5'>
                        <Clock className='h-4 w-4 text-slate-600' />
                        <span className='font-medium text-slate-900'>{pkg.deliveryTime}</span>
                        <span className='text-slate-500'>Day(s)</span>
                      </span>
                      <span className='inline-flex items-center gap-1.5'>
                        <Box className='h-4 w-4 text-slate-600' />
                        <span className='font-medium text-slate-900'>{pkg.revisions}</span>
                        <span className='text-slate-500'>Revisions</span>
                      </span>
                    </div>

                    {/* Features */}
                    <ul className='mb-4 w-full space-y-2 pb-12'>
                      {(pkg.features || []).slice(0, 4).map((feature, i) => (
                        <li key={i} className='flex items-start text-sm'>
                          <CheckCircle2 className='mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600' />
                          <span className='text-slate-700'>{feature}</span>
                        </li>
                      ))}
                      {pkg.features?.length > 4 && <li className='pl-6 text-xs text-slate-500'>+ {pkg.features.length - 4} more</li>}
                    </ul>

                    {/* CTA */}
                    <Button
                      name={active ? t('packages.selected') : t('packages.select')}
                      className={`absolute left-[10px] !w-[calc(100%-20px)] bottom-[10px] h-10 transition
                        ${active ? 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-300' : 'bg-slate-900 hover:bg-slate-950 focus-visible:ring-2 focus-visible:ring-slate-300'}`}
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
              <div className='min-w-[780px]'>
                <div className='grid grid-cols-[220px_repeat(3,minmax(180px,1fr))] gap-2'>
                  {/* Header row (package names) */}
                  <div className='px-2 py-3 text-sm font-medium text-slate-500'>Option</div>
                  {list.map((p, i) => {
                    const active = selectedName === p.name; // (UI only; logic untouched)
                    return (
                      <div
                        key={'h' + i}
                        className={`rounded-xl px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide
                          ${active ? 'border border-emerald-500 bg-emerald-50 text-emerald-900' : 'border border-slate-200 bg-white text-slate-900'}`}>
                        {p.type}
                        {p.title && (
                          <div className="mt-1 text-xs font-medium text-slate-600 normal-case">
                            {p.title}
                          </div>
                        )}

                      </div>
                    );
                  })}

                  {/* ✅ New Test row */}
                  <div className="py-3 pl-2 text-sm text-slate-600">Test</div>
                  {list.map((p, i) => (
                    <div
                      key={"test" + i}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm"
                    >
                      {p.test ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">
                          <Beaker className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </div>
                  ))}

                  {/* Price */}
                  <div className='py-3 pl-2 text-sm text-slate-600'>Price</div>
                  {list.map((p, i) => (
                    <div key={'price' + i} className='rounded-xl border border-slate-200 bg-white px-4 py-3 text-center'>
                      <PriceTag price={p.price} className='!text-base !font-semibold' />
                    </div>
                  ))}

                  {/* Delivery */}
                  <div className='py-3 pl-2 text-sm text-slate-600'>Delivery</div>
                  {list.map((p, i) => (
                    <div key={'del' + i} className='rounded-xl border border-slate-200 bg-white px-4 py-3 text-center'>
                      {p.deliveryTime} Day(s)
                    </div>
                  ))}

                  {/* Revisions */}
                  <div className='py-3 pl-2 text-sm text-slate-600'>Revisions</div>
                  {list.map((p, i) => (
                    <div key={'rev' + i} className='rounded-xl border border-slate-200 bg-white px-4 py-3 text-center'>
                      {p.revisions}
                    </div>
                  ))}

                  {/* Features count */}
                  <div className='py-3 pl-2 text-sm text-slate-600'>Features</div>
                  {list.map((p, i) => (
                    <div key={'fc' + i} className='rounded-xl border border-slate-200 bg-white px-4 py-3 text-center'>
                      {(p.features || []).length}
                    </div>
                  ))}

                  {/* CTA row */}
                  <div className='py-2 pl-2' />
                  {list.map((p, i) => {
                    const active = selectedName === p.type;
                    return (
                      <div key={'cta' + i} className='px-2 py-2 text-center'>
                        <Button name={active ? t('packages.selected') : t('packages.select')} className={`w-full transition  
                          ${active ? 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-300' : 'bg-slate-900 hover:bg-slate-950 focus-visible:ring-2 focus-visible:ring-slate-300'}`} onClick={() => setSelectedPackage(p)} />
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

function RequirementsSection({ triedSubmit, requirements, answers, onChange, validationErrors = {}, onComplete }) {
  const t = useTranslations('ServiceDetails');
  const [expanded, setExpanded] = useState({});

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


  return (
    <section className='relative mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-custom '>
      {/* header */}
      <div className='flex items-center justify-between gap-3 px-6 pt-6'>
        <div className='min-w-0'>
          <h2 className='text-xl font-semibold text-slate-900'>{t('requirements.title')}</h2>
          <p className='mt-1 text-sm text-slate-600'>{t('requirements.subtitle')}</p>
        </div>
        {total > 0 && (
          <div className='shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800'>
            {answered}/{total} {t('requirements.complete')}
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
            return (
              <RequirementField
                key={req.id}
                idx={idx}
                answers={answers}
                requirement={req}
                triedSubmit={triedSubmit}
                onChange={onChange}
                validationErrors={validationErrors}
              />
            )
          })}
        </div>
      </div>
    </section>
  );
}


function RequirementField({ idx, answers, requirement, triedSubmit, validationErrors, onChange }) {
  const t = useTranslations('ServiceDetails');
  const req = requirement;
  const val = answers?.[req.id];
  const missing = req.isRequired && (req.requirementType === 'file' ? !val : !String(val ?? '').trim());
  const showErr = triedSubmit && (missing || !!validationErrors?.[req.id]);
  const errMsg = triedSubmit && (validationErrors?.[req.id] || missing ? t('requirements.required') : '');

  // local state for text editing
  const [localVal, setLocalVal] = useState(val);

  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  //for autofocus
  useEffect(() => {
    if (req?.requirementType === 'text') {
      if (localVal?.length > 80 && textareaRef.current) {
        const el = textareaRef.current;
        el.focus();
        // move cursor to end
        el.setSelectionRange(el.value.length, el.value.length);

      }
      else if (localVal?.length <= 80 && inputRef.current) {
        const el = inputRef.current;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [localVal?.length, req?.requirementType]);

  return (
    <motion.div key={req.id} id={`requirement-${req.id}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className=' '>
      <div className='flex items-start justify-between gap-4'>
        <label className='block text-base font-semibold text-slate-900'>
          {idx + 1}. {req.question}
          {req.isRequired && <span className='ml-1 text-red-500'>*</span>}
        </label>

        {/* {!req.isRequired && (
                    <button onClick={() => setExpanded(e => ({ ...e, [req.id]: !e[req.id] }))} className='inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900'>
                      {expanded[req.id] ? 'Hide' : 'Details'} <ChevronDown className={`h-3.5 w-3.5 transition ${expanded[req.id] ? 'rotate-180' : ''}`} />
                    </button>
                  )} */}
      </div>

      {/* TEXT */}
      {req.requirementType === 'text' && <div className='mt-3'>{String(localVal ?? '').length > 80 ?
        (
          <div className="relative">
            <Textarea
              ref={textareaRef}
              rows={4}
              placeholder={t('requirements.textPlaceholder')}
              value={localVal}
              onChange={e => setLocalVal(e.target.value.slice(0, 3000))}
              onBlur={() => onChange(req.id, localVal)}
              className={`w-full transition  `}
            />
            <div className="absolute right-0 mt-1 text-xs text-slate-500">
              {localVal.length}/3000
            </div>
          </div>
        ) :
        <Input
          ref={inputRef}
          type='text'
          placeholder={t('requirements.inputPlaceholder')}
          value={localVal}
          onChange={e => setLocalVal(e.target.value.slice(0, 3000))}
          onBlur={() => onChange(req.id, localVal)}
          required={req.isRequired}
          showMsgError={false}
        />}</div>
      }

      {/* MULTIPLE CHOICE */}
      {req.requirementType === 'multiple_choice' && Array.isArray(req.options) && <MultipleChoiceFancy req={req} value={val} onSelect={val => onChange(req.id, val)} />}

      {/* FILE */}
      {req.requirementType === 'file' && (
        <div className='mt-3 relative'>
          <label
            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed bg-slate-50 p-6 transition hover:bg-slate-100
                      ${showErr ? 'border-red-300' : 'border-slate-300'}`}>
            <div className='text-center'>
              <UploadCloud className='mx-auto h-7 w-7 text-slate-500' />
              <p className='mt-2 text-sm text-slate-700'>
                <span className='font-medium'>{t('requirements.clickToUpload')}</span> {t('requirements.orDragDrop')}
              </p>
              <p className='text-xs text-slate-500'>{t('requirements.anyFileType')}</p>
            </div>
            {/* <input type='file' className='hidden' onChange={e => onChange(req.id, e.target.files?.[0] || null)} /> */}
            <AttachFilesButton cnBtn={'absolute inset-0  opacity-0 '} maxSelection={1} hiddenFiles={true} onChange={files => {
              onChange(req.id, files?.[0])
            }} />
          </label>

          {!!val && (
            <div className='mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700'>
              <CheckCircle2 className='h-4 w-4 text-emerald-600' />
              {t('requirements.selected')}: <span className='font-medium'>{val?.name || val?.filename || String(val)}</span>
            </div>
          )}
        </div>
      )}

      {showErr && (
        <p className='mt-2 inline-flex items-center gap-1.5 text-sm text-red-600'>
          <AlertCircle className='h-4 w-4' />
          {errMsg || t('requirements.fieldRequired')}
        </p>
      )}

      {/* {!req.isRequired && expanded[req.id] && <p className='mt-3 text-sm text-slate-500'>Optional input—add any extra notes that help tailor your request.</p>} */}
    </motion.div>
  );
}


function SkeletonLine({ className = '' }) {
  return <div className={`!h-3 shimmer rounded bg-slate-200/80 ${className}`} />;
}


function AboutSeller({ serviceData }) {
  const t = useTranslations('ServiceDetails');
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
    <section className='bg-white rounded-xl shadow-custom  border border-slate-200 overflow-hidden mb-6'>
      {/* header */}
      <div className='p-6'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <span className='absolute -inset-0.5 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-emerald-400 via-sky-400 to-violet-400 blur opacity-30' />
            <div className='relative size-12 overflow-hidden rounded-full border border-white shadow-sm ring-1 ring-slate-200 bg-white flex items-center justify-center'>{seller?.profileImage && Img ? <Img src={seller.profileImage} alt={`${seller?.username || 'Seller'} avatar`} className='h-full w-full object-cover' /> : <span className='text-sm font-semibold text-slate-600 select-none'>{getInitials(seller?.username)}</span>}</div>
          </div>

          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <Link href={`/profile/${seller?.id}`} className='font-semibold text-slate-900 leading-none'>
                {seller?.username || 'Unknown Seller'}
              </Link>
              {!!seller?.sellerLevel && (
                <span className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600'>
                  <BadgeCheck className='h-3 w-3 text-emerald-600' />
                  {String(seller.sellerLevel).toUpperCase()}
                </span>
              )}
            </div>

            <p className='mt-1 line-clamp-1 text-sm text-slate-600'>{seller?.description || serviceData?.brief || 'No description provided.'}</p>
          </div>
        </div>

        {/* quick stats */}
        <div className='mt-4 flex flex-wrap items-center gap-2 text-xs'>
          {!!serviceData?.rating && <StatPill icon={<Star className='h-3.5 w-3.5 text-amber-600' />} label='Rating' value={(serviceData?.rating ?? 0).toFixed(1)} />}
          <StatPill icon={<Calendar className='h-3.5 w-3.5' />} label={t('seller.orders')} value={String(serviceData?.ordersCount ?? 0)} />
        </div>
      </div>

      {/* info grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-6 border-y border-slate-100'>
        <InfoRow
          icon={<MapPin className='h-5 w-5 text-slate-400' />}
          title={t('seller.from')}
          value={
            <span className='inline-flex items-start gap-1'>
              <span aria-hidden className='text-base'>
                {countryFlag(seller?.country)}
              </span>
              {seller?.country || 'Not specified'}
            </span>
          }
        />
        <InfoRow icon={<Calendar className='h-5 w-5 text-slate-400' />} title={t('seller.memberSince')} value={seller?.memberSince ? `${new Date(seller.memberSince).toLocaleDateString()} • ${timeSince(seller.memberSince)}` : 'Not specified'} />
        <InfoRow
          icon={<Globe className='h-5 w-5 text-slate-400' />}
          title={t('seller.languages')}
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
              {descOpen ? t('seller.showLess') : t('seller.readMore')}
              <ChevronDown className={`h-4 w-4 transition ${descOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}

      <div className='px-6 pb-6 pt-4 space-y-6'>
        {!!skills.length && (
          <div>
            <div className='mb-1 text-sm font-medium text-slate-900'>{t('seller.keySkills')}</div>
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
              <ShieldCheck className='h-4 w-4 text-emerald-600' /> {t('seller.certifications')}
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
              <GraduationCap className='h-4 w-4 text-sky-600' /> {t('seller.education')}
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
              <ImageIcon className='h-4 w-4' /> {t('seller.portfolio')}
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              {portfolio.map((p, i) => (
                <a key={i} href={resolveUrl(p)} target='_blank' rel='noopener noreferrer' className='group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-50' title={p.title}>
                  <Img src={p} alt={p.title || 'Portfolio'} className='h-28 w-full object-cover transition group-hover:scale-[1.02]' />
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

function PurchaseSidebar({ canOrder, selectedPackage, serviceData, onTryOpenOrderOptions }) {
  const t = useTranslations('ServiceDetails');
  const { user } = useAuth();
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
    <div className='w-full lg:w-[400px]'>
      <aside className='sticky top-28'>
        <div className={`relative rounded-xl border border-slate-200 bg-white p-6 ${selectedPackage && "pt-[36px]"} shadow-custom`}>
          <div className='pointer-events-none absolute -inset-px rounded-xl p-[1px]   ' />

          {selectedPackage ? (
            <>
              <div className='mb-4 flex items-start justify-between'>
                <h3 className='text-lg font-semibold text-slate-900'>{selectedPackage.name}</h3>
                <FavoriteButton serviceId={serviceData?.id} packageType={selectedPackage.name} />
              </div>

              <div className='mb-3 flex items-center justify-between'>
                <div>
                  <span className='text-slate-600'> {selectedPackage.title}</span>
                </div>
                <PriceTag price={selectedPackage.price} className='!text-xl font-bold' />
              </div>

              <div className='mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500'>
                <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5'>{valueMeta.count} {t('sidebar.features')}</span>
                <span className='rounded-full border border-slate-200 bg-white px-2 py-0.5'>~ {valueMeta.perFeature} / {t('sidebar.feature')}</span>
                {selectedPackage.test && <span className='flex gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5'>
                  <Beaker className="h-3.5 w-3.5" /> {t('sidebar.test')}</span>
                }
                {serviceData?.fastDelivery && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800'>
                    <Zap className='h-3.5 w-3.5' /> {t('sidebar.fastDelivery')}
                  </span>
                )}
                {serviceData?.additionalRevision && (
                  <span className='inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5'>
                    <Repeat className='h-3.5 w-3.5' /> {t('sidebar.extraRevisions')}
                  </span>
                )}
              </div>

              {selectedPackage.description && <p className='mb-5 text-sm leading-6 text-slate-600'>{selectedPackage.description}</p>}

              <div className='mb-5 space-y-2 text-sm text-slate-700'>
                <div className='flex items-center'>
                  <Clock className='mr-2 h-4 w-4 text-slate-400' /> <span>{selectedPackage.deliveryTime} {t('sidebar.dayDelivery')}</span>
                </div>
                <div className='flex items-center'>
                  <Box className='mr-2 h-4 w-4 text-slate-400' /> <span>{selectedPackage.revisions} {t('sidebar.revisions')}</span>
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
                    + {features.length - featuresPreview.length} {t('sidebar.more')}
                  </button>
                )}
              </ul>

              <div className='flex items-center gap-2'>
                {/* NEW: gate opening */}
                <Button name={t('sidebar.continue')} className='flex-1' disabled={!canOrder} onClick={onTryOpenOrderOptions} />
                {user && serviceData.seller.id !== user.id && <Link href={`/chat?userId=${serviceData?.seller?.id}`} aria-label={t('sidebar.chatWithSeller')} className='inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-custom  hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500'>
                  <MessageCircle size={18} />
                </Link>}
              </div>

              <div className='mt-4 flex items-center justify-center text-xs text-slate-500'>
                <Shield className='mr-1 h-4 w-4' />
                {t('sidebar.secureCheckout')} • {t('sidebar.buyerProtection')}
              </div>
            </>
          ) : (
            <div className='py-8 text-center text-slate-500'>{t('sidebar.selectPackage')}</div>
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
    <span className='inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-custom  text-slate-700'>
      {icon}
      <span className='font-medium'>{value}</span>
      <span className='text-slate-500'>· {label}</span>
    </span>
  );
}

/* === tiny helper === */
function Chip({ icon, label }) {
  return (
    <span className='inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 shadow-custom '>
      {icon}
      {label}
    </span>
  );
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
        <div className='w-full lg:w-[calc(100%-400px)] space-y-6'>
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
                  <div className='w-9 h-9 bg-slate-200 rounded-xl' />
                  <SkeletonLine className='w-24' />
                </div>
                <SkeletonLine className='w-full' />
              </div>
            ))}
          </div>

          {/* Gallery */}
          <div className='rounded-xl shadow-custom  overflow-hidden border border-slate-100 bg-white'>
            <div className='h-72 bg-slate-200' />
            <div className='p-4 flex gap-2'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='w-20 h-20 bg-slate-200 rounded-xl' />
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
        <div className='w-full h-[200px] lg:w-[400px]'>
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
  const val = typeof value === 'string' ? value : value?.option;
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
    normalized.findIndex(o => o.value === val),
  );
  const focusMove = dir => {
    const next = (currentIndex + dir + normalized.length) % normalized.length;
    onSelect({ option: normalized[next].value, otherText });
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
      onSelect({ option: val || normalized[0].value, otherText });
    }
    if (/^[1-9]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < normalized.length) {
        e.preventDefault();
        onSelect({ option: normalized[idx].value, otherText });
      }
    }
  };

  // is "Other" selected?
  const isOther = typeof val === 'string' && val.toLowerCase() === 'other';
  const [otherText, setOtherText] = useState('');

  function UpdateOtherText() {
    if (!isOther) return;
    onSelect({ option: val, otherText });
  }


  useEffect(() => {
    if (!isOther) setOtherText('');
  }, [isOther]);

  return (
    <div className='mt-3'>
      <div ref={containerRef} role='radiogroup' aria-required={isRequired ? 'true' : 'false'} aria-label={req?.question || 'Multiple choice'} tabIndex={0} onKeyDown={onKeyDown} className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 outline-none'>
        {normalized.map((opt, i) => {
          const active = val === opt.value;
          return (
            <motion.button
              key={opt._k}
              type='button'
              role='radio'
              aria-checked={active}
              onClick={() => onSelect({ option: opt.value, otherText })}
              whileHover={{ y: 0 }}
              whileTap={{ scale: 0.98 }}
              className={`group cursor-pointer relative text-left rounded-xl border px-3.5 py-3 transition
                ${active ? 'border-emerald-500 bg-gradient-to-b from-emerald-50 to-white ring-2 ring-emerald-100 shadow-custom ' : 'border-slate-300 hover:border-slate-400 bg-white'}`}>
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
          <label className='mb-1 block text-sm font-medium text-slate-900'>{t('requirements.otherText')}</label>
          <input
            type="text"
            value={otherText}
            placeholder={t('requirements.otherPlaceholder')}
            onChange={e => setOtherText(e.target.value.slice(0, 500))} // enforce max length
            onBlur={() => UpdateOtherText(otherText)}
            maxLength={500} // browser-level enforcement
            className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
          />
          <div className="mt-1 text-[11px] text-slate-500">
            {otherText.length}/500 • {t('requirements.includeWithSelection')}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderOptions({ loadingSubmit, isSidebarOpen, onComplete, setIsSidebarOpen, serviceData, selectedPackage }) {
  const t = useTranslations('ServiceDetails');
  const drawerRef = useRef(null);
  const firstFocusRef = useRef(null);
  const [notes, setNotes] = useState('');
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
        label: `${selectedPackage?.title ?? ''} Package`,
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
      <aside ref={drawerRef} role='dialog' aria-modal='true' aria-labelledby='order-options-title' className={`overflow-y-auto !h-screen fixed right-0 top-0 z-[100] w-[360px] max-w-full sm:w-[420px] bg-white border-l shadow-2xl transition-transform duration-300 ease-out will-change-transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className='pointer-events-none absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-emerald-200/50 via-transparent to-emerald-200/50' />

        {/* Header */}
        <div className='overflow-y-auto h-[calc(100dvh-140px)]'>
          <div className='sticky top-0 z-10 bg-white px-6 pt-6 pb-4'>
            <div className='flex items-start justify-between gap-3'>
              <h2 id='order-options-title' className='text-2xl font-bold text-slate-900'>
                {t('orderOptions.title')}
              </h2>
              <button ref={firstFocusRef} onClick={toggleSidebar} aria-label={t('orderOptions.close')} className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50'>
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
                {t('orderOptions.specialInstructions')}
              </label>
              <textarea rows={4} value={notes} onChange={e => {
                if (e.target.value.length <= 750) setNotes(e.target.value);
              }}
                maxLength={750} placeholder={t('orderOptions.sellerShouldKnow')} className='w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100' />
              <div className='mt-1 text-right text-xs text-slate-500'> {notes.length}/750 {t('orderOptions.chars')}</div>
            </div>

            {/* Summary card */}
            <div className='rounded-xl border border-emerald-200 bg-emerald-50/50 p-4'>
              <div className='text-slate-800'>
                <PriceTag price={selectedPackage?.price ?? 0} />
                <div className='mt-4 space-y-2 text-slate-700'>
                  {summaryItems.map((it, i) => (
                    <div key={i} className='flex items-center gap-2'>
                      <span className='inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200'>{it.icon}</span>
                      <span className='text-sm font-medium'>{it.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* <div className='mt-4 text-sm text-slate-600'>You can always modify these options later in your order management.</div> */}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className='absolute bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur'>
          <div className='mb-3 flex items-center justify-between'>
            <span className='text-sm text-slate-600'>{t('orderOptions.total')}</span>
            <PriceTag price={selectedPackage?.price ?? 0} className='!text-xl font-bold' />
          </div>

          <Button name={t('orderOptions.continueToRequirements')} loading={loadingSubmit} className='w-full' onClick={() => onComplete(notes)} iconRight={<ChevronRight className='ml-1 h-4 w-4' />} />
        </div>
      </aside>
    </div>
  );
}

function BgShapes() {
  return <div aria-hidden='true' className='pointer-events-none absolute inset-0 rounded-xl' style={{ background: 'radial-gradient(1200px 400px at 0% 0%, rgba(16,185,129,.06), transparent 60%), radial-gradient(1200px 400px at 100% 0%, rgba(59,130,246,.06), transparent 60%)' }} />;
}
