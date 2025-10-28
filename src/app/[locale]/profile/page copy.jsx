// app/(whatever)/profile/overview/page.jsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import api, { baseImg } from '@/lib/axios';
import { Eye, Pencil, User2, Camera, MapPin, CalendarDays, Copy, Shield, Star, Plus, Trash2, Info, Award, CheckCircle2, Repeat, FileUp, DollarSign, Settings2, AlertTriangle } from 'lucide-react';

import Input from '@/components/atoms/Input';
import Textarea from '@/components/atoms/Textarea';
import Select from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import { Modal } from '@/components/common/Modal';
import AttachFilesButton from '@/components/atoms/AttachFilesButton';
import { StatCard } from '@/components/dashboard/Ui';

/* ------------------------------ Small primitives ------------------------------ */
const Card = ({ className = '', children }) => <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>{children}</div>;
const Divider = ({ className = '' }) => <div className={`my-6 h-px bg-slate-200 ${className}`} />;
const Pill = ({ children, className = '' }) => <span className={`inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm ${className}`}>{children}</span>;

/* ------------------------------ Skeletons ------------------------------ */
const shimmer = 'animate-pulse bg-slate-200/70';
function SkeletonLine({ w = 'w-full', h = 'h-4', className = '' }) {
  return <div className={`${shimmer} ${w} ${h} rounded` + (className ? ` ${className}` : '')} />;
}
function SkeletonAvatar() {
  return <div className={`${shimmer} h-20 w-20 rounded-full`} />;
}
function ProfileSkeleton() {
  return (
    <Card>
      <div className='rounded-t-2xl px-6 py-7'>
        <div className='flex items-center justify-between'>
          <div className='flex gap-2'>
            <SkeletonLine w='w-16' h='h-6' className='rounded-full' />
            <SkeletonLine w='w-20' h='h-6' className='rounded-full' />
            <SkeletonLine w='w-24' h='h-6' className='rounded-full' />
          </div>
          <SkeletonLine w='w-9' h='h-9' className='rounded-xl' />
        </div>
        <div className='mt-4 flex flex-col items-center gap-3'>
          <SkeletonAvatar />
          <SkeletonLine w='w-40' />
          <SkeletonLine w='w-56' />
          <SkeletonLine w='w-36' h='h-10' className='rounded-2xl' />
        </div>
      </div>
      <div className='mx-6 my-5 h-px bg-[#EDEDED]' />
      <div className='px-6 pb-6 space-y-4'>
        <div className='flex items-center justify-between'>
          <SkeletonLine w='w-20' />
          <SkeletonLine w='w-24' />
        </div>
        <div className='flex items-center justify-between'>
          <SkeletonLine w='w-24' />
          <SkeletonLine w='w-28' />
        </div>
        <div className='flex items-center justify-between'>
          <SkeletonLine w='w-24' />
          <SkeletonLine w='w-28' />
        </div>
      </div>
    </Card>
  );
}
function BlockSkeleton() {
  return (
    <Card className='p-6'>
      <SkeletonLine w='w-40' />
      <div className='mt-4 space-y-3'>
        <SkeletonLine />
        <SkeletonLine w='w-2/3' />
        <SkeletonLine w='w-4/5' />
      </div>
    </Card>
  );
}

/* --------------------------------- Sub-forms -------------------------------- */
function EducationForm({ onSubmit }) {
  const [form, setForm] = useState({ degree: '', institution: '', year: new Date().getFullYear() });
  return (
    <div className='grid grid-cols-1 gap-3'>
      <Input label='Degree' value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })} />
      <Input label='Institution' value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} />
      <Input label='Year' type='number' value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) || '' })} />
      <Button name='Save item' color='green' onClick={() => onSubmit(form)} />
    </div>
  );
}
function CertificationForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', issuingOrganization: '', year: new Date().getFullYear() });
  return (
    <div className='grid grid-cols-1 gap-3'>
      <Input label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <Input label='Issuing Organization' value={form.issuingOrganization} onChange={e => setForm({ ...form, issuingOrganization: e.target.value })} />
      <Input label='Year' type='number' value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) || '' })} />
      <Button name='Save item' color='green' onClick={() => onSubmit(form)} />
    </div>
  );
}

