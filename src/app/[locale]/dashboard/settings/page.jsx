'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, RefreshCw, DollarSign, Shield, Globe, Mail, Phone, Image as ImageIcon, Wallet, Info } from 'lucide-react';

import api from '@/lib/axios';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Textarea from '@/components/atoms/Textarea';
import { Switcher } from '@/components/atoms/Switcher';

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
      // adjust if your upload endpoint differs (e.g. /assets/upload, /uploads, etc.)
      const res = await api.post('/uploads', fd, {
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
          <img src={value} alt='logo preview' className='h-10 w-10 rounded-lg border border-slate-200 object-contain' />
        ) : (
          <div className='grid h-10 w-10 place-items-center rounded-lg border border-dashed border-slate-300 text-slate-400'>
            <ImageIcon size={16} />
          </div>
        )}
      </div>

      <div className='mt-3'>
        <label className='mb-1 block text-xs font-medium text-slate-600'>Or paste image URL</label>
        <Input value={value || ''} onChange={e => onChangeUrl(e.target.value)} placeholder='/logo.png' iconLeft={<ImageIcon size={16} />} />
      </div>
      <p className='mt-1 text-xs text-slate-500'>PNG/SVG recommended. Square works best.</p>
    </div>
  );
}

/* ------------------------------- Page -------------------------------- */
export default function AdminSettingsDashboard() {
  const { getOne, update } = useCrud();

  const [settings, setSettings] = useState({
    // General
    siteName: '',
    siteLogo: '',
    contactEmail: '',
    supportPhone: '',
    // Financial
    platformPercent: 10,
    defaultCurrency: 1, // currency ID (int)
    platformAccountUserId: '', // kept (backend needs it); KPI card removed
    // Flags (no affiliate)
    jobsRequireApproval: true,
    // Legal
    privacyPolicy: '',
    termsOfService: '',
    // Minimal seeder refs kept: only FAQs
    faqs: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await getOne();
      setSettings(prev => ({ ...prev, ...(res?.data || {}) }));
    } catch (e) {
      console.error('Error fetching settings:', e);
      setApiError(e?.response?.data?.message || 'Failed to fetch settings.');
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
      await update(payload);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      console.error('Error saving settings:', e);
      setApiError(e?.response?.data?.message || 'Failed to save settings.');
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
      setSuccessMessage(autoPublishEnabled ? 'Jobs will be published immediately.' : 'Jobs now require admin approval before publishing.');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (e) {
      console.error('Error updating job approval setting:', e);
      setApiError(e?.response?.data?.message || 'Failed to update job approval setting.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  /* -------------------------- Legal Tabs/Preview -------------------------- */
  const [activeLegalTab, setActiveLegalTab] = useState('privacy'); // 'privacy' | 'terms'
  const [showPreview, setShowPreview] = useState(false);

  const privacyChars = settings.privacyPolicy?.length || 0;
  const privacyWords = countWords(settings.privacyPolicy);
  const termsChars = settings.termsOfService?.length || 0;
  const termsWords = countWords(settings.termsOfService);

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
      <div className='p-6'>
        {/* Header */}
        <GlassCard gradient='from-indigo-500 via-fuchsia-500 to-rose-500' className='mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold'>Platform Settings</h1>
              <p>Manage global configuration</p>
            </div>
            <Button icon={saving ? <RefreshCw size={16} className='mr-2 animate-spin' /> : <Save size={16} className='mr-2' />} name={saving ? 'Saving...' : 'Save Settings'} onClick={handleSave} disabled={saving} className='!w-fit' />
          </div>
        </GlassCard>

        {/* Alerts */}
        {apiError && <div className='mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800'>{apiError}</div>}
        {successMessage && <div className='mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800'>{successMessage}</div>}

        {/* KPI Row (No affiliate, no platform wallet KPI) */}
        <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <MetricBadge icon={<Globe className='h-4 w-4' />} label='Brand' value={settings.siteName || '—'} intent='neutral' />
          <MetricBadge icon={<DollarSign className='h-4 w-4' />} label='Platform Fee' value={`${Number(settings.platformPercent || 0).toFixed(1)}%`} intent='success' />
          <MetricBadge icon={<DollarSign className='h-4 w-4' />} label='Default Currency ID' value={String(settings.defaultCurrency || 1)} intent='info' hint='Change in Financial Settings' />
        </div>

        {/* Top row: General + Financial */}
        <div className='mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* General */}
          <GlassCard className='p-6'>
            <div className='mb-4 flex items-center'>
              <Globe size={20} className='mr-2 text-blue-600' />
              <h2 className='text-lg font-semibold'>General Settings</h2>
            </div>

            <div className='grid grid-cols-1 gap-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-slate-700'>Site Name</label>
                <Input value={settings.siteName} onChange={e => updateField('siteName', e.target.value)} placeholder='Your Platform Name' />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-slate-700'>Logo</label>
                <LogoUploader value={settings.siteLogo} onUploaded={url => updateField('siteLogo', url)} onChangeUrl={url => updateField('siteLogo', url)} />
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-slate-700'>Contact Email</label>
                  <Input value={settings.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} placeholder='support@example.com' iconLeft={<Mail size={16} />} />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium text-slate-700'>Support Phone</label>
                  <Input value={settings.supportPhone} onChange={e => updateField('supportPhone', e.target.value)} placeholder='+1234567890' iconLeft={<Phone size={16} />} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Financial */}
          <GlassCard className='p-6'>
            <div className='mb-4 flex items-center'>
              <DollarSign size={20} className='mr-2 text-green-600' />
              <h2 className='text-lg font-semibold'>Financial Settings</h2>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-slate-700'>Platform Fee (%)</label>
                <Input type='number' value={settings.platformPercent} onChange={e => updateField('platformPercent', parseFloat(e.target.value))} min='0' max='100' step='0.1' />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-slate-700'>Default Currency (ID)</label>
                <Input type='number' value={settings.defaultCurrency} onChange={e => updateField('defaultCurrency', parseInt(numberOnly(e.target.value), 10) || 1)} min='1' />
              </div>
            </div>

            <div className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <label className='mb-1 block text-sm font-medium text-slate-700'>Platform Wallet Owner (User ID)</label>
              <Input value={settings.platformAccountUserId || ''} onChange={e => updateField('platformAccountUserId', e.target.value)} placeholder='e.g. 707a2de6-b83a-4f2b-b492-cca4cca0ef7f' iconLeft={<Wallet size={16} />} />
              <div className='mt-2 flex items-start gap-2 text-xs text-slate-600'>
                <Info className='mt-0.5 h-4 w-4 text-slate-500' />
                <p>
                  Funds from paid invoices are deposited here (escrow). Ensure this maps to a valid <strong>User</strong> with a <strong>Wallet</strong>.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Jobs Setting (simple) */}
        <div className='mb-6 grid grid-cols-1 gap-6'>
          <GlassCard className='p-6'>
            <div className='mb-4 flex items-center'>
              <Globe size={20} className='mr-2 text-indigo-600' />
              <h2 className='text-lg font-semibold'>Jobs Settings</h2>
            </div>

            <div className='flex items-center justify-between rounded-md bg-slate-50 p-3'>
              <div>
                <label className='mb-1 block text-sm font-medium text-slate-700'>Job Posting Auto-Publish</label>
                <p className='text-sm text-slate-600'>If enabled, new jobs go live immediately. If disabled, jobs remain pending until an admin approves.</p>
              </div>
              <Switcher checked={!settings.jobsRequireApproval} onChange={handleJobsAutoPublishToggle} />
            </div>
          </GlassCard>
        </div>

        {/* FAQs (IDs only) */}
        <div className='mb-6 grid grid-cols-1 gap-6'>
          <GlassCard className='p-6'>
            <div className='mb-4 flex items-center'>
              <Info size={20} className='mr-2 text-teal-600' />
              <h2 className='text-lg font-semibold'>FAQs</h2>
            </div>

            <IdChipsEditor label='FAQ IDs' hint='Provide FAQ IDs to display across the site.' value={settings.faqs} onChange={v => updateField('faqs', v)} icon={<Info size={16} className='text-slate-500' />} />
          </GlassCard>
        </div>

        {/* Legal & Compliance – Tabs + Preview */}
        <div className='grid grid-cols-1 gap-6'>
          <GlassCard className='p-6'>
            <div className='mb-4 flex items-center'>
              <Shield size={20} className='mr-2 text-amber-600' />
              <h2 className='text-lg font-semibold'>Legal & Compliance</h2>
            </div>

            {/* Tabs */}
            <div className='mb-3 flex items-center justify-between'>
              <div className='inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1'>
                {[
                  { id: 'privacy', label: 'Privacy Policy' },
                  { id: 'terms', label: 'Terms of Service' },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveLegalTab(t.id)} className={['px-3 py-1.5 text-sm rounded-md', activeLegalTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'].join(' ')}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className='flex items-center gap-3'>
                <label className='inline-flex items-center gap-2 text-sm text-slate-600'>
                  <input type='checkbox' className='accent-slate-700' checked={showPreview} onChange={e => setShowPreview(e.target.checked)} />
                  Preview
                </label>
              </div>
            </div>

            {/* Editors */}
            {activeLegalTab === 'privacy' ? (
              <div>
                {!showPreview ? (
                  <>
                    <Textarea value={settings.privacyPolicy} onChange={e => updateField('privacyPolicy', e.target.value)} rows={12} placeholder='Enter your privacy policy content...' />
                    <div className='mt-1 flex items-center justify-between text-[11px] text-slate-500'>
                      <span>
                        {privacyChars} chars • {privacyWords} words
                      </span>
                      <span>Tip: use headings and short paragraphs for readability.</span>
                    </div>
                  </>
                ) : (
                  <PreviewBox text={settings.privacyPolicy} />
                )}
              </div>
            ) : (
              <div>
                {!showPreview ? (
                  <>
                    <Textarea value={settings.termsOfService} onChange={e => updateField('termsOfService', e.target.value)} rows={12} placeholder='Enter your terms of service content...' />
                    <div className='mt-1 flex items-center justify-between text-[11px] text-slate-500'>
                      <span>
                        {termsChars} chars • {termsWords} words
                      </span>
                      <span>Include refunds, deliveries, disputes, and governing law.</span>
                    </div>
                  </>
                ) : (
                  <PreviewBox text={settings.termsOfService} />
                )}
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
    <div className='prose max-w-none rounded-lg border border-slate-200 bg-white p-4'>
      {text.split('\n').map((p, i) => (
        <p key={i} className='whitespace-pre-wrap text-slate-800'>
          {p}
        </p>
      ))}
    </div>
  );
}

/* ----------------------------- MetricBadge --------------------------- */
const intentStyles = {
  success: {
    chip: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-700',
    ring: 'ring-emerald-100',
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

        {isSm ? null : <div className={['ml-auto hidden items-center gap-2 rounded-full px-2 py-1 text-xs sm:inline-flex', i.chip].join(' ')}>{label}</div>}
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
