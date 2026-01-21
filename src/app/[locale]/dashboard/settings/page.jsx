'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, RefreshCw, DollarSign, Shield, Globe, Mail, Phone, Image as ImageIcon, Wallet, Info, Share2, Percent } from 'lucide-react';

import api from '@/lib/axios';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Textarea from '@/components/atoms/Textarea';
import z from 'zod';
import FormErrorMessage from '@/components/atoms/FormErrorMessage';
import { resolveImageUrl, resolveUrl } from '@/utils/helper';
import { useTranslations } from 'next-intl';
import { FaFacebook, FaInstagram, FaLinkedin, FaPinterest, FaTiktok, FaTwitter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Currency from '@/components/common/Currency';

const getSettingsSchema = (t) => z.object({
  contactEmail: z
    .email(t('validation.emailInvalid')),

  platformPercent: z
    .coerce
    .number()
    .min(0, t('validation.platformFeeMin')),
  sellerServiceFee: z
    .coerce
    .number()
    .min(0, t('validation.serviceFeeMin'))
    .max(100, t('validation.serviceFeeMax')),

  siteLogo: z
    .string()
    .refine(
      (val) =>
        // absolute http or https URL
        /^https?:\/\/.+/.test(val) ||
        // relative uploads path
        /^\/uploads\/.+/.test(val),
      t('validation.logoInvalid')
    ),

});

const MODULE = 'settings';

/* ----------------------------- CRUD shim ----------------------------- */
const useCrud = () => {
  const CRUD = api?.crud || api?.CURD;
  return {
    getOne: () => (CRUD ? CRUD.get(MODULE) : api.get(`/${MODULE}`)),
    update: payload => (CRUD ? CRUD.update(MODULE, payload) : api.put(`/${MODULE}`, payload)),
  };
};

/* ----------------------------- Helpers ------------------------------- */
const numberOnly = v => String(v || '').replace(/[^\d]/g, '');
const countWords = (str = '') => (str.trim() ? str.trim().split(/\s+/).length : 0);

/* --------- Small reusable editor for number-array chips (IDs) -------- */
function IdChipsEditor({ label, hint, value = [], onChange, icon }) {
  const [draft, setDraft] = useState('');
  const items = Array.isArray(value) ? value : [];

  const add = () => {
    const clean = numberOnly(draft);
    if (!clean) return;
    const n = parseInt(clean, 10);
    if (!Number.isNaN(n) && !items.includes(n)) {
      onChange([...items, n]);
      setDraft('');
    }
  };
  const remove = n => onChange(items.filter(x => x !== n));

  return (
    <div>
      <label className='mb-1 flex items-center gap-2 text-sm font-medium text-slate-700'>
        {icon}
        {label}
        <span className='ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600'>{items.length}</span>
      </label>
      {hint ? <div className='mb-2 text-xs text-slate-500'>{hint}</div> : null}
      <div className='flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2'>
        {items.length === 0 ? (
          <span className='text-xs text-slate-400'>No IDs yet</span>
        ) : (
          items.map(n => (
            <span key={n} className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-700'>
              #{n}
              <button onClick={() => remove(n)} className='rounded bg-white/70 px-1 text-[11px] text-slate-500 hover:bg-white hover:text-red-600' title='Remove'>
                ×
              </button>
            </span>
          ))
        )}
        <div className='ml-auto flex w-48 items-center gap-2'>
          <Input value={draft} onChange={e => setDraft(numberOnly(e.target.value))} placeholder='Add ID (number)' />
          <Button className='px-3 py-2 text-sm' onClick={add} name='Add' />
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Logo Uploader --------------------------- */
function LogoUploader({ value, onUploaded, onChangeUrl }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async file => {
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      // adjust if your upload endpoint differs(e.g. / assets / upload, /uploads, etc.)
      const res = await api.post('/settings/uploads/siteLogo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.data?.url || res?.data?.path || res?.data?.location;
      if (url) onUploaded(url);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className='flex items-center gap-3'>
        <label className='relative inline-flex items-center justify-center h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 cursor-pointer'>
          <input type='file' accept='image/*' className='absolute inset-0 opacity-0 cursor-pointer' onChange={e => handleFile(e.target.files?.[0])} />
          {uploading ? (
            <span className='inline-flex items-center'>
              <RefreshCw size={16} className='mr-2 animate-spin' /> Uploading…
            </span>
          ) : (
            <span className='inline-flex items-center'>
              <ImageIcon size={16} className='mr-2' /> Upload Logo
            </span>
          )}
        </label>

        {value ? (
          <img src={resolveUrl(value)} alt='logo preview' className='h-10 w-10 rounded-lg border border-slate-200 object-contain' />
        ) : (
          <div className='grid h-10 w-10 place-items-center rounded-lg border border-dashed border-slate-300 text-slate-400'>
            <ImageIcon size={16} />
          </div>
        )}
      </div>

      <div className='mt-3'>
        <label className='mb-1 block text-xs font-medium text-slate-600'>Or paste image URL</label>
        <Input value={resolveImageUrl(value) || ''} onChange={e => {
          onChangeUrl(e.target.value)
        }} placeholder='/logo.png' iconLeft={<ImageIcon size={16} />} />
      </div>
      <p className='mt-1 text-xs text-slate-500'>PNG/SVG recommended. Square works best.</p>
    </div>
  );
}

/* ------------------------------- Page -------------------------------- */
export default function AdminSettingsDashboard() {
  const t = useTranslations('Dashboard.settings');
  const { getOne, update } = useCrud();

  const [settings, setSettings] = useState({
    // General
    siteName: '',
    siteLogo: '',
    contactEmail: '',
    supportPhone: '',
    // Financial
    platformPercent: 10,
    sellerServiceFee: 10,
    defaultCurrency: 1, // currency ID (int)
    platformAccountUserId: '', // kept (backend needs it); KPI card removed
    // Flags (no affiliate)
    jobsRequireApproval: true,
    // Legal
    privacyPolicy_en: '',
    privacyPolicy_ar: '',
    termsOfService_en: '',
    termsOfService_ar: '',
    sellerFaqs_en: [],
    sellerFaqs_ar: [],
    inviteFaqs_en: [],
    inviteFaqs_ar: [],
    becomeSellerFaqs_en: [],
    becomeSellerFaqs_ar: [],
    // socialLinks
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    pinterest: '',
    tiktok: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [activeFaqTab, setActiveFaqTab] = useState('seller');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await getOne();
      setSettings(prev => ({ ...prev, ...(res?.data || {}) }));
    } catch (e) {
      console.error('Error fetching settings:', e);
      setApiError(e?.response?.data?.message || t('toast.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [getOne]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setApiError(null);
      setSuccessMessage(null);
      const payload = {
        ...settings,
        platformPercent: Number(settings.platformPercent) || 0,
        defaultCurrency: Number(settings.defaultCurrency) || 1,
      };

      // Validate with Zod
      const validated = getSettingsSchema(t).parse(payload);
      setFormErrors(null)

      await update(payload);
      // setSuccessMessage(t('toast.saved'));
      toast.success(t('toast.saved'))
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      if (e instanceof z.ZodError) {
        // Collect errors into a map
        const errors = {};
        e.issues.forEach(err => {
          const field = err.path[0];
          errors[field] = err.message;
        });
        setFormErrors(errors);
      } else {
        console.error("Error saving settings:", e);
        setApiError((e)?.response?.data?.message || t('toast.saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleJobsAutoPublishToggle = async autoPublishEnabled => {
    // Switcher checked = auto-publish; store inverse in jobsRequireApproval
    const next = { jobsRequireApproval: !autoPublishEnabled };
    try {
      setSaving(true);
      setApiError(null);
      setSuccessMessage(null);
      const res = await update(next);
      setSettings(prev => ({ ...prev, ...(res?.data || next) }));
      setSuccessMessage(autoPublishEnabled ? t('toast.autoPublishEnabled') : t('toast.autoPublishDisabled'));
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (e) {
      console.error('Error updating job approval setting:', e);
      setApiError(e?.response?.data?.message || t('toast.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  };

  /* -------------------------- Legal Tabs/Preview -------------------------- */
  const [activeLegalTab, setActiveLegalTab] = useState('privacy'); // 'privacy' | 'terms'
  const [showPreview, setShowPreview] = useState(false);

  const { privacyCharsEn, privacyWordsEn, termsCharsEn, termsWordsEn, privacyCharsAr, privacyWordsAr, termsCharsAr, termsWordsAr } = useMemo(() => {

    const privacyCharsEn = settings.privacyPolicy_en?.length || 0;
    const privacyWordsEn = countWords(settings.privacyPolicy_en);

    const termsCharsEn = settings.termsOfService_en?.length || 0;
    const termsWordsEn = countWords(settings.termsOfService_en);

    const privacyCharsAr = settings.privacyPolicy_ar?.length || 0;
    const privacyWordsAr = countWords(settings.privacyPolicy_ar);

    const termsCharsAr = settings.termsOfService_ar?.length || 0;
    const termsWordsAr = countWords(settings.termsOfService_ar);
    return { privacyCharsEn, privacyWordsEn, termsCharsEn, termsWordsEn, privacyCharsAr, privacyWordsAr, termsCharsAr, termsWordsAr }
  })

  if (loading) {
    return (
      <div>
        <div className='p-6'>
          <div className=''>
            <div className='shimmer mb-6 h-8 w-1/4 rounded bg-slate-200'></div>
            <div className='space-y-4'>
              {[...Array(7)].map((_, i) => (
                <div key={i} className='shimmer h-12 rounded bg-slate-200'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className='min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900'>
      <div className='p-4 sm:p-6'>
        {/* Header */}
        <GlassCard gradient='bg-main-500/60' className='mb-6'>
          <div className='flex max-sm:flex-col items-center justify-between gap-2'>
            <div>
              <h1 className='text-2xl font-bold text-black'>{t('title')}</h1>
              <p className='text-black'> {t('subtitle')}</p>
            </div>
            <Button icon={saving ? <RefreshCw size={16} className='mr-2 animate-spin ' /> : <Save size={16} className='mr-2' />} name={saving ? t('saving') : t('saveSettings')} onClick={handleSave} disabled={saving} className='!w-full sm:!w-fit' />
          </div>
        </GlassCard>

        {/* Alerts */}
        {apiError && <div className='mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800'>{apiError}</div>}
        {successMessage && <div className='mb-6 rounded-md border border-main-200 bg-main-50 px-4 py-3 text-main-800'>{successMessage}</div>}

        {/* KPI Row (No affiliate, no platform wallet KPI) */}
        <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {/* Brand Name */}
          <MetricBadge
            icon={<Globe className='h-4 w-4' />}
            label={t('brandName')}
            value={settings.siteName || '—'}
            intent='neutral'
          />

          {/* Platform Fee Badge */}
          <MetricBadge icon={<Currency style={{ fill: "var(--color-main-600)" }} size={16} />} label={t('platformFee')} value={<div className='flex gap-1 items-center '>
            {Number(settings.platformPercent || 0).toFixed(1)}  <Currency style={{ fill: "var(--color-main-600)" }} size={14} />
          </div>} intent='success' />

          {/* Seller Fee Badge (New) */}
          <MetricBadge
            icon={<Percent size={16} />}
            label={t('serviceFee')}
            value={
              <div className='flex gap-1 items-center'>
                {Number(settings.sellerServiceFee || 0).toFixed(1)}%
              </div>
            }
            intent='success'
          />
        </div>

        {/* Top row: General + Financial */}
        <div className='mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* General */}
          <GlassCard className='p-3 sm:p-6'>
            <div className='mb-4 flex items-center'>
              <Globe size={20} className='mr-2 text-blue-600' />
              <h2 className='text-lg font-semibold'>{t('sections.general')}</h2>
            </div>

            <div className='grid grid-cols-1 gap-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-slate-700'>{t('fields.siteName')}</label>
                <Input value={settings.siteName} onChange={e => updateField('siteName', e.target.value)} placeholder={t('fields.siteNamePlaceholder')} />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-slate-700'>{t('fields.logo')}</label>
                <LogoUploader value={settings.siteLogo} onUploaded={url => updateField('siteLogo', url)} onChangeUrl={url => updateField('siteLogo', url)} />
                {formErrors?.siteLogo && <FormErrorMessage message={formErrors?.siteLogo} />}
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-slate-700'>{t('fields.contactEmail')}</label>
                  <Input error={formErrors?.contactEmail} value={settings.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} placeholder={t('fields.contactEmailPlaceholder')} iconLeft={<Mail size={16} />} />

                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium text-slate-700'>{t('fields.supportPhone')}</label>
                  <Input value={settings.supportPhone} onChange={e => updateField('supportPhone', e.target.value)} placeholder={t('fields.supportPhonePlaceholder')} iconLeft={<Phone size={16} />} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Financial */}
          <GlassCard className='p-3 sm:p-6'>
            <div className='mb-4 flex items-center'>
              <Currency style={{ fill: "#00a63e" }} size={20} />
              <h2 className='text-lg font-semibold'>{t('sections.financial')}</h2>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-1'>
              <div>
                <label className='mb-1 text-sm font-medium text-slate-700 flex items-center gap-1'>{t('fields.platformFee')} (<Currency style={{ fill: "#314158" }} size={14} />)</label>
                <Input type='number' error={formErrors?.platformPercent} value={settings.platformPercent} onChange={e => updateField('platformPercent', parseFloat(e.target.value))} min='0' step='0.1' />
              </div>

              <div>
                <label className='mb-1 text-sm font-medium text-slate-700 flex items-center gap-1'>{t('serviceFee')} (<Percent size={16} />)</label>
                <Input type='number' error={formErrors?.sellerServiceFee} value={settings.sellerServiceFee} onChange={e => updateField('sellerServiceFee', parseFloat(e.target.value))} min='0' max='100' step='0.1' />
              </div>
              {/* 
              <div>
                <label className='mb-1 block text-sm font-medium text-slate-700'>{t('fields.defaultCurrency')}</label>
                <Input type='number' value={settings.defaultCurrency} onChange={e => updateField('defaultCurrency', parseInt(numberOnly(e.target.value), 10) || 1)} min='1' />
              </div> */}
            </div>

            <div className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <label className='mb-1 block text-sm font-medium text-slate-700'>{t('fields.platformWalletOwner')}</label>
              <Input value={settings.platformAccountUserId || ''} onChange={e => updateField('platformAccountUserId', e.target.value)} placeholder={t('fields.platformWalletPlaceholder')} iconLeft={<Wallet size={16} />} />
              <div className='mt-2 flex items-start gap-2 text-xs text-slate-600'>
                <Info className='mt-0.5 h-4 w-4 text-slate-500' />
                <p>
                  {t('fields.platformWalletHint')}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>




        <GlassCard className="p-3 sm:p-6">
          <div className="mb-4 flex items-center">
            <Share2 size={20} className="mr-2 text-blue-600" />
            <h2 className="text-lg font-semibold">{t('sections.socialMedia')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('fields.facebook')}
              </label>
              <Input
                value={settings.facebook || ''}
                onChange={e => updateField('facebook', e.target.value)}
                placeholder={t('fields.facebookPlaceholder')}
                icon={<FaFacebook size={16} />}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('fields.linkedin')}
              </label>
              <Input
                value={settings.linkedin || ''}
                onChange={e => updateField('linkedin', e.target.value)}
                placeholder={t('fields.linkedinPlaceholder')}
                icon={<FaLinkedin size={16} />}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('fields.twitter')}
              </label>
              <Input
                value={settings.twitter || ''}
                onChange={e => updateField('twitter', e.target.value)}
                placeholder={t('fields.twitterPlaceholder')}
                icon={<FaTwitter size={16} />}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('fields.instagram')}
              </label>
              <Input
                value={settings.instagram || ''}
                onChange={e => updateField('instagram', e.target.value)}
                placeholder={t('fields.instagramPlaceholder')}
                icon={<FaInstagram size={16} />}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('fields.pinterest')}
              </label>
              <Input
                value={settings.pinterest || ''}
                onChange={e => updateField('pinterest', e.target.value)}
                placeholder={t('fields.pinterestPlaceholder')}
                icon={<FaPinterest size={16} />}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('fields.tiktok')}
              </label>
              <Input
                value={settings.tiktok || ''}
                onChange={e => updateField('tiktok', e.target.value)}
                placeholder={t('fields.tiktokPlaceholder')}
                icon={<FaTiktok size={16} />}
              />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('fields.socialMediaHint')}
            </label>
            <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
              <Info className="mt-0.5 h-4 w-4 text-slate-500" />
              <p>{t('fields.socialMediaControllerHint')}</p>
            </div>
          </div>
        </GlassCard>

        <div className="my-6 grid grid-cols-1 gap-6">
          <GlassCard className="p-3 sm:p-6">
            {/* Header */}
            <div className="mb-4 flex items-center">
              <Info size={20} className="mr-2 text-teal-600" />
              <h2 className="text-lg font-semibold">{t('faqs')}</h2>
            </div>

            {/* Tabs */}
            <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {[
                { id: 'seller', label: t('fields.sellerFaqs') },
                { id: 'invite', label: t('fields.inviteFaqs') },
                { id: 'becomeSeller', label: t('fields.becomeSellerFaqs') },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFaqTab(tab.id)}
                  className={[
                    'px-3 py-1.5 text-sm rounded-md transition',
                    activeFaqTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {activeFaqTab === 'seller' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FaqsEditor
                  label={t('fields.sellerFaqs_en')}
                  hint={t('fields.sellerFaqsHint_en')}
                  value={settings.sellerFaqs_en}
                  onChange={v => updateField('sellerFaqs_en', v)}
                  icon={<Info size={16} className="text-slate-500" />}
                />

                <FaqsEditor
                  label={t('fields.sellerFaqs_ar')}
                  hint={t('fields.sellerFaqsHint_ar')}
                  value={settings.sellerFaqs_ar}
                  dir="rtl"
                  onChange={v => updateField('sellerFaqs_ar', v)}
                  icon={<Info size={16} className="text-slate-500" />}
                />
              </div>
            )}

            {activeFaqTab === 'invite' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FaqsEditor
                  label={t('fields.inviteFaqs_en')}
                  hint={t('fields.inviteFaqsHint_en')}
                  value={settings.inviteFaqs_en}
                  onChange={v => updateField('inviteFaqs_en', v)}
                  icon={<Info size={16} className="text-slate-500" />}
                />

                <FaqsEditor
                  label={t('fields.inviteFaqs_ar')}
                  hint={t('fields.inviteFaqsHint_ar')}
                  value={settings.inviteFaqs_ar}
                  dir="rtl"
                  onChange={v => updateField('inviteFaqs_ar', v)}
                  icon={<Info size={16} className="text-slate-500" />}
                />
              </div>
            )}

            {activeFaqTab === 'becomeSeller' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FaqsEditor
                  label={t('fields.becomeSellerFaqs_en')}
                  hint={t('fields.becomeSellerFaqsHint_en')}
                  value={settings.becomeSellerFaqs_en}
                  onChange={v => updateField('becomeSellerFaqs_en', v)}
                  icon={<Info size={16} className="text-slate-500" />}
                />

                <FaqsEditor
                  label={t('fields.becomeSellerFaqs_ar')}
                  hint={t('fields.becomeSellerFaqsHint_ar')}
                  value={settings.becomeSellerFaqs_ar}
                  dir="rtl"
                  onChange={v => updateField('becomeSellerFaqs_ar', v)}
                  icon={<Info size={16} className="text-slate-500" />}
                />
              </div>
            )}
          </GlassCard>
        </div>



        {/* Legal & Compliance – Tabs + Preview */}
        <div className='grid grid-cols-1 gap-6 mt-6'>
          <GlassCard className='p-3 sm:p-6'>
            <div className='mb-4 flex items-center'>
              <Shield size={20} className='mr-2 text-amber-600' />
              <h2 className='text-lg font-semibold'>{t('legalCompliance')}</h2>
            </div>

            {/* Tabs */}
            <div className='mb-3 flex max-sm:flex-col items-center justify-between gap-2'>
              <div className='inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1'>
                {[
                  { id: 'privacy', label: t('privacyPolicy') },
                  { id: 'terms', label: t('termsOfService') },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLegalTab(tab.id)}
                    className={[
                      'px-3 py-1.5 text-sm rounded-md',
                      activeLegalTab === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className='flex items-center gap-3'>
                <label className='inline-flex items-center gap-2 text-sm text-slate-600'>
                  <input
                    type='checkbox'
                    className='accent-slate-700'
                    checked={showPreview}
                    onChange={e => setShowPreview(e.target.checked)}
                  />
                  {t('preview')}
                </label>
              </div>
            </div>

            {/* Editors */}
            {activeLegalTab === 'privacy' ? (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* English */}
                <div>
                  <h3 className='text-sm font-medium mb-2'>{t('privacyPolicyEn')}</h3>
                  {!showPreview ? (
                    <>
                      <Textarea
                        value={settings.privacyPolicy_en}
                        onChange={e => updateField('privacyPolicy_en', e.target.value)}
                        rows={12}
                        placeholder={t('privacyPolicyPlaceholder')}
                      />
                      <div className='mt-1 flex items-center justify-between text-[11px] text-slate-500'>
                        <span>
                          {privacyCharsEn} {t('chars')} • {privacyWordsEn} {t('words')}
                        </span>
                        <span>{t('privacyTip')}</span>
                      </div>
                    </>
                  ) : (
                    <PreviewBox text={settings.privacyPolicy_en} />
                  )}
                </div>

                {/* Arabic */}
                <div dir='rtl'>
                  <h3 className='text-sm font-medium mb-2'>{t('privacyPolicyAr')}</h3>
                  {!showPreview ? (
                    <>
                      <Textarea
                        value={settings.privacyPolicy_ar}
                        onChange={e => updateField('privacyPolicy_ar', e.target.value)}
                        rows={12}
                        placeholder={t('privacyPolicyPlaceholderAr')}
                      />
                      <div className='mt-1 flex items-center justify-between text-[11px] text-slate-500'>
                        <span>
                          {privacyCharsAr} {t('chars')} • {privacyWordsAr} {t('words')}
                        </span>
                        <span>{t('privacyTipAr')}</span>
                      </div>
                    </>
                  ) : (
                    <PreviewBox text={settings.privacyPolicy_ar} />
                  )}
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* English */}
                <div>
                  <h3 className='text-sm font-medium mb-2'>{t('termsOfServiceEn')}</h3>
                  {!showPreview ? (
                    <>
                      <Textarea
                        value={settings.termsOfService_en}
                        onChange={e => updateField('termsOfService_en', e.target.value)}
                        rows={12}
                        placeholder={t('termsOfServicePlaceholder')}
                      />
                      <div className='mt-1 flex items-center justify-between text-[11px] text-slate-500'>
                        <span>
                          {termsCharsEn} {t('chars')} • {termsWordsEn} {t('words')}
                        </span>
                        <span>{t('termsTip')}</span>
                      </div>
                    </>
                  ) : (
                    <PreviewBox text={settings.termsOfService_en} />
                  )}
                </div>

                {/* Arabic */}
                <div dir='rtl'>
                  <h3 className='text-sm font-medium mb-2'>{t('termsOfServiceAr')}</h3>
                  {!showPreview ? (
                    <>
                      <Textarea
                        value={settings.termsOfService_ar}
                        onChange={e => updateField('termsOfService_ar', e.target.value)}
                        rows={12}
                        placeholder={t('termsOfServicePlaceholderAr')}
                      />
                      <div className='mt-1 flex items-center justify-between text-[11px] text-slate-500'>
                        <span>
                          {termsCharsAr} {t('chars')} • {termsWordsAr} {t('words')}
                        </span>
                        <span>{t('termsTipAr')}</span>
                      </div>
                    </>
                  ) : (
                    <PreviewBox text={settings.termsOfService_ar} />
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </div>



        {/* Sticky Save */}
        <div className='pointer-events-none sticky bottom-4 mt-6 flex justify-end'>
          <div className='pointer-events-auto rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-lg backdrop-blur'>
            <Button onClick={handleSave} disabled={saving} icon={saving ? <RefreshCw size={16} className='mr-2 animate-spin' /> : <Save size={16} className='mr-2' />} name={saving ? 'Saving...' : 'Save Changes'} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Preview ------------------------------ */
function PreviewBox({ text }) {
  if (!text?.trim()) {
    return <div className='rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500'>Nothing to preview yet.</div>;
  }
  return (
    <div className='prose max-w-none rounded-lg border border-slate-200 bg-white p-4 whitespace-pre-line'>
      {text}
    </div>
  );
}

/* ----------------------------- MetricBadge --------------------------- */
const intentStyles = {
  success: {
    chip: 'bg-main-100 text-main-700',
    value: 'text-main-700',
    ring: 'ring-main-100',
  },
  warn: {
    chip: 'bg-amber-100 text-amber-700',
    value: 'text-amber-700',
    ring: 'ring-amber-100',
  },
  danger: {
    chip: 'bg-rose-100 text-rose-700',
    value: 'text-rose-700',
    ring: 'ring-rose-100',
  },
  info: {
    chip: 'bg-sky-100 text-sky-700',
    value: 'text-sky-700',
    ring: 'ring-sky-100',
  },
  neutral: {
    chip: 'bg-slate-100 text-slate-700',
    value: 'text-slate-900',
    ring: 'ring-slate-100',
  },
};

function MetricBadge({ icon, label, value, hint, intent = 'neutral', size = 'md', className = '', loading = false }) {
  const i = intentStyles[intent] || intentStyles.neutral;
  const isSm = size === 'sm';

  return (
    <div className={['rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1', i.ring, className].join(' ')}>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='mb-1 flex items-center gap-2'>
            <span className={['inline-grid h-8 w-8 place-items-center rounded-xl', i.chip].join(' ')}>
              <span className='grid place-items-center'>{icon}</span>
            </span>
            <span className='truncate text-sm font-medium text-slate-600'>{label}</span>
          </div>

          {loading ? <div className='mt-1 h-6 w-24 animate-pulse rounded bg-slate-200' /> : <div className={['text-2xl font-semibold', i.value].join(' ')}>{value ?? '—'}</div>}

          {hint ? <div className='mt-1 text-xs text-slate-500'>{hint}</div> : null}
        </div>

        {/* {isSm ? null : <div className={['ml-auto hidden items-center gap-2 rounded-full px-2 py-1 text-xs sm:inline-flex', i.chip].join(' ')}>{label}</div>} */}
      </div>
    </div>
  );
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function GlassCard({ children, className, gradient, padding = 'p-4', header, footer, shadow = true, as: Tag = 'div' }) {
  const isGlass = Boolean(gradient);

  if (isGlass) {
    // Glass over gradient
    return (
      <Tag className={cx('relative overflow-hidden rounded-2xl', className)}>
        {/* Gradient background */}
        <div className={cx('pointer-events-none absolute inset-0 bg-gradient-to-r', gradient)} aria-hidden />
        {/* Subtle vignette for depth */}
        <div
          className='pointer-events-none absolute inset-0 opacity-40'
          style={{
            background: 'radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 40%), radial-gradient(100% 100% at 100% 100%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 45%)',
          }}
          aria-hidden
        />

        {/* Glass panel */}
        <div className='relative m-[1px] rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl ring-1 ring-black/5'>
          {header ? <div className={cx('border-b border-white/20/50 px-4 py-3 text-white/90', padding === 'none' ? 'px-4 py-3' : '')}>{header}</div> : null}

          <div className={cx('text-white', padding !== 'none' ? padding : 'p-4')}>{children}</div>

          {footer ? <div className={cx('border-t border-white/20/50 px-4 py-3 text-white/80', padding === 'none' ? 'px-4 py-3' : '')}>{footer}</div> : null}
        </div>
      </Tag>
    );
  }

  // Plain card
  return (
    <Tag className={cx('rounded-2xl border border-slate-200 bg-white', shadow && 'shadow-sm', className)}>
      {header ? <div className={cx('border-b border-slate-200', padding !== 'none' ? padding : 'p-4')}>{header}</div> : null}

      <div className={padding !== 'none' ? padding : 'p-4'}>{children}</div>

      {footer ? <div className={cx('border-t border-slate-200', padding !== 'none' ? padding : 'p-4')}>{footer}</div> : null}
    </Tag>
  );
}

function FaqsEditor({ label, hint, value = [], onChange, icon, dir = 'ltr' }) {
  const [draftQ, setDraftQ] = useState('');
  const [draftA, setDraftA] = useState('');
  const [editIndex, setEditIndex] = useState(null);

  const items = Array.isArray(value) ? value : [];

  const add = () => {
    if (!draftQ.trim() || !draftA.trim()) return;
    onChange([...items, { question: draftQ.trim(), answer: draftA.trim() }]);
    setDraftQ('');
    setDraftA('');
  };

  const remove = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
    if (editIndex === idx) setEditIndex(null);
  };

  const startEdit = (idx) => {
    setEditIndex(idx);
    setDraftQ(items[idx].question);
    setDraftA(items[idx].answer);
  };

  const saveEdit = () => {
    const updated = [...items];
    updated[editIndex] = { question: draftQ.trim(), answer: draftA.trim() };
    onChange(updated);
    setEditIndex(null);
    setDraftQ('');
    setDraftA('');
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setDraftQ('');
    setDraftA('');
  };

  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {label}
        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
          {items.length}
        </span>
      </label>
      {hint ? <div className="mb-2 text-xs text-slate-500">{hint}</div> : null}

      <div className={`${dir === 'rtl' ? 'arabic-font' : 'english-font'} flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 `}>

        {/* List */}
        <div className='flex flex-col gap-2 max-h-64 overflow-y-auto'>
          {items.length === 0 ? (
            <span className="text-xs text-slate-400">{dir === 'rtl' ? 'لا توجد أسئلة شائعة بعد' : 'No FAQs yet'}</span>
          ) : (
            items.map((faq, idx) => {
              const isEditing = editIndex === idx;

              return (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded bg-slate-50 p-2 text-xs text-slate-700"
                >

                  {isEditing ? (
                    <>
                      <div className='flex flex-col gap-2 '
                        dir={dir}>
                        <Input
                          value={draftQ}
                          onChange={(e) => setDraftQ(e.target.value)}
                          placeholder={`${dir === 'rtl' ? 'أضف سؤال' : 'Edit question'}`}
                        />
                        <Input
                          value={draftA}
                          onChange={(e) => setDraftA(e.target.value)}
                          placeholder={`${dir === 'rtl' ? 'أضف إجابة' : 'Edit answer'}`}
                        />
                      </div>

                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="rounded bg-slate-200 px-2 py-1 text-[11px]"
                        >
                          {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          onClick={saveEdit}
                          className="rounded bg-main-600 px-2 py-1 text-[11px] text-white"
                        >
                          {dir === 'rtl' ? 'حفظ' : 'Save'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className='flex flex-col gap-2 ' dir={dir}>

                        <div className="font-semibold">Q: {faq.question}</div>
                        <div>A: {faq.answer}</div>
                      </div>

                      <div className="flex gap-1 self-end">

                        <button
                          onClick={() => startEdit(idx)}
                          className="rounded bg-white/70 px-2 text-[11px] text-blue-600 hover:bg-white"
                          title="Edit"
                        >
                          {dir === 'rtl' ? 'تعديل' : 'Edit'}
                        </button>

                        <button
                          onClick={() => remove(idx)}
                          className="rounded bg-white/70 px-2 text-[11px] text-red-600 hover:bg-white"
                          title="Remove"
                        >
                          ×
                        </button>

                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}

        </div>

        {/* Bottom add form */}
        {editIndex === null && (
          <div className={`flex flex-col gap-2 mt-2 ${dir === 'rtl' ? 'items-end' : ''}`} dir={dir}>
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder={`${dir === 'rtl' ? 'أضف سؤال' : 'Add question'}`}
            />
            <Input
              value={draftA}
              onChange={(e) => setDraftA(e.target.value)}
              placeholder={`${dir === 'rtl' ? 'أضف إجابة' : 'Add answer'}`}
            />
            <Button className="px-3 py-2 text-sm" onClick={add} name={`${dir === 'rtl' ? 'أضف سؤال' : 'Add FAQ'}`} />
          </div>
        )}

      </div>
    </div>
  );
}
