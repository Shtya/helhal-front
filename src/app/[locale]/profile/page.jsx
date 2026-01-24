'use client';

import React, { useEffect, useMemo, useState, useRef, use } from 'react';
import api, { baseImg, fileTimeout, uploadTimeout } from '@/lib/axios';
import { FileText, UploadCloud, Upload, Video, Camera, MapPin, CalendarDays, Copy, Shield, Star, Plus, Trash2, Info, Award, CheckCircle2, Repeat, DollarSign, Settings2, AlertTriangle, Mail, Phone, X, Loader2 } from 'lucide-react';

import Input from '@/components/atoms/Input';
import Textarea from '@/components/atoms/Textarea';
import Button from '@/components/atoms/Button';

import AttachFilesButton from '@/components/atoms/AttachFilesButton';
import { StatCard } from '@/components/dashboard/Ui';

import { Card, Divider, Pill, SkeletonLine, SkeletonAvatar, BlockSkeleton } from '@/components/UI/ui';
import Img from '@/components/atoms/Img';
import toast from 'react-hot-toast'
import PhoneInputWithCountry from '@/components/atoms/PhoneInputWithCountry';
import { formatResponseTime, validateUsername, validatPhone } from '@/utils/profile';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import InfoCard from '@/components/pages/profile/InfoCard';
import AccountVerificationCard from '@/components/pages/profile/AccountVerificationCard';
import { resolveUrl } from '@/utils/helper';
import FormErrorMessage from '@/components/atoms/FormErrorMessage';
import TopRatedBadge from '@/components/atoms/TopRatedBadge';

const EditIcon = ({ className }) => (
  <svg
    className={`cursor-pointer hover:scale-[1.1] duration-300 ${className}`}
    width="30"
    height="30"
    viewBox="0 0 42 42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ color: 'var(--color-main-600)' }}
  >
    <path
      d="M19.25 3.5H15.75C7 3.5 3.5 7 3.5 15.75V26.25C3.5 35 7 38.5 15.75 38.5H26.25C35 38.5 38.5 35 38.5 26.25V22.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M28.0703 5.2852L14.2803 19.0752C13.7553 19.6002 13.2303 20.6327 13.1253 21.3852L12.3728 26.6527C12.0928 28.5602 13.4403 29.8902 15.3478 29.6277L20.6153 28.8752C21.3503 28.7702 22.3828 28.2452 22.9253 27.7202L36.7153 13.9302C39.0953 11.5502 40.2153 8.7852 36.7153 5.2852C33.2153 1.7852 30.4503 2.9052 28.0703 5.2852Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M26.0918 7.2627C27.2643 11.4452 30.5368 14.7177 34.7368 15.9077"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* -------------------------------- Utilities -------------------------------- */
const toDate = iso => (iso ? new Date(iso).toLocaleString() : '—');
const toDateShort = iso => (iso ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(iso)) : '—');
const letterFromName = s => (s && String(s).trim() ? String(s).trim()[0].toUpperCase() : '?');