/* -------------------------------- Profile Card ------------------------------- */
function ProfileCard({ me, loading, editing, setEditing, state, setState, meta, onCopyReferral }) {
  return (
    <Card>
      <div className='rounded-t-2xl px-6 py-7' style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0) 100%)' }}>
        <div className='flex items-center justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <Pill>{state?.type || '—'}</Pill>
            <Pill className={`${meta.status === 'suspended' ? 'text-red-600' : meta.status === 'pending_verification' ? 'text-amber-600' : 'text-emerald-700'}`}>{meta.status || '—'}</Pill>
            {state.sellerLevel ? <Pill>Level {state.sellerLevel}</Pill> : null}
            {meta.topRated ? (
              <Pill>
                <Star className='mr-1 h-4 w-4' /> Top Rated
              </Pill>
            ) : null}
          </div>
          <button onClick={() => setEditing(!editing)} aria-label='Edit profile' className='inline-flex items-center justify-center rounded-xl border border-emerald-500 p-2 text-emerald-600 hover:bg-emerald-50'>
            <Pencil className='h-4 w-4' />
          </button>
        </div>

        <div className='mt-4 flex flex-col items-center'>
          <div className='mb-3 grid place-items-center'>
            {loading ? (
              <SkeletonAvatar />
            ) : (
              <div className='group relative grid place-items-center'>
                <div className='relative overflow-hidden'>
                  {state.profileImage ? (
                    <img src={state.profileImage} alt='avatar' className='h-20 w-20 rounded-full border border-[#EDEDED] object-cover' />
                  ) : (
                    <div className='grid h-20 w-20 place-content-center rounded-full border border-[#EDEDED] bg-[#EDEDED] group-hover:ring-2 group-hover:ring-[#108A00]'>
                      <User2 className='h-8 w-8 text-[#6B7280]' />
                    </div>
                  )}
                  <div className='pointer-events-none absolute inset-0 hidden items-center justify-center rounded-full bg-black/35 text-white group-hover:flex'>
                    <Camera className='h-5 w-5' />
                  </div>
                  <AttachFilesButton
                    hiddenFiles
                    className='absolute inset-0 scale-y-[4] opacity-0'
                    onChange={files => {
                      const img = (files || []).find(f => String(f.mimeType || '').startsWith('image/'));
                      if (!img) return;
                      // simple link usage; replace with real upload if needed
                      setState(s => ({ ...s, profileImage: baseImg + img.url }));
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
              <Input label='Username' value={state.username} onChange={e => setState(s => ({ ...s, username: e.target.value }))} />
              <Input label='Email' value={state.email} onChange={e => setState(s => ({ ...s, email: e.target.value }))} />
              <Input label='Phone' value={state.phone} onChange={e => setState(s => ({ ...s, phone: e.target.value }))} />
            </div>
          ) : (
            <>
              <h3 className='mt-3 text-xl font-semibold text-[#000000]'>{state.username || '—'}</h3>
              <p className='mb-[5px] text-[#6B7280]'>{state.email || '—'}</p>
              <Pill>
                <Shield className='mr-1 h-4 w-4' /> {meta.role || '—'}
              </Pill>
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
          <ul className='space-y-4 text-[#292D32]'>
            <li className='flex items-center justify-between'>
              <span className='inline-flex items-center gap-2 text-[#6B7280]'>
                <MapPin className='h-4 w-4' /> From
              </span>
              <span className='font-semibold'>{state.country || '—'}</span>
            </li>
            <li className='flex items-center justify-between'>
              <span className='inline-flex items-center gap-2 text-[#6B7280]'>
                <CalendarDays className='h-4 w-4' /> Member Since
              </span>
              <span className='font-semibold'>{meta.memberSince || '—'}</span>
            </li>
            <li className='flex items-center justify-between'>
              <span className='inline-flex items-center gap-2 text-[#6B7280]'>
                <Info className='h-4 w-4' /> Last Login
              </span>
              <span className='font-semibold'>{meta.lastLogin || '—'}</span>
            </li>
            <li className='flex items-center justify-between'>
              <span className='inline-flex items-center gap-2 text-[#6B7280]'>Referral Code</span>
              <span className='inline-flex items-center gap-2'>
                <span className='font-semibold'>{meta.referralCode || '—'}</span>
                {meta.referralCode ? (
                  <button onClick={onCopyReferral} className='inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#EDEDED]'>
                    <Copy className='h-4 w-4' />
                  </button>
                ) : null}
              </span>
            </li>
            <li className='flex items-center justify-between'>
              <span className='inline-flex items-center gap-2 text-[#6B7280]'>Referral Stats</span>
              <span className='font-semibold'>
                {meta.referralCount ?? 0} referrals · {meta.referralRewardsCount ?? 0} rewards
              </span>
            </li>
            {meta.referredBy ? (
              <li className='flex items-center justify-between'>
                <span className='inline-flex items-center gap-2 text-[#6B7280]'>Referred By</span>
                <span className='font-semibold'>@{meta.referredBy.username}</span>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------ Tag editor ------------------------------ */
function TagListEditor({ label, items, onAdd, onRemove, placeholder = 'Add item' }) {
  const [val, setVal] = useState('');
  return (
    <section className='space-y-2'>
      <h4 className='text-sm font-semibold'>{label}</h4>
      <div className='flex flex-wrap gap-2'>
        {(items || []).map((s, i) => (
          <span key={i} className='inline-flex items-center gap-2 rounded-full border border-[#EDEDED] px-3 py-1 text-sm'>
            {s}
            <button onClick={() => onRemove(i)} className='text-[#6B7280]'>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className='mt-2 flex gap-2'>
        <Input className='flex-1' placeholder={placeholder} value={val} onChange={e => setVal(e.target.value)} />
        <Button
          color='green'
          className='!w-auto !px-3'
          icon={<Plus />}
          onClick={() => {
            if (!val.trim()) return;
            onAdd(val.trim());
            setVal('');
          }}
        />
      </div>
    </section>
  );
}

/* ------------------------------ About & Editor ------------------------------ */
function AboutCard({ loading, about, setAbout, onSaveAuthProfile, onAddEducation, onAddCertification, onRemoveEducation, onRemoveCertification, countryOptions, onCountryChange, accountTypeOptions, onTypeChange }) {
  const [editingDesc, setEditingDesc] = useState(false);
  const [prefText, setPrefText] = useState(JSON.stringify(about.preferences || {}, null, 2)); // NEW
  const [prefError, setPrefError] = useState(''); // NEW

  useEffect(() => {
    setPrefText(JSON.stringify(about.preferences || {}, null, 2));
  }, [about.preferences]);

  function parsePrefs() {
    try {
      const obj = prefText.trim() ? JSON.parse(prefText) : {};
      setPrefError('');
      setAbout(a => ({ ...a, preferences: obj }));
    } catch (e) {
      setPrefError('Invalid JSON');
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
          {/* top meta editors */}
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <Select label='Country (ISO)' options={countryOptions} value={about.country} onChange={opt => onCountryChange(opt?.id)} placeholder='Select country' />
            <Select label='Account Type' options={accountTypeOptions} value={about.type} onChange={opt => onTypeChange(opt?.id)} placeholder='Select type' />
          </div>

          <Divider className='!my-4' />

          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Description</h3>
            <Button color='secondary' className='!w-auto !px-3 !py-1.5 !text-sm' name={editingDesc ? 'Done' : 'Edit'} onClick={() => setEditingDesc(v => !v)} />
          </div>

          {editingDesc ? (
            <>
              <Textarea value={about.description} onChange={e => setAbout(a => ({ ...a, description: e.target.value }))} rows={7} placeholder='Tell buyers about yourself…' />
              <p className='mt-1 text-xs text-[#6B7280]'>Use a clear, professional summary. Ctrl/Cmd+Enter to save.</p>
            </>
          ) : (
            <p className='mt-4 text-sm leading-6 text-[#292D32]/80'>{about.description || '—'}</p>
          )}

          <Divider className='!my-4' />

          <TagListEditor label='Languages' items={about.languages || []} onAdd={v => setAbout(a => ({ ...a, languages: [...(a.languages || []), v] }))} onRemove={i => setAbout(a => ({ ...a, languages: a.languages.filter((_, idx) => idx !== i) }))} placeholder='e.g., English' />

          <Divider className='!my-4' />

          <TagListEditor label='Skills' items={about.skills || []} onAdd={v => setAbout(a => ({ ...a, skills: [...(a.skills || []), v] }))} onRemove={i => setAbout(a => ({ ...a, skills: a.skills.filter((_, idx) => idx !== i) }))} placeholder='e.g., React' />

          <Divider className='!my-4' />

          {/* Education */}
          <section className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-semibold'>Education</h4>
              <Button color='secondary' className='!w-auto !px-3 !py-1.5 !text-sm' icon={<Plus className='h-4 w-4' />} onClick={onAddEducation} />
            </div>
            <div className='space-y-2'>
              {(about.education || []).map((e, idx) => (
                <div key={idx} className='flex items-center justify-between rounded-xl border border-[#EDEDED] p-3 text-sm'>
                  <div>
                    <div className='font-semibold'>
                      {e.degree} — {e.institution}
                    </div>
                    <div className='text-[#6B7280]'>{e.year}</div>
                  </div>
                  <button onClick={() => onRemoveEducation(idx)} className='text-red-600'>
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              ))}
              {(!about.education || about.education.length === 0) && <div className='text-sm text-[#6B7280]'>No education added</div>}
            </div>
          </section>

          <Divider className='!my-4' />

          {/* Certifications */}
          <section className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-semibold'>Certifications</h4>
              <Button color='secondary' className='!w-auto !px-3 !py-1.5 !text-sm' icon={<Plus className='h-4 w-4' />} onClick={onAddCertification} />
            </div>
            <div className='space-y-2'>
              {(about.certifications || []).map((c, idx) => (
                <div key={idx} className='flex items-center justify-between rounded-xl border border-[#EDEDED] p-3 text-sm'>
                  <div>
                    <div className='font-semibold'>{c.name}</div>
                    <div className='text-[#6B7280]'>
                      {c.issuingOrganization} • {c.year}
                    </div>
                  </div>
                  <button onClick={() => onRemoveCertification(idx)} className='text-red-600'>
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              ))}
              {(!about.certifications || about.certifications.length === 0) && <div className='text-sm text-[#6B7280]'>No certifications added</div>}
            </div>
          </section>

          <Divider className='!my-4' />

          {/* Seller Settings (merged fields) */}
          <section className='space-y-3'>
            <h4 className='text-sm font-semibold flex items-center gap-2'>
              <Settings2 className='h-4 w-4' /> Seller Settings
            </h4>
            <div className='grid gap-3 md:grid-cols-2'>
              <Input label='Delivery Time (e.g., 3 days)' value={about.deliveryTime || ''} onChange={e => setAbout(a => ({ ...a, deliveryTime: e.target.value }))} />
              <Input label='Response Time (hours)' type='number' value={about.responseTime ?? ''} onChange={e => setAbout(a => ({ ...a, responseTime: Number(e.target.value) || null }))} />
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              <Input label='Age Group' value={about.ageGroup || ''} onChange={e => setAbout(a => ({ ...a, ageGroup: e.target.value }))} />
              <Input label='Revisions' type='number' value={about.revisions ?? 0} onChange={e => setAbout(a => ({ ...a, revisions: Number(e.target.value) || 0 }))} />
              <Input label='Seller Level' value={about.sellerLevel || ''} onChange={e => setAbout(a => ({ ...a, sellerLevel: e.target.value }))} />
            </div>
          </section>

          <Divider className='!my-4' />

          {/* Financials (editable per your ask) */}
          <section className='space-y-3'>
            <h4 className='text-sm font-semibold flex items-center gap-2'>
              <DollarSign className='h-4 w-4' /> Financials
            </h4>
            <div className='grid gap-3 md:grid-cols-3'>
              <Input label='Balance' type='number' value={about.balance ?? 0} onChange={e => setAbout(a => ({ ...a, balance: Number(e.target.value) || 0 }))} />
              <Input label='Total Spent' type='number' value={about.totalSpent ?? 0} onChange={e => setAbout(a => ({ ...a, totalSpent: Number(e.target.value) || 0 }))} />
              <Input label='Total Earned' type='number' value={about.totalEarned ?? 0} onChange={e => setAbout(a => ({ ...a, totalEarned: Number(e.target.value) || 0 }))} />
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              <Input label='Reputation Points' type='number' value={about.reputationPoints ?? 0} onChange={e => setAbout(a => ({ ...a, reputationPoints: Number(e.target.value) || 0 }))} />
              <Input label='Top Rated (readonly from stats)' value={about.topRated ? 'Yes' : 'No'} readOnly />
            </div>
            <p className='text-xs text-amber-600 mt-1 inline-flex items-center gap-1'>
              <AlertTriangle className='h-4 w-4' /> If your backend currently blocks editing of these fields, add them to allowedFields in AuthService.updateProfile.
            </p>
          </section>

          <Divider className='!my-4' />

          {/* Preferences JSON */}
          <section className='space-y-2'>
            <h4 className='text-sm font-semibold'>Preferences (JSON)</h4>
            <Textarea rows={8} value={prefText} onChange={e => setPrefText(e.target.value)} onBlur={parsePrefs} />
            {prefError ? <div className='text-sm text-red-600'>{prefError}</div> : null}
          </section>

          <Divider className='!my-4' />

          {/* Intro & Portfolio */}
          <section className='space-y-2'>
            <h4 className='text-sm font-semibold'>Intro Video & Portfolio</h4>
            <Input label='Intro video URL' placeholder='https://...' value={about.introVideoUrl || ''} onChange={e => setAbout(a => ({ ...a, introVideoUrl: e.target.value }))} />
            <Input label='Portfolio File URL' placeholder='e.g., /uploads/portfolio.pdf' value={about.portfolioFile || ''} onChange={e => setAbout(a => ({ ...a, portfolioFile: e.target.value }))} /> {/* NEW */}
            <PortfolioEditor about={about} setAbout={setAbout} />
            <div className='pt-2'>
              <Button name='Save Profile' color='green' onClick={onSaveAuthProfile} className='!w-auto !px-4' />
            </div>
          </section>
        </>
      )}
    </Card>
  );
}

/* ------------------------------ PortfolioEditor ---------------------------- */
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
            <a href={it.url} className='truncate text-blue-600' target='_blank' rel='noreferrer'>
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

/* ------------------------------ Devices & KPIs ----------------------------- */
function DevicesCard({ loading, devices }) {
  if (loading) return <BlockSkeleton />;
  if (!devices?.length) return null;
  return (
    <Card className='p-6'>
      <h3 className='mb-3 text-lg font-semibold'>Recent Devices</h3>
      <div className='divide-y'>
        {devices.map((d, i) => (
          <div key={i} className='flex items-center justify-between py-2 text-sm'>
            <span>
              {d.device_type} • {d.browser} • {d.os}
            </span>
            <span className='text-[#6B7280]'>
              {d.ip_address} • {d.last_activity ? new Date(d.last_activity).toLocaleString() : '—'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function KPICard({ loading, stats }) {
  if (loading) return <BlockSkeleton />;
  if (!stats) return null;
  return (
    <>
      <h3 className='mb-3 text-lg font-semibold'>Seller KPIs</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard title='Orders Completed' value={Number(stats.ordersCompleted || 0)} hint='All-time' icon={CheckCircle2} gradient='from-emerald-500 via-teal-500 to-cyan-400' />
        <StatCard title='Repeat Buyers' value={Number(stats.repeatBuyers || 0)} hint='Unique customers' icon={Repeat} gradient='from-sky-500 via-indigo-500 to-violet-500' />
        <StatCard title='Avg. Rating' value={Number(stats.averageRating || 0)} hint={`${(stats.averageRating ?? 0).toFixed(1)} / 5`} icon={Star} gradient='from-amber-400 via-orange-500 to-rose-500' />
        <StatCard title='Top Rated' value={stats.topRated ? 1 : 0} hint={stats.topRated ? 'Yes' : 'No'} icon={Award} gradient='from-fuchsia-500 via-rose-500 to-orange-400' />
      </div>
    </>
  );
}

/* ----------------------------------- Page ---------------------------------- */
export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // unified editable state
  const [state, setState] = useState({
    username: '',
    email: '',
    type: '', // 'Business' | 'Individual'
    phone: '',
    profileImage: '',
    country: '',
    description: '',
    languages: [],
    skills: [],
    education: [],
    certifications: [],
    introVideoUrl: '',
    portfolioItems: [],
    // NEW merged/profile fields:
    portfolioFile: '',
    responseTime: null,
    deliveryTime: '',
    ageGroup: '',
    revisions: 0,
    sellerLevel: '',
    preferences: {},
    balance: 0,
    totalSpent: 0,
    totalEarned: 0,
    reputationPoints: 0,
    topRated: false, // view-only from stats but we keep to render consistently
  });

  const [meta, setMeta] = useState({
    role: '',
    status: '',
    memberSince: '',
    lastLogin: '',
    referralCode: '',
    referralCount: 0,
    referralRewardsCount: 0,
    referredBy: null,
  });

  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);

  const [editing, setEditing] = useState(false);
  const [eduOpen, setEduOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  const countryOptions = useMemo(() => ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'IN', 'BR', 'NG', 'ZA', 'EG', 'SA', 'AE'].map(c => ({ id: c, name: c })), []);
  const accountTypeOptions = useMemo(
    () => [
      { id: 'Business', name: 'Business' },
      { id: 'Individual', name: 'Individual' },
    ],
    [],
  );

  /* ------------------------------- Load data -------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        // 1) /auth/me
        const me = await api.get('/auth/me').then(r => r.data);

        setState(s => ({
          ...s,
          username: me?.username || '',
          email: me?.email || '',
          type: me?.type || '',
          phone: me?.phone || '',
          profileImage: me?.profilePictureUrl || me?.profileImage || '',
          country: me?.country || '',
          description: me?.description || '',
          languages: me?.languages || [],
          skills: me?.skills || [],
          education: Array.isArray(me?.education) ? me?.education : [],
          certifications: Array.isArray(me?.certifications) ? me?.certifications : [],
          introVideoUrl: me?.introVideoUrl || '',
          portfolioItems: me?.portfolioItems || [],
          // NEW from merged entity
          portfolioFile: me?.portfolioFile || '',
          responseTime: me?.responseTime ?? null,
          deliveryTime: me?.deliveryTime || '',
          ageGroup: me?.ageGroup || '',
          revisions: me?.revisions ?? 0,
          sellerLevel: me?.sellerLevel || '',
          preferences: me?.preferences || {},
          balance: Number(me?.balance ?? 0),
          totalSpent: Number(me?.totalSpent ?? 0),
          totalEarned: Number(me?.totalEarned ?? 0),
          reputationPoints: Number(me?.reputationPoints ?? 0),
        }));

        setMeta(m => ({
          ...m,
          role: me?.role || '',
          status: me?.status || '',
          memberSince: me?.memberSince ? new Date(me?.memberSince).toLocaleDateString() : '',
          lastLogin: me?.lastLogin ? new Date(me?.lastLogin).toLocaleString() : '',
          referralCode: me?.referralCode || '',
          referralCount: me?.referralCount ?? 0,
          referralRewardsCount: me?.referralRewardsCount ?? 0,
          referredBy: me?.referredBy || null,
        }));

        setDevices(me?.devices || []);

        // 2) KPIs from /auth/profile/stats   // NEW
        const s = await api.get('/auth/profile/stats').then(r => r.data);
        setStats(s);
        setState(prev => ({ ...prev, topRated: !!s?.topRated }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------------------- Save handler ----------------------------- */
  async function saveAuthProfile() {
    setSaving(true);
    try {
      const payload = {
        username: state.username,
        email: state.email,
        phone: state.phone,
        type: state.type,
        country: state.country,
        profileImage: state.profileImage,
        description: state.description,
        languages: state.languages,
        skills: state.skills,
        education: state.education,
        certifications: state.certifications,
        introVideoUrl: state.introVideoUrl,
        portfolioItems: state.portfolioItems,
        // NEW — merged editable fields
        portfolioFile: state.portfolioFile,
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
      };
      await api.put('/auth/profile', payload); // single source
      // refresh me
      const me = await api.get('/auth/me').then(r => r.data);
      setState(s => ({ ...s, ...me }));
      setMeta(m => ({
        ...m,
        role: me?.role || m.role,
        status: me?.status || m.status,
        memberSince: me?.memberSince ? new Date(me?.memberSince).toLocaleDateString() : m.memberSince,
        lastLogin: me?.lastLogin ? new Date(me?.lastLogin).toLocaleString() : m.lastLogin,
        referralCode: me?.referralCode || m.referralCode,
        referralCount: me?.referralCount ?? m.referralCount,
        referralRewardsCount: me?.referralRewardsCount ?? m.referralRewardsCount,
        referredBy: me?.referredBy || m.referredBy,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------- Education/Cert modals ----------------------- */
  const onAddEducation = () => setEduOpen(true);
  const onAddCertification = () => setCertOpen(true);
  const onRemoveEducation = idx => setState(a => ({ ...a, education: a.education.filter((_, i) => i !== idx) }));
  const onRemoveCertification = idx => setState(a => ({ ...a, certifications: a.certifications.filter((_, i) => i !== idx) }));

  return (
    <div className='container !py-8'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        <div className='lg:col-span-3 space-y-6'>
          {loading ? <ProfileSkeleton /> : <ProfileCard me={state} loading={loading} editing={editing} setEditing={setEditing} state={state} setState={setState} meta={meta} onCopyReferral={async () => meta.referralCode && (await navigator.clipboard.writeText(meta.referralCode))} />}
          <DevicesCard loading={loading} devices={devices} />
        </div>

        <div className='lg:col-span-9 space-y-6'>
          <KPICard loading={loading} stats={stats} />
          <AboutCard
            loading={loading}
            about={{
              description: state.description,
              languages: state.languages,
              skills: state.skills,
              education: state.education,
              certifications: state.certifications,
              introVideoUrl: state.introVideoUrl,
              portfolioItems: state.portfolioItems,
              portfolioFile: state.portfolioFile, // NEW
              country: state.country,
              type: state.type,
              responseTime: state.responseTime, // NEW
              deliveryTime: state.deliveryTime, // NEW
              ageGroup: state.ageGroup, // NEW
              revisions: state.revisions, // NEW
              sellerLevel: state.sellerLevel, // NEW
              preferences: state.preferences, // NEW
              balance: state.balance, // NEW
              totalSpent: state.totalSpent, // NEW
              totalEarned: state.totalEarned, // NEW
              reputationPoints: state.reputationPoints, // NEW
              topRated: state.topRated, // derived
            }}
            setAbout={updater => {
              setState(prev => ({ ...prev, ...(typeof updater === 'function' ? updater(prev) : updater) }));
            }}
            onSaveAuthProfile={saveAuthProfile}
            onAddEducation={onAddEducation}
            onAddCertification={onAddCertification}
            onRemoveEducation={onRemoveEducation}
            onRemoveCertification={onRemoveCertification}
            countryOptions={countryOptions}
            onCountryChange={code => setState(s => ({ ...s, country: code }))}
            accountTypeOptions={accountTypeOptions}
            onTypeChange={t => setState(s => ({ ...s, type: t }))}
          />

          {!loading && (
            <div className='flex items-center justify-end gap-3'>
              <Button color='secondary' name='Cancel' onClick={() => window.location.reload()} className='!w-auto !px-4' />
              <Button color='green' name={saving ? '' : 'Save changes'} loading={saving} onClick={saveAuthProfile} className='!w-auto !px-5' />
            </div>
          )}
        </div>
      </div>

      {/* Add Education */}
      {eduOpen && (
        <Modal title='Add Education' onClose={() => setEduOpen(false)}>
          <EducationForm
            onSubmit={item => {
              setState(a => ({ ...a, education: [...(a.education || []), item] }));
              setEduOpen(false);
            }}
          />
        </Modal>
      )}

      {/* Add Certification */}
      {certOpen && (
        <Modal title='Add Certification' onClose={() => setCertOpen(false)}>
          <CertificationForm
            onSubmit={item => {
              setState(a => ({ ...a, certifications: [...(a.certifications || []), item] }));
              setCertOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/* 
'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Card } from '@/app/[locale]/invite/page';
 
export function OwnerPanel({ reviews }) {
  return (
    <Card className='p-6 sm:p-8'>
      <h2 className='text-xl sm:text-2xl font-semibold text-[#000000]'>This is your profile as business owner</h2>
      <p className='mt-1 text-[#6B7280]'>To access your freelancer profile here.</p>

      <h3 className='mt-8 mb-4 text-lg font-semibold text-[#292D32]'>Reviews from freelancers</h3>

       <div className='relative'>
        <div className='mb-3 flex items-center justify-end gap-2'>
          <button className='cards-prev cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-white transition hover:bg-slate-100 duration-300 border border-slate-200' aria-label='Previous'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
              <path d='M15 6l-6 6 6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
          <button className='cards-next cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full bg-white transition hover:bg-slate-100 duration-300 border border-slate-200' aria-label='Next'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
              <path d='M9 6l6 6-6 6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        </div>

        <Swiper
          modules={[Navigation, Pagination]}
          navigation={{ prevEl: '.cards-prev', nextEl: '.cards-next' }}
          pagination={{
            el: '.cards-pagination',
            clickable: true,
            bulletClass: 'cards-bullet',
            bulletActiveClass: 'cards-bullet-active',
            renderBullet: (_i, className) => `<span class="${className}"><span class="inner"></span></span>`,
          }}
          spaceBetween={12}
          slidesPerView={3}
          breakpoints={{
            1024: { slidesPerView: 3 },
            640: { slidesPerView: 2 },
            0: { slidesPerView: 1 },
          }}>
          {reviews.map((r, i) => (
            <SwiperSlide key={i}>
              <ReviewCard {...r} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className='cards-pagination mt-4 flex items-center justify-center'></div>
      </div>
    </Card>
  );
}


export function ReviewCard({ author, text, stars = 5 }) {
  return (
    <div className='rounded-xl border border-[#EDEDED] bg-white p-4 sm:p-5 shadow-sm'>
      <div className='text-sm font-semibold text-[#292D32]'>{author}</div>
      <p className='mt-2 text-sm text-[#6B7280]'>{text}</p>
      <div className='mt-3 text-[#FFBF00]' aria-label={`${stars} stars`}>
        {'★'.repeat(stars)}
      </div>
    </div>
  );
}

*/