/* -------------------------------- Profile Card ------------------------------ */
function ProfileCard({ loading, editing, setEditing, state, setState, meta, onCopyReferral, onError }) {
  const tAuth = useTranslations('Auth');
  const t = useTranslations('Profile.page');
  const [usernameError, setUsernameError] = useState('');

  const handleChangeUsername = (value) => {
    const trimmed = value.trim();

    const msg = validateUsername(trimmed);
    setUsernameError(msg);
    onError?.(!!msg);
  };

  // const [phoneError, setPhoneError] = useState('');

  // const handleChangePhone = (val) => {
  //   const trimmed = val.phone.trim();
  //   const isInvalid = validatPhone(trimmed);

  //   setPhoneError(isInvalid ? 'inValidOptionalPhone' : '');
  //   onError?.(isInvalid);
  //   setState(s => ({ ...s, ...val }));
  // };


  return (
    <Card className=''>
      <div className='rounded-t-2xl px-6 py-7' style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0) 100%)' }}>
        <div className='flex items-center justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <Pill>{state?.type || '—'}</Pill>
            {state.sellerLevel ? <Pill>{t('level', { level: state.sellerLevel })}</Pill> : null}
            <TopRatedBadge isTopRated={meta?.topRated} />
          </div>

          {/* Replace your <img> with this */}
          <button
            onClick={() => setEditing(!editing)}
            className="p-1 rounded-lg transition-all focus:outline-none"
            aria-label="Edit"
          >
            <EditIcon className={editing ? "scale-110 opacity-70" : ""} />
          </button>
        </div>

        <div className='mt-4 flex flex-col items-center'>
          <div className='mb-1 grid place-items-center'>
            {loading ? (
              <SkeletonAvatar />
            ) : (
              <div className='group relative grid place-items-center'>
                <div className='relative overflow-hidden'>
                  {state.profileImage ? (
                    <Img altSrc={'/no-user.png'} src={state.profileImage} alt='avatar' className='h-20 w-20 rounded-full border border-[#EDEDED] object-cover' />
                  ) : (
                    <div className='grid h-20 w-20 place-content-center rounded-full border border-[#EDEDED] bg-[#EDEDED] group-hover:ring-2 group-hover:ring-[var(--color-main-600)]'>
                      <span className='text-2xl font-bold text-[#6B7280]'>{letterFromName(state.username || state.email)}</span>
                    </div>
                  )}

                  <div className='pointer-events-none absolute inset-0 hidden items-center justify-center rounded-full bg-black/35 text-white group-hover:flex'>
                    <Camera className='h-5 w-5' />
                  </div>

                  <AttachFilesButton
                    hiddenFiles
                    maxSelection={1}
                    className='absolute inset-0 scale-y-[4] opacity-0'
                    onChange={files => {
                      const img = (files || []).find(f => String(f.mimeType || '').startsWith('image/'));
                      if (!img) return;
                      // Replace with real upload — here we just use a provided url
                      setState(s => ({ ...s, profileImage: img.url }));
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <>
              <SkeletonLine w='w-40' />
              <SkeletonLine w='w-56' />
            </>
          ) : editing ? (
            <div className='w-full max-w-xs space-y-2'>
              <Input
                required
                label={t('username')}
                value={state.username}
                onChange={e => {
                  const value = e.target.value.slice(0, 50);
                  setState(s => ({ ...s, username: value }));
                  handleChangeUsername(value);
                }}
                onBlur={e => handleChangeUsername(e.target.value)}
              />
              {usernameError && <FormErrorMessage message={tAuth(`errors.${usernameError}`)} />}
              {/* <Input label='Email' value={state.email} onChange={e => setState(s => ({ ...s, email: e.target.value }))} /> */}
              {/* <PhoneInputWithCountry
                value={{ countryCode: state.countryCode, phone: state.phone }}
                onChange={handleChangePhone}
              />
              {phoneError && <FormErrorMessage message={tAuth(`errors.${phoneError}`)} />} */}


            </div>
          ) : (
            <>
              <h3 className='mt-3 text-xl font-semibold text-[#000000]'>{state.username || '—'}</h3>
              <p className='mb-[5px] text-[#6B7280]'>{state.email || '—'}</p>
              <div className='flex  flex-wrap items-center gap-2'>
                <Pill>
                  <Shield className='mr-1 h-4 w-4' /> {meta.role || '—'}
                </Pill>
                {state.phone && (
                  <Pill className='text-[#6B7280]'>
                    <Phone className='mr-1 h-4 w-4' />
                    <span> {state.countryCode.dial_code} {state.phone.replace(/^\+/, '')}</span>
                  </Pill>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className='mx-6 my-5 h-px bg-[#EDEDED]' />

      <div className='px-6 pb-6'>
        {loading ? (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <SkeletonLine w='w-24' />
              <SkeletonLine w='w-28' />
            </div>
            <div className='flex items-center justify-between'>
              <SkeletonLine w='w-28' />
              <SkeletonLine w='w-32' />
            </div>
            <div className='flex items-center justify-between'>
              <SkeletonLine w='w-28' />
              <SkeletonLine w='w-24' />
            </div>
          </div>
        ) : (
          <ul className='space-y-4 text-[#292D32] text-sm sm:text-base'>
            <li className='flex items-center justify-between gap-2'>
              <span className='inline-flex items-center gap-2 text-[#6B7280] shrink-0'>
                <MapPin className='h-4 w-4' /> {t('from')}
              </span>
              <span className='font-semibold break-words max-lg:break-all'>{state?.country?.name || '—'}</span>
            </li>
            <li className='flex items-center justify-between gap-2'>
              <span className='inline-flex items-center gap-2 text-[#6B7280] shrink-0'>
                <CalendarDays className='h-4 w-4' /> {t('memberSince')}
              </span>
              <span className='font-semibold break-words max-lg:break-all'>{meta.memberSince || '—'}</span>
            </li>
            <li className='flex items-center justify-between gap-2'>
              <span className='inline-flex items-center gap-2 text-[#6B7280] shrink-0'>
                <Info className='h-4 w-4' /> {t('lastLogin')}
              </span>
              <span className='font-semibold break-words max-lg:break-all'>{meta.lastLogin || '—'}</span>
            </li>
            <li className='flex items-center justify-between gap-2'>
              <span className='inline-flex items-center gap-2 text-[#6B7280] shrink-0'>{t('referralCode')}</span>
              <span className='inline-flex items-center gap-2'>
                <span className='font-semibold break-words max-lg:break-all'>{meta.referralCode || '—'}</span>
                {meta.referralCode ? (
                  <button onClick={onCopyReferral} className='cursor-pointer hover:scale-[1.1] duration-300 hover:bg-gray-100 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#EDEDED]'>
                    <Copy className='  h-4 w-4' />
                  </button>
                ) : null}
              </span>
            </li>
            <li className='flex items-center justify-between gap-2'>
              <span className='inline-flex items-center gap-2 text-[#6B7280] shrink-0'>{t('referralStats')}</span>
              <span className='font-semibold break-words max-lg:break-all'>
                {meta.referralCount ?? 0} {t('referrals')}
              </span>
            </li>
            {meta.referredBy ? (
              <li className='flex items-center justify-between gap-2'>
                <span className='inline-flex items-center gap-2 text-[#6B7280] shrink-0'>{t('referredBy')}</span>
                <span className='font-semibold break-words max-lg:break-all'>@{meta.referredBy.username}</span>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------- About editor ------------------------------- */
function AboutCard({ loading, about, setAbout, onSaveAuthProfile }) {
  const t = useTranslations('Profile.page');
  const [prefText, setPrefText] = useState(JSON.stringify(about.preferences || {}, null, 2));
  const [prefError, setPrefError] = useState('');

  useEffect(() => {
    setPrefText(JSON.stringify(about.preferences || {}, null, 2));
  }, [about.preferences]);

  function parsePrefs() {
    try {
      const obj = prefText.trim() ? JSON.parse(prefText) : {};
      setPrefError('');
      setAbout(a => ({ ...a, preferences: obj }));
    } catch {
      setPrefError(t('invalidJSON'));
    }
  }

  return (
    <Card className='p-6 sm:p-7'>
      {loading ? (
        <>
          <SkeletonLine w='w-36' />
          <div className='mt-4 space-y-3'>
            <SkeletonLine />
            <SkeletonLine w='w-4/5' />
            <SkeletonLine w='w-3/5' />
          </div>
          <Divider className='!my-4' />
          <BlockSkeleton />
        </>
      ) : (
        <>
          {/* Seller Settings */}
          <section className='space-y-3'>
            <h4 className='text-sm font-semibold flex items-center gap-2'>
              <Settings2 className='h-4 w-4' /> {t('sellerSettings')}
            </h4>
            <div className='grid gap-3 md:grid-cols-2'>
              <Input label={t('deliveryTime')} value={about.deliveryTime || ''} onChange={e => setAbout(a => ({ ...a, deliveryTime: e.target.value }))} />
              <Input label={t('responseTime')} type='number' value={about.responseTime ?? ''} onChange={e => setAbout(a => ({ ...a, responseTime: Number(e.target.value) || null }))} />
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              <Input label={t('ageGroup')} value={about.ageGroup || ''} onChange={e => setAbout(a => ({ ...a, ageGroup: e.target.value }))} />
              <Input label={t('revisions')} type='number' value={about.revisions ?? 0} onChange={e => setAbout(a => ({ ...a, revisions: Number(e.target.value) || 0 }))} />
              <Input label={t('sellerLevel')} value={about.sellerLevel || ''} onChange={e => setAbout(a => ({ ...a, sellerLevel: e.target.value }))} />
            </div>
          </section>

          <Divider className='!my-4' />

          {/* Financials */}
          <section className='space-y-3'>
            <h4 className='text-sm font-semibold flex items-center gap-2'>
              <DollarSign className='h-4 w-4' /> {t('financials')}
            </h4>
            <div className='grid gap-3 md:grid-cols-3'>
              <Input label={t('balance')} type='number' value={about.balance ?? 0} onChange={e => setAbout(a => ({ ...a, balance: Number(e.target.value) || 0 }))} />
              <Input label={t('totalSpent')} type='number' value={about.totalSpent ?? 0} onChange={e => setAbout(a => ({ ...a, totalSpent: Number(e.target.value) || 0 }))} />
              <Input label={t('totalEarned')} type='number' value={about.totalEarned ?? 0} onChange={e => setAbout(a => ({ ...a, totalEarned: Number(e.target.value) || 0 }))} />
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              <Input label={t('reputationPoints')} type='number' value={about.reputationPoints ?? 0} onChange={e => setAbout(a => ({ ...a, reputationPoints: Number(e.target.value) || 0 }))} />
              <Input label={t('topRatedReadonly')} value={about.topRated ? t('yes') : t('no')} readOnly />
            </div>
            <p className='text-xs text-amber-600 mt-1 inline-flex items-center gap-1'>
              <AlertTriangle className='h-4 w-4' /> If your backend blocks editing of these fields, allow them in your update service.
            </p>
          </section>

          <Divider className='!my-4' />

          {/* Preferences JSON */}
          <section className='space-y-2'>
            <h4 className='text-sm font-semibold'>{t('preferences')}</h4>
            <Textarea rows={8} value={prefText} onChange={e => setPrefText(e.target.value)} onBlur={parsePrefs} />
            {prefError ? <div className='text-sm text-red-600'>{prefError}</div> : null}
          </section>
        </>
      )}
    </Card>
  );
}

/* ------------------------------ Portfolio Editor ---------------------------- */
function PortfolioEditor({ about, setAbout }) {
  const [url, setUrl] = useState('');
  return (
    <>
      <div className='flex gap-2'>
        <Input className='flex-1' placeholder='https://...' value={url} onChange={e => setUrl(e.target.value)} />
        <Button
          color='secondary'
          className='!w-auto !px-3'
          icon={<Plus />}
          onClick={() => {
            if (!url.trim()) return;
            const next = [...(about.portfolioItems || []), { url: url.trim() }];
            setAbout(a => ({ ...a, portfolioItems: next }));
            setUrl('');
          }}
        />
      </div>
      <div className='mt-3 grid grid-cols-1 gap-2'>
        {(about.portfolioItems || []).map((it, i) => (
          <div key={i} className='flex items-center justify-between rounded-xl border border-[#EDEDED] p-2'>
            <a href={resolveUrl(it.url)} className='truncate text-blue-600' target='_blank' rel='noreferrer'>
              {it.url}
            </a>
            <button onClick={() => setAbout(a => ({ ...a, portfolioItems: a.portfolioItems.filter((_, idx) => idx !== i) }))} className='text-red-600'>
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function KPICard({ loading, stats }) {
  const t = useTranslations('Profile.page');
  if (loading) return <BlockSkeleton />;
  if (!stats) return null;
  return (
    <>
      {/* <h3 className='mb-3 text-lg font-semibold'>Seller KPIs</h3> */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard title={t('ordersCompleted')} value={Number(stats.ordersCompleted || 0)} hint={t('allTime')} icon={CheckCircle2} gradient='from-main-500 via-teal-500 to-cyan-400' />
        <StatCard title={t('repeatBuyers')} value={Number(stats.repeatBuyers || 0)} hint={t('uniqueCustomers')} icon={Repeat} gradient='from-sky-500 via-indigo-500 to-violet-500' />
        <StatCard title={t('avgRating')} value={stats.rating > 0 ? `${stats.rating.toFixed(1)} / 5` : '—'}
          hint={stats.rating} icon={Star} gradient='from-amber-400 via-orange-500 to-rose-500' />
        <StatCard
          title={t('responseTime')}
          value={formatResponseTime(stats.responseTime)}
          hint={stats.responseTime ? t('responseTimeAverage') : t('responseTimeNotCalculated')}
          icon={Award}
          gradient="from-fuchsia-500 via-rose-500 to-orange-400"
        />


      </div>
    </>
  );
}


const MAX_IMAGE_SIZE_MB = 15;
const MAX_VIDEO_SIZE_MB = 200;
const IMG_RE = /^image\/(jpeg|png|jpg|gif|webp|svg\+xml)$/;
const VID_RE = /^video\/(mp4|quicktime|x-matroska|webm|x-msvideo)$/;

function Assets({
  initialVideoUrl = '',
  initialImages = [], // array of URLs
  onVideoChange, // (url) => void
  onImagesChange, // (urls[]) => void
}) {
  const t = useTranslations('Profile.page');
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '');
  const [videoDeleting, setDeletingVideo] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0); // Add this

  const [imgs, setImgs] = useState((initialImages || []).slice(0, 6).map((u, i) => ({ id: `init-${i}`, url: u, uploading: false })));
  const [imgUploadingCount, setImgUploadingCount] = useState(0);

  const videoInputRef = useRef(null);
  const imgInputRef = useRef(null);

  useEffect(() => {
    setVideoUrl(initialVideoUrl);
  }, [initialVideoUrl]);

  useEffect(() => {
    setImgs(initialImages.map((u, i) => ({ id: `init-${i}`, url: u, uploading: false })));
  }, [initialImages]);

  // ---------- Video handlers ----------
  const handlePickVideo = () => videoInputRef.current?.click();

  const handleVideoSelected = async e => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!VID_RE.test(file.type)) {
      toast.error('Only video files are allowed.');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }
    setVideoUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/auth/video', form, {
        timeout: uploadTimeout,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => {
          console.log('Video upload progress:', ev);
          if (ev.total) {
            const progress = Math.round((ev.loaded / ev.total) * 100);
            setVideoUploadProgress(progress);
          }

        },
      });

      setVideoUrl(data.url);
    } catch (err) {
      console.log("code: ", err.code)
      console.error(err);
      toast.error('Failed to upload video');
    } finally {
      setVideoUploadProgress(0);
      setVideoUploading(false);
      e.target.value = '';
    }
  };

  const removeVideo = () => setVideoUrl('');

  const handleDeleteVideo = async () => {
    setDeletingVideo(true);
    try {
      await api.delete('/auth/video');
      setVideoUrl('');
    } catch (err) {
      console.error(err);
      toast.error?.('Delete failed');
    } finally {
      setDeletingVideo(false);
    }
  };

  // ---------- Images handlers ----------
  const handlePickImages = () => imgInputRef.current?.click();

  const handleImagesSelected = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (!IMG_RE.test(file.type)) {
        toast.error('Only image files are allowed.');
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`Each image must be under ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
    }

    const remainingSlots = Math.max(0, 6 - imgs.length);
    const toUpload = files.slice(0, remainingSlots);
    if (!toUpload.length) {
      e.target.value = '';
      return;
    }

    // Add placeholders
    const tempItems = toUpload.map((f, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      url: '',
      uploading: true,
      _file: f,
    }));
    setImgs(prev => [...prev, ...tempItems]);
    setImgUploadingCount(c => c + tempItems.length);

    try {
      // ✅ one request, field name must be "files"
      const form = new FormData();
      toUpload.forEach(f => form.append('files', f));

      const { data } = await api.post('/auth/images', form, {
        timeout: fileTimeout,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const returnedUrls = Array.isArray(data?.urls) ? data.urls : [];
      // Map returned URLs to temp items by index
      const uploaded = tempItems.map((t, i) => ({
        id: t.id,
        url: returnedUrls[i] || '', // if mismatch, keep empty so it gets filtered below
        uploading: false,
      }));

      setImgs(prev => {
        // replace placeholders with uploaded results
        const replaced = prev.map(item => {
          const idx = tempItems.findIndex(t => t.id === item.id);
          if (idx !== -1) return uploaded[idx];
          return item;
        });

        // drop any failed ones (no url)
        const cleaned = replaced.filter(it => !(it.uploading === false && !it.url));

        // hard cap at 6
        return cleaned.slice(0, 6);
      });
    } catch (err) {
      console.error(err);
      // drop failed placeholders
      setImgs(prev => prev.filter(i => !i.uploading));
    } finally {
      setImgUploadingCount(0);
      e.target.value = '';
    }
  };

  const [removingIds, setRemovingIds] = useState(new Set()); // ids currently deleting

  const removeImage = async id => {
    const item = imgs.find(i => i.id === id);
    if (!item) return;

    setRemovingIds(prev => new Set(prev).add(id)); // mark this one as removing
    try {
      await api.delete('/auth/image', { data: { url: item.url } }); // or your /auth/image
      setImgs(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
      // toast.error?.('Failed to remove image');
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className=' '>
      {/* Intro video card */}
      <Card className='relative p-4 sm:p-5 '>
        <div className='flex  flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-semibold text-black'>{t('introVideo')}</h2>
            <p className='mt-2 text-lg text-black/70 break-words'>{t('introVideoSubtitle')}</p>
          </div>

          <Button className='sm:!w-fit' loading={videoUploading || videoDeleting} name={videoUploading ? t('uploading') : videoUrl ? t('replaceVideo') : t('uploadVideo')} icon={<Plus size={18} />} onClick={handlePickVideo} disabled={videoUploading || videoDeleting} />
        </div>

        {/* Video preview / skeleton */}
        <div className='mt-5'>
          {videoUploading || videoDeleting ? (
            <div className='space-y-3'>
              <div className='aspect-video w-full rounded-2xl bg-slate-200 animate-pulse' />

              {/* Progress Bar */}
              {videoUploading && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-slate-700'>{t('uploading')}</span>
                    <span className='text-sm font-semibold text-main-600'>{videoUploadProgress}%</span>
                  </div>
                  <div className='w-full h-3 bg-slate-200 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-gradient-to-r from-main-500 to-main-600 rounded-full transition-all duration-500 ease-out'
                      style={{ width: `${videoUploadProgress}%` }}
                      aria-valuenow={videoUploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      role='progressbar'
                    />
                  </div>
                </div>
              )}
            </div>
          ) : videoUrl ? (
            <div className='relative'>
              <video src={resolveUrl(videoUrl)} controls className='aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black' />
              <button onClick={handleDeleteVideo} disabled={videoUploading || videoDeleting} className='absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75' aria-label='Remove video'>
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          ) : (
            <div>


              <button type='button' onClick={handlePickVideo} className='group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-10 text-slate-600 hover:bg-slate-100'>
                <Video className='h-5 w-5' />
                <span className='font-medium'>{t('uploadIntroVideo')}</span>
              </button>
              <div className='mt-3 text-xs text-slate-500'>
                {t('maxSize', { size: MAX_VIDEO_SIZE_MB })}
              </div>
            </div>
          )}
        </div>

        <input ref={videoInputRef} type='file' accept='video/*' className='hidden' onChange={handleVideoSelected} />
      </Card>

      <Card className=' p-4 sm:p-5 mt-8 '>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h3 className='text-xl font-semibold text-black'>{t('portfolio')}</h3>
            {/* <p className='text-sm text-slate-600'>{t('addImagesSubtitle')}</p> */}
          </div>

          <Button className='sm:!w-fit' name={t('addImages')} icon={<Plus size={18} />} onClick={handlePickImages} disabled={imgs.length >= 6} />
        </div>

        <input ref={imgInputRef} type='file' accept='image/*' multiple className='hidden' onChange={handleImagesSelected} />

        {/* Grid */}
        <div className='mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4'>
          {imgs.map(item => {
            const isRemoving = removingIds.has(item.id);
            return (
              <figure key={item.id} className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${isRemoving ? 'opacity-70' : ''}`}>
                {item.uploading ? (
                  <div className='aspect-[16/11] w-full animate-pulse bg-slate-200' />
                ) : (
                  <>
                    <img src={resolveUrl(item.url)} alt='Portfolio' className='aspect-[16/11] w-full object-cover' />

                    <button onClick={() => removeImage(item.id)} disabled={isRemoving} className='absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-60' aria-label='Remove image'>
                      <X className='h-4 w-4' />
                    </button>
                  </>
                )}

                {/* removal overlay */}
                {isRemoving && (
                  <div className='absolute inset-0 grid place-items-center bg-black/30'>
                    <Loader2 className='h-6 w-6 animate-spin text-white' />
                  </div>
                )}
              </figure>
            );
          })}

          {imgs.length < 6 && (
            <button type='button' onClick={handlePickImages} className='group grid aspect-[16/11] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100'>
              <span className='flex flex-col items-center text-main-600'>
                <Upload className='h-5 w-5' />
                <span className='mt-1 text-sm font-medium'>{t('upload')}</span>
              </span>
            </button>
          )}
        </div>

        {/* Counter / helper */}
        <div className='mt-3 text-xs text-slate-500'>
          {imgs.length}/6 {t('images')} {imgUploadingCount > 0 && `• ${t('uploadingCount', { count: imgUploadingCount })}`}
        </div>
      </Card>
    </div>
  );
}



function filenameFromUrl(u) {
  try {
    const x = u.split('?')[0];
    return x.substring(x.lastIndexOf('/') + 1) || 'file';
  } catch {
    return 'file';
  }
}

const MAX_PORTFOLIO_SIZE_MB = 25;
// Allow common document types
const DOC_RE = /^(application\/pdf|text\/plain|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-powerpoint|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation)$/i;

function PortfolioFileBox({
  initialPortfolio = '',
  onChange, // (url: string) => void
}) {
  const t = useTranslations('Profile.page');
  const [fileUrl, setFileUrl] = useState(initialPortfolio?.url || '');
  const [filename, setFilename] = useState(initialPortfolio?.filename || '');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef(null);

  // keep in sync if parent updates
  useEffect(() => {
    setFileUrl(initialPortfolio?.url || '')
    setFilename(initialPortfolio?.filename || '')
  }, [initialPortfolio]);

  const pickFile = () => inputRef.current?.click();

  const handleSelected = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isAllowedType = DOC_RE.test(file.type);
    const isTooLarge = file.size > MAX_PORTFOLIO_SIZE_MB * 1024 * 1024;

    if (!isAllowedType) {
      toast.error('Unsupported file type. Please upload PDF, TXT, DOC, DOCX, XLS, XLSX, PPT, or PPTX.');
      return;
    }

    if (isTooLarge) {
      toast.error(`File size must be under ${MAX_PORTFOLIO_SIZE_MB}MB.`);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file); // field name must be "file"
      const { data } = await api.post('/auth/portfolio-file', form, {
        timeout: fileTimeout,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFileUrl(data.url);
      setFilename(data.filename);
    } catch (err) {
      console.error(err);
      // toast.error?.('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!fileUrl) return;
    setDeleting(true);
    try {
      await api.delete('/auth/portfolio-file', { data: { url: fileUrl } });
      setFileUrl('');
      setFilename('');
    } catch (err) {
      console.error(err);
      toast.error?.('Delete failed');
    } finally {
      setDeleting(false);
    }
  };



  const hasFile = !!fileUrl;

  return (
    <Card className='p-4 sm:p-5 mt-8'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h3 className='text-xl font-semibold text-black'>{t('portfolioFile')}</h3>
          <p className='text-sm text-slate-600'>{t('portfolioFileSubtitle')}</p>
        </div>

        <Button className='sm:!w-fit' name={uploading ? t('uploading') : hasFile ? t('replaceFile') : t('uploadFile')}
          icon={uploading ? <Loader2 className='h-4 w-4 animate-spin' /> : hasFile ? <UploadCloud className='h-4 w-4' /> : <UploadCloud className='h-4 w-4' />} onClick={pickFile} disabled={uploading || deleting} loading={uploading} />

        <input ref={inputRef} type='file' accept='.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' className='hidden' onChange={handleSelected} />
      </div>

      {/* Preview / state */}
      <div className='mt-4'>
        {uploading && !hasFile ? (
          <div className='h-14 w-full rounded-xl bg-slate-200 animate-pulse' />
        ) : hasFile ? (
          <div className='relative flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3'>
            <a href={resolveUrl(fileUrl)} target='_blank' rel='noreferrer' className='flex items-center  gap-3 text-slate-800 hover:underline  flex-1 min-w-0' title={resolveUrl(fileUrl)}>
              <FileText className='h-5 w-5' />
              <span className='truncate text-ellipsis flex-1 min-w-0'>{filename}</span>
            </a>

            <Button className='!w-fit' color='red' name={deleting ? t('deleting') : t('delete')} icon={deleting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />} onClick={handleDelete} loading={deleting || uploading} />

            {/* overlay while deleting */}
            {deleting && <div className='absolute inset-0 grid place-items-center rounded-xl bg-black/10 pointer-events-none' />}
          </div>
        ) : (
          <div onClick={pickFile} className='cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500'>{t('noFileUploaded')}</div>
        )}
      </div>
    </Card>
  );
}

const defaultCountryCode = { code: 'SA', dial_code: '+966' };
/* ------------------------------------ Page ---------------------------------- */
export default function Overview() {
  const t = useTranslations('Profile.page');
  const [dirty, setDirty] = useState(false);
  const baselineRef = useRef(null); // holds the "last saved" snapshot
  const [reverting, setReverting] = useState(false); // optional spinner on revert
  const { user, setCurrentUser, loadingUser: loading } = useAuth();
  const id = user?.id;
  const [saving, setSaving] = useState(false);

  // unified editable state per your requested shape
  const [state, setState] = useState({
    username: '',
    email: '',
    password: '', // optional new field for changing password
    type: '', // 'Business' | 'Individual'
    countryCode: defaultCountryCode,
    phone: '',
    profileImage: '',
    role: '',
    status: '',
    lastLogin: '',
    ownerType: '',
    description: '',
    languages: [],
    country: {},
    countryId: '',
    sellerLevel: '',
    skills: [],
    education: [],
    certifications: [],
    introVideoUrl: '',
    portfolioItems: [],
    portfolioFile: null,
    responseTime: null,
    deliveryTime: '',
    ageGroup: '',
    revisions: 0,
    preferences: {},
    balance: 0,
    totalSpent: 0,
    totalEarned: 0,
    reputationPoints: 0,
    rating: 0,
    topRated: false, // derived
  });

  const [meta, setMeta] = useState({
    memberSince: '',
    referralCode: '',
    referralCount: 0,
    referralRewardsCount: 0,
    referredBy: null,
  });

  const [devices, setDevices] = useState([]);
  const [stats] = useState(null);
  const [editing, setEditing] = useState(false);


  const accountTypeOptions = useMemo(
    () => [
      {
        id: 'Business',
        name: t('accountTypes.business').trim()
      },
      {
        id: 'Individual',
        name: t('accountTypes.individual').trim()
      },
    ],
    [t], // Re-run when the translation function changes (language switch)
  );
  /* ------------------------------- Load data -------------------------------- */
  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      if (!id) return;

      try {

        // map API → editable state
        setState(s => ({
          ...s,
          username: user.username || '',
          email: user.email || '',
          type: user.type || '',
          countryCode: user.countryCode || defaultCountryCode,
          phone: user.phone || '',
          profileImage: user.profileImage || '',
          role: user.role || '',
          status: user.status || '',
          lastLogin: user.lastLogin || '',
          ownerType: user.ownerType || '',
          description: user.description || '',
          languages: user.languages || [],
          countryId: user.countryId || null,
          country: user.country || '',
          sellerLevel: user.sellerLevel || '',
          skills: user.skills || [],
          education: Array.isArray(user.education) ? user.education : [],
          certifications: Array.isArray(user.certifications) ? user.certifications : [],
          introVideoUrl: user.introVideoUrl || '',
          portfolioItems: user.portfolioItems || [],
          portfolioFile: user.portfolioFile || null,
          responseTime: user.responseTime ?? null,
          deliveryTime: user.deliveryTime || '',
          ageGroup: user.ageGroup || '',
          revisions: user.revisions ?? 0,
          preferences: user.preferences || {},
          balance: Number(user.balance ?? 0),
          totalSpent: Number(user.totalSpent ?? 0),
          totalEarned: Number(user.totalEarned ?? 0),
          reputationPoints: Number(user.reputationPoints ?? 0),
          ordersCompleted: Number(user?.ordersCompleted) || 0,
          repeatBuyers: Number(user?.repeatBuyers) || 0,
          rating: Number(user?.rating) || 0,
          responseTime: Number(user?.responseTime),
          topRated: user.topRated, // derived
        }));

        setMeta({
          memberSince: user.memberSince ? toDateShort(user.memberSince) : '',
          referralCode: user.referralCode || '',
          referralCount: user.referralCount ?? 0,
          referralRewardsCount: user.referralRewardsCount ?? 0,
          referredBy: user.referredBy || null,
        });

        setDevices(user.devices || []);

        // Immediately after setState(...) that fills all fields from `user`:
        const nextEditable = pickEditable({
          ...state, // old not used, safe to build from `user` directly
          username: user.username || '',
          email: user.email || '',
          password: '', // never baseline a password
          type: user.type || '',
          countryCode: user.countryCode || defaultCountryCode,
          phone: user.phone || '',
          profileImage: user.profileImage || '',
          role: user.role || '',
          status: user.status || '',
          ownerType: user.ownerType || '',
          description: user.description || '',
          languages: user.languages || [],
          countryId: user.countryId || null,
          sellerLevel: user.sellerLevel || '',
          skills: user.skills || [],
          education: Array.isArray(user.education) ? user.education : [],
          certifications: Array.isArray(user.certifications) ? user.certifications : [],
          introVideoUrl: user.introVideoUrl || '',
          portfolioItems: user.portfolioItems || [],
          portfolioFile: user.portfolioFile || null,
          responseTime: user.responseTime ?? null,
          deliveryTime: user.deliveryTime || '',
          ageGroup: user.ageGroup || '',
          revisions: user.revisions ?? 0,
          preferences: user.preferences || {},
          balance: Number(user.balance ?? 0),
          totalSpent: Number(user.totalSpent ?? 0),
          totalEarned: Number(user.totalEarned ?? 0),
          reputationPoints: Number(user.reputationPoints ?? 0),
        });

        baselineRef.current = stableStringify(nextEditable);
        setDirty(false);

      } catch (err) {
        console.error(err);
      }
    }


    if (id) {
      fetchUser();
    }
    return () => {
      ignore = true;
    };
  }, [id]);


  useEffect(() => {
    if (loading || reverting) return;

    const current = stableStringify(pickEditable(state));

    setDirty(baselineRef.current != null && current !== baselineRef.current);
  }, [state, loading, reverting]);

  // warn if navigating away with unsaved changes
  useEffect(() => {
    const handler = e => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Ctrl/Cmd + S quick save
  useEffect(() => {
    const onKey = e => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 's') {
        if (dirty) {
          e.preventDefault();
          saveAuthProfile();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty]);

  /* ------------------------------- Save handler ----------------------------- */
  async function saveAuthProfile() {
    if (hasError) return;
    let toastId;
    setSaving(true);
    try {
      const payload = {
        profileImage: state.profileImage,
        username: state.username?.trim(),
        countryCode: state.countryCode,
        phone: state.phone,
        description: state.description?.trim(),
        languages: state.languages,
        skills: state.skills,
        education: state.education,
        certifications: state.certifications,
        countryId: state.countryId,
        type: state.type,

      };
      toastId = toast.loading(t('savingProfile'));

      const res = await api.put('/auth/profile', payload);

      toast.success(t('profileUpdated'), { id: toastId });


      setCurrentUser(prev => ({
        ...prev,
        ...res.data,
        relatedUsers: prev?.relatedUsers || [], // keep previous relatedUsers
      }));


      // refresh minimal meta from server if you want
      // const refreshed = await api.get(`/auth/user/${id}`).then(r => r.data);
      // setMeta(m => ({
      //   ...m,
      //   memberSince: refreshed.memberSince ? toDateShort(refreshed.memberSince) : m.memberSince,
      //   referralCode: refreshed.referralCode || m.referralCode,
      //   referralCount: refreshed.referralCount ?? m.referralCount,
      //   referralRewardsCount: refreshed.referralRewardsCount ?? m.referralRewardsCount,
      //   referredBy: refreshed.referredBy || m.referredBy,
      // }));

      baselineRef.current = stableStringify(pickEditable(state));
      setDirty(false);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || t('profileUpdateFailed'),
        { id: toastId }
      );
    } finally {
      setSaving(false);
    }
  }

  /* --------------------------- Education/Cert modals ------------------------ */
  const onRemoveEducation = idx => setState(a => ({ ...a, education: a.education.filter((_, i) => i !== idx) }));
  const onRemoveCertification = idx => setState(a => ({ ...a, certifications: a.certifications.filter((_, i) => i !== idx) }));
  const [hasError, setHasError] = useState(false);
  return (
    <div className='container !py-8'>
      <div className='gap-6 flex flex-col lg:flex-row'>
        <div className='lg:sticky lg:top-30  space-y-6 w-full lg:w-[350px] xl:w-[400px]'>
          <ProfileCard
            loading={loading}
            editing={editing}
            setEditing={setEditing}
            state={state}
            setState={setState}
            onError={setHasError}
            meta={{
              role: state.role,
              status: state.status,
              memberSince: meta.memberSince,
              lastLogin: state.lastLogin ? toDate(state.lastLogin) : '—',
              referralCode: meta.referralCode,
              referralCount: meta.referralCount,
              referralRewardsCount: meta.referralRewardsCount,
              referredBy: meta.referredBy,
              topRated: state.topRated,
            }}
            onCopyReferral={async () => {
              if (meta.referralCode) {
                await navigator.clipboard.writeText(meta.referralCode);
                toast.success(t('referralCodeCopied'));
              } else {
                toast.error(t('noReferralCode'));
              }
            }}
          />

          <AccountVerificationCard
            loading={loading}
            user={user}
          />

          {/* {!loading && (
            <div className='flex items-center justify-end gap-3'>
              <Button color='secondary' name='Cancel' onClick={() => window.location.reload()} className='!w-auto !px-4' />
              <Button color='green' name={saving ? '' : 'Save changes'} loading={saving} onClick={saveAuthProfile} className='!w-auto !px-5' />
            </div>
          )} */}
        </div>

        <div className='space-y-6 flex-1  h-fit'>
          <KPICard
            loading={loading}
            stats={{
              ordersCompleted: state?.ordersCompleted || 0,
              repeatBuyers: state?.repeatBuyers || 0,
              rating: state?.rating || 0,
              responseTime: state?.responseTime,
            }}
          />

          <InfoCard
            loading={loading}
            about={{
              description: state.description,
              languages: state.languages,
              skills: state.skills,
              education: state.education,
              certifications: state.certifications,
              introVideoUrl: state.introVideoUrl,
              portfolioItems: state.portfolioItems,
              portfolioFile: state.portfolioFile,
              countryId: state.countryId,
              type: state.type,
              responseTime: state.responseTime,
              deliveryTime: state.deliveryTime,
              ageGroup: state.ageGroup,
              revisions: state.revisions,
              sellerLevel: state.sellerLevel,
              preferences: state.preferences,
              balance: state.balance,
              totalSpent: state.totalSpent,
              totalEarned: state.totalEarned,
              reputationPoints: state.reputationPoints,
              topRated: state.topRated,
            }}
            setAbout={updater => {
              setState(prev => ({ ...prev, ...(typeof updater === 'function' ? updater(prev) : updater) }));
            }}
            onRemoveEducation={onRemoveEducation}
            onRemoveCertification={onRemoveCertification}
            onCountryChange={id => setState(s => ({ ...s, countryId: id }))}
            accountTypeOptions={accountTypeOptions}
            onTypeChange={t => setState(s => ({ ...s, type: t }))}
          />

          {/* <Assets initialVideoUrl={state.introVideoUrl} initialImages={(state.portfolioItems || []).slice(0, 6).map(it => (typeof it === 'string' ? it : it?.url))} onVideoChange={url => setState(s => ({ ...s, introVideoUrl: url }))} onImagesChange={urls => setState(s => ({ ...s, portfolioItems: urls }))} />
          <PortfolioFileBox initialPortfolio={state?.portfolioFile || null} /> */}
        </div>

        {/* Bottom Save Drawer */}
        <div className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ${dirty ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className='mx-auto mb-4 w-[min(960px,92%)] rounded-2xl border border-main-200 bg-white/95 shadow-[0_20px_40px_rgba(0,0,0,0.12)] backdrop-blur'>
            <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='mt-[2px] h-5 w-5 text-amber-600' />
                <div>
                  <div className='font-semibold'>{t('unsavedChanges')}</div>
                  <div className='text-sm text-slate-600'>{t('unsavedChangesDesc')}</div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  color='secondary'
                  name={t('discard')}
                  onClick={() => {
                    if (baselineRef.current) {
                      setReverting(true);
                      try {
                        const parsed = JSON.parse(baselineRef.current);
                        // restore snapshot
                        setState(prev => ({ ...prev, ...parsed, password: '' })); // never restore password
                      } finally {
                        setTimeout(() => {
                          setReverting(false);
                        }, 0);
                      }
                    } else {
                      window.location.reload();
                    }
                  }}
                  className='!w-auto !px-4'
                />
                <Button color='green' name={saving ? '' : t('saveChanges')} loading={saving} onClick={saveAuthProfile} className='!w-auto !px-5' disabled={hasError} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Unsaved changes helpers --------------------------- */
function stableStringify(obj) {
  // deterministically sort keys so deep equality via string compare is reliable
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object') {
      if (seen.has(value)) return; // avoid cycles
      seen.add(value);
      if (!Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce((acc, k) => {
            acc[k] = value[k];
            return acc;
          }, {});
      }
    }
    return value;
  });
}

function pickEditable(state) {
  // only fields you actually send to the backend (payload)
  const { countryCode, username, type, phone, profileImage, role, status, ownerType, description, languages, countryId, sellerLevel, skills, education, certifications, introVideoUrl, portfolioItems, portfolioFile } = state;
  return {
    username: username?.trim(),
    type,
    phone,
    countryCode,
    profileImage,
    role,
    status,
    ownerType,
    description: description?.trim(),
    languages,
    countryId,
    sellerLevel,
    skills,
    education,
    certifications,
    introVideoUrl,
    portfolioItems,
    portfolioFile
  };
}
