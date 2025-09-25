'use client';

import React, { useEffect, useMemo, useState, useRef, use } from 'react';
import { useParams } from 'next/navigation';
import api, { baseImg } from '@/lib/axios';
import { FileText, UploadCloud, Upload, Video, Camera, MapPin, CalendarDays, Copy, Shield, Star, Plus, Trash2, Info, Award, CheckCircle2, Repeat, DollarSign, Settings2, AlertTriangle, Mail, Phone, X, Loader2 } from 'lucide-react';

import Input from '@/components/atoms/Input';
import Textarea from '@/components/atoms/Textarea';
import Select from '@/components/atoms/Select';
import Button from '@/components/atoms/Button';
import { Modal } from '@/components/common/Modal';
import AttachFilesButton from '@/components/atoms/AttachFilesButton';
import { StatCard } from '@/components/dashboard/Ui';

import { Card, Divider, Pill, SkeletonLine, SkeletonAvatar, BlockSkeleton } from '@/components/UI/ui';
import { getUserInfo } from '@/hooks/useUser';
import Img from '@/components/atoms/Img';
import toast from 'react-hot-toast';

/* -------------------------------- Utilities -------------------------------- */
const toDate = iso => (iso ? new Date(iso).toLocaleString() : '—');
const toDateShort = iso => (iso ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(iso)) : '—');
const letterFromName = s => (s && String(s).trim() ? String(s).trim()[0].toUpperCase() : '?');

/* ------------------------------ Small sub-forms ----------------------------- */
function EducationForm({ onSubmit }) {
  const [form, setForm] = useState({ degree: '', institution: '', year: new Date().getFullYear() });
  return (
    <div className='grid grid-cols-1 gap-3'>
      <Input required label='Degree' value={form.degree} onChange={e => setForm({ ...form, degree: e.target.value })} />
      <Input required label='Institution' value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} />
      <Input required label='Year' type='number' value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) || '' })} />
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

/* -------------------------------- Profile Card ------------------------------ */
function ProfileCard({ loading, editing, setEditing, state, setState, meta, onCopyReferral }) {
  return (
    <Card>
      <div className='rounded-t-2xl px-6 py-7' style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0) 100%)' }}>
        <div className='flex items-center justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <Pill>{state?.type || '—'}</Pill>
            {state.sellerLevel ? <Pill>Level {state.sellerLevel}</Pill> : null}
            {meta.topRated ? (
              <Pill>
                <Star className='mr-1 h-4 w-4' /> Top Rated
              </Pill>
            ) : null}
          </div>

          <img onClick={() => setEditing(!editing)} className='cursor-pointer hover:scale-[1.1] duration-300' src={'/icons/edit-green.svg'} alt='' />
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
                    <div className='grid h-20 w-20 place-content-center rounded-full border border-[#EDEDED] bg-[#EDEDED] group-hover:ring-2 group-hover:ring-[#108A00]'>
                      <span className='text-2xl font-bold text-[#6B7280]'>{letterFromName(state.username || state.email)}</span>
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
              <Input label='Username' value={state.username} onChange={e => setState(s => ({ ...s, username: e.target.value }))} />
              <Input label='Email' value={state.email} onChange={e => setState(s => ({ ...s, email: e.target.value }))} />
              <Input label='Phone' value={state.phone} onChange={e => setState(s => ({ ...s, phone: e.target.value }))} />
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
                    <Phone className='mr-1 h-4 w-4' /> {state.phone}
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
                  <button onClick={onCopyReferral} className='cursor-pointer hover:scale-[1.1] duration-300 hover:bg-gray-100 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#EDEDED]'>
                    <Copy className='  h-4 w-4' />
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

/* ------------------------------- About editor ------------------------------- */
function AboutCard({ loading, about, setAbout, onSaveAuthProfile }) {
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
          {/* Seller Settings */}
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
              <Input label='Seller Level (lvl1/lvl2/new/top)' value={about.sellerLevel || ''} onChange={e => setAbout(a => ({ ...a, sellerLevel: e.target.value }))} />
            </div>
          </section>

          <Divider className='!my-4' />

          {/* Financials */}
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
              <AlertTriangle className='h-4 w-4' /> If your backend blocks editing of these fields, allow them in your update service.
            </p>
          </section>

          <Divider className='!my-4' />

          {/* Preferences JSON */}
          <section className='space-y-2'>
            <h4 className='text-sm font-semibold'>Preferences (JSON)</h4>
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

function KPICard({ loading, stats }) {
  if (loading) return <BlockSkeleton />;
  if (!stats) return null;
  return (
    <>
      {/* <h3 className='mb-3 text-lg font-semibold'>Seller KPIs</h3> */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard title='Orders Completed' value={Number(stats.ordersCompleted || 0)} hint='All-time' icon={CheckCircle2} gradient='from-emerald-500 via-teal-500 to-cyan-400' />
        <StatCard title='Repeat Buyers' value={Number(stats.repeatBuyers || 0)} hint='Unique customers' icon={Repeat} gradient='from-sky-500 via-indigo-500 to-violet-500' />
        <StatCard title='Avg. Rating' value={Number(stats.averageRating || 0)} hint={`${(stats.averageRating ?? 0).toFixed(1)} / 5`} icon={Star} gradient='from-amber-400 via-orange-500 to-rose-500' />
        <StatCard title='Top Rated' value={stats.topRated ? 1 : 0} hint={stats.topRated ? 'Yes' : 'No'} icon={Award} gradient='from-fuchsia-500 via-rose-500 to-orange-400' />
      </div>
    </>
  );
}

function InfoCard({ loading, about, setAbout, onAddEducation, onAddCertification, onRemoveEducation, onRemoveCertification, countryOptions = [], onCountryChange, accountTypeOptions = [], onTypeChange }) {
  if (loading) return <SkeletonInfoCard />;

  const [editingDesc, setEditingDesc] = useState(false);
  const [showLangInput, setShowLangInput] = useState(false);
  const [newLang, setNewLang] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  return (
    <Card className=' p-4 sm:p-5'>
      <SectionHeader title='Description' iconSrc={'/icons/edit-green.svg'} actionAria={editingDesc ? 'Finish editing description' : 'Edit description'} onAction={() => setEditingDesc(v => !v)} />
      <Divider className='!my-2' />
      {editingDesc ? (
        <>
          <Textarea value={about?.description || ''} onChange={e => setAbout(a => ({ ...a, description: e.target.value }))} rows={4} placeholder='Tell buyers about yourself…' />
          <p className='mt-1 text-xs text-[#6B7280]'>Use a clear, professional summary. Ctrl/Cmd+Enter to save.</p>
        </>
      ) : (
        <p className='mt-1 text-sm leading-7 text-[#292D32]/80'>{about?.description?.trim() || '—'}</p>
      )}

      <Divider className='!mt-6 !mb-2 ' />

      {/* Languages */}
      <SectionHeader title='Languages' iconSrc='/icons/add-green.svg' actionAria='Add language' onAction={() => setShowLangInput(true)} />

      <div className='mt-1 space-y-2'>
        {(about?.languages || []).length > 0 ? (
          about.languages.map((lang, idx) => (
            <div key={idx} className='group relative ltr:mr-2 rtl:ml-2 overflow-hidden inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-[#111827] shadow-[0_4px_14px_rgba(0,0,0,0.04)] border border-[#EDEDED]'>
              <span className='truncate'>{lang || '—'}</span>
              <button onClick={() => setAbout(a => ({ ...a, languages: a.languages.filter((_, i) => i !== idx) }))} className=' cursor-pointer absolute inset-0 flex items-center justify-center bg-red-500/70 opacity-0 group-hover:opacity-100 transition-opacity' aria-label='Remove language'>
                <X size={20} className=' mx-auto text-white ' />
              </button>
            </div>
          ))
        ) : (
          <div className='text-sm text-[#6B7280]'>No languages added</div>
        )}

        {/* Input appears here when adding */}
        {showLangInput && (
          <div className='flex items-center gap-2'>
            <input
              type='text'
              className='flex-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500'
              placeholder='e.g., English - Fluent'
              value={newLang}
              onChange={e => setNewLang(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newLang.trim()) {
                  setAbout(a => ({
                    ...a,
                    languages: [...(a.languages || []), newLang.trim()],
                  }));
                  setNewLang('');
                  setShowLangInput(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (!newLang.trim()) return;
                setAbout(a => ({
                  ...a,
                  languages: [...(a.languages || []), newLang.trim()],
                }));
                setNewLang('');
                setShowLangInput(false);
              }}
              className='rounded-xl border border-emerald-500 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50'>
              Add
            </button>
          </div>
        )}
      </div>

      <Divider className='!mt-6 !mb-2 ' />

      {/* Skills */}
      <SectionHeader title='Skills' iconSrc='/icons/add-green.svg' actionAria='Add skill' onAction={() => setShowSkillInput(true)} />

      <PillEditor items={about?.skills || []} placeholder='e.g., React' showInput={showSkillInput} setShowInput={setShowSkillInput} onAdd={val => setAbout(a => ({ ...a, skills: [...(a.skills || []), val] }))} onRemove={i => setAbout(a => ({ ...a, skills: a.skills.filter((_, idx) => idx !== i) }))} />

      <Divider className='!mt-6 !mb-2 ' />

      {/* Education */}
      <SectionHeader title='Education' iconSrc='/icons/add-green.svg' actionAria='Add education' onAction={onAddEducation} />
      <div className='mt-2 space-y-2'>
        {(about?.education || []).length > 0 ? (
          about.education.map((e, idx) => (
            <div key={idx} className='flex items-center justify-between rounded-2xl border border-[#EDEDED] bg-white p-3 text-sm'>
              <div className='min-w-0'>
                <div className='font-semibold truncate'>
                  {e?.degree || '—'} — {e?.institution || '—'}
                </div>
                <div className='text-[#6B7280]'>{e?.year || '—'}</div>
              </div>
              <button onClick={() => onRemoveEducation?.(idx)} className='text-rose-600 hover:text-rose-700' aria-label='Remove education' title='Remove'>
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          ))
        ) : (
          <div className='text-sm text-[#6B7280]'>No education added</div>
        )}
      </div>

      <Divider />

      {/* Certifications */}
      <SectionHeader title='Certification' iconSrc='/icons/add-green.svg' actionAria='Add certification' onAction={onAddCertification} />
      <div className='mt-2 space-y-2'>
        {(about?.certifications || []).length > 0 ? (
          about.certifications.map((c, idx) => (
            <div key={idx} className='flex items-center justify-between rounded-2xl border border-[#EDEDED] bg-white p-3 text-sm'>
              <div className='min-w-0'>
                <div className='font-semibold truncate'>{c?.name || '—'}</div>
                <div className='text-[#6B7280]'>
                  {c?.issuingOrganization || c?.issuer || '—'} • {c?.year || '—'}
                </div>
              </div>
              <button onClick={() => onRemoveCertification?.(idx)} className='text-rose-600 hover:text-rose-700' aria-label='Remove certification' title='Remove'>
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          ))
        ) : (
          <div className='text-sm text-[#6B7280]'>No certifications added</div>
        )}
      </div>
      <Divider />
      {/* Top selects row */}
      <div className=' mt-4 grid grid-cols-1 gap-3 md:grid-cols-2'>
        <Select label='Country (ISO)' options={countryOptions} value={about?.country} onChange={opt => onCountryChange?.(opt?.id)} placeholder='Select country' />
        <Select label='Account Type' options={accountTypeOptions} value={about?.type} onChange={opt => onTypeChange?.(opt?.id)} placeholder='Select type' />
      </div>
    </Card>
  );
}

function SkeletonInfoCard() {
  return (
    <div className='rounded-[28px] border border-[#E8ECEF] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-5 sm:p-6 animate-pulse'>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        <SkeletonLine className='h-5 w-40' />
        <SkeletonLine className='h-5 w-40' />
        <SkeletonBox className='h-10' />
        <SkeletonBox className='h-10' />
      </div>

      <Divider />

      <div className='flex items-center justify-between'>
        <SkeletonLine className='h-6 w-36' />
        <SkeletonCircle className='h-8 w-8' />
      </div>
      <div className='mt-3 space-y-2'>
        <SkeletonLine className='h-4 w-full' />
        <SkeletonLine className='h-4 w-[90%]' />
        <SkeletonLine className='h-4 w-[80%]' />
      </div>

      <Divider />

      <div className='flex items-center justify-between'>
        <SkeletonLine className='h-6 w-28' />
        <SkeletonCircle className='h-8 w-8' />
      </div>
      <SkeletonLine className='mt-2 h-4 w-32' />

      <Divider />

      <div className='flex items-center justify-between'>
        <SkeletonLine className='h-6 w-16' />
        <SkeletonCircle className='h-8 w-8' />
      </div>
      <div className='mt-2 flex flex-wrap gap-2'>
        <SkeletonPill />
        <SkeletonPill />
      </div>

      <Divider />

      <div className='flex items-center justify-between'>
        <SkeletonLine className='h-6 w-24' />
        <SkeletonCircle className='h-8 w-8' />
      </div>
      <SkeletonBox className='mt-2 h-14' />

      <Divider />

      <div className='flex items-center justify-between'>
        <SkeletonLine className='h-6 w-32' />
        <SkeletonCircle className='h-8 w-8' />
      </div>
      <SkeletonBox className='mt-2 h-14' />
    </div>
  );
}

function SectionHeader({ title, iconSrc, actionAria, onAction }) {
  return (
    <div className='mt-1 flex items-center justify-between'>
      <h3 className='text-[20px] font-semibold tracking-tight text-[#111827]'>{title}</h3>
      {iconSrc && (
        <button onClick={onAction} aria-label={actionAria} title={actionAria} className=' cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl  hover:scale-[1.1] active:scale-95 transition'>
          <img src={iconSrc} />
        </button>
      )}
    </div>
  );
}

function PillEditor({ items, onAdd, onRemove, placeholder, showInput, setShowInput }) {
  const [input, setInput] = useState('');

  return (
    <>
      {/* Pills */}
      <div className='mt-2 flex flex-wrap gap-2'>
        {items.length > 0 ? (
          items.map((t, i) => (
            <span key={`${t}-${i}`} className='group overflow-hidden  relative inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-[#111827] shadow-[0_4px_14px_rgba(0,0,0,0.04)] border border-[#EDEDED]'>
              {t || '—'}
              <button onClick={() => onRemove?.(i)} className='cursor-pointer absolute inset-0 flex items-center justify-center bg-red-500/70 opacity-0 group-hover:opacity-100 transition-opacity'>
                <X size={18} className='text-white' />
              </button>
            </span>
          ))
        ) : (
          <div className='text-sm text-[#6B7280]'>No items added</div>
        )}
      </div>

      {/* Controlled by SectionHeader */}
      {showInput && (
        <div className='mt-3 flex items-center gap-2'>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && input.trim()) {
                onAdd?.(input.trim());
                setInput('');
                setShowInput(false);
              }
            }}
            autoFocus
            placeholder={placeholder || 'Add item'}
            className='flex-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500'
          />
          <button
            onClick={() => {
              if (!input.trim()) return;
              onAdd?.(input.trim());
              setInput('');
              setShowInput(false);
            }}
            className='rounded-xl border border-emerald-500 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50'>
            Save
          </button>
        </div>
      )}
    </>
  );
}

/* ---- Skeleton atoms ---- */

function SkeletonBox({ className = '' }) {
  return <div className={`rounded-xl bg-slate-200 ${className}`} />;
}
function SkeletonCircle({ className = '' }) {
  return <div className={`rounded-full bg-slate-200 ${className}`} />;
}
function SkeletonPill() {
  return <div className='h-8 w-28 rounded-full bg-slate-200 shadow' />;
}

function Assets({
  initialVideoUrl = '',
  initialImages = [], // array of URLs
  onVideoChange, // (url) => void
  onImagesChange, // (urls[]) => void
}) {
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '');
  const [videoUploading, setVideoUploading] = useState(false);

  const [imgs, setImgs] = useState((initialImages || []).slice(0, 6).map((u, i) => ({ id: `init-${i}`, url: u, uploading: false })));
  const [imgUploadingCount, setImgUploadingCount] = useState(0);

  const videoInputRef = useRef(null);
  const imgInputRef = useRef(null);

  useEffect(() => {
    onVideoChange?.(videoUrl);
  }, [videoUrl]);

  useEffect(() => {
    setVideoUrl(initialVideoUrl);
  }, [initialVideoUrl]);

  useEffect(() => {
    console.log(initialImages);
    setImgs(initialImages.map((u, i) => ({ id: `init-${i}`, url: u, uploading: false })));
  }, [initialImages]);

  // ---------- Video handlers ----------
  const handlePickVideo = () => videoInputRef.current?.click();

  const handleVideoSelected = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/auth/video', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => {
          // optional: show progress
          // const pct = Math.round((ev.loaded / (ev.total || 1)) * 100);
        },
      });
      setVideoUrl(data.url);
    } catch (err) {
      console.error(err);
      // toast.error('Failed to upload video');
    } finally {
      setVideoUploading(false);
      e.target.value = '';
    }
  };

  const removeVideo = () => setVideoUrl('');

  // ---------- Images handlers ----------
  const handlePickImages = () => imgInputRef.current?.click();

  const handleImagesSelected = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

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
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-semibold text-black'>Intro video</h2>
            <p className='mt-2 text-lg text-black/70'>Stand out with a short introduction video.</p>
          </div>

          <Button className='!w-fit' loading={videoUploading} name={videoUploading ? 'Uploading…' : videoUrl ? 'Replace Video' : 'Upload Video'} icon={<Plus size={18} />} onClick={handlePickVideo} disabled={videoUploading} />
        </div>

        {/* Video preview / skeleton */}
        <div className='mt-5'>
          {videoUploading ? (
            <div className='aspect-video w-full rounded-2xl bg-slate-200 animate-pulse' />
          ) : videoUrl ? (
            <div className='relative'>
              <video src={baseImg + videoUrl} controls className='aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black' />
              <button onClick={removeVideo} className='absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75' aria-label='Remove video'>
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          ) : (
            <button type='button' onClick={handlePickVideo} className='group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-10 text-slate-600 hover:bg-slate-100'>
              <Video className='h-5 w-5' />
              <span className='font-medium'>Upload intro video</span>
            </button>
          )}
        </div>

        <input ref={videoInputRef} type='file' accept='video/*' className='hidden' onChange={handleVideoSelected} />
      </Card>

      <Card className=' p-4 sm:p-5 mt-8 '>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-xl font-semibold text-black'>Portfolio</h3>
            <p className='text-sm text-slate-600'>Add up to 6 images.</p>
          </div>

          <Button className='!w-fit' name='Add Images' icon={<Plus size={18} />} onClick={handlePickImages} disabled={imgs.length >= 6} />
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
                    <img src={baseImg + item.url} alt='Portfolio' className='aspect-[16/11] w-full object-cover' />

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
              <span className='flex flex-col items-center text-emerald-600'>
                <Upload className='h-5 w-5' />
                <span className='mt-1 text-sm font-medium'>Upload</span>
              </span>
            </button>
          )}
        </div>

        {/* Counter / helper */}
        <div className='mt-3 text-xs text-slate-500'>
          {imgs.length}/6 images {imgUploadingCount > 0 && `• Uploading ${imgUploadingCount}…`}
        </div>
      </Card>
    </div>
  );
}

function resolveUrl(u) {
  if (!u) return '';
  if (/^(https?:|blob:|data:)/i.test(u)) return u;
  return (baseImg || '') + u.replace(/^\/+/, '');
}

function filenameFromUrl(u) {
  try {
    const x = u.split('?')[0];
    return x.substring(x.lastIndexOf('/') + 1) || 'file';
  } catch {
    return 'file';
  }
}

function PortfolioFileBox({
  initialUrl = '',
  onChange, // (url: string) => void
}) {
  const [fileUrl, setFileUrl] = useState(initialUrl || '');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);

  // keep in sync if parent updates
  useEffect(() => setFileUrl(initialUrl || ''), [initialUrl]);
  useEffect(() => {
    onChange?.(fileUrl);
  }, [fileUrl]);

  const pickFile = () => inputRef.current?.click();

  const handleSelected = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file); // field name must be "file"
      const { data } = await api.post('/auth/portfolio-file', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFileUrl(data.url); // backend returns absolute URL
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
    } catch (err) {
      console.error(err);
      // toast.error?.('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const hasFile = !!fileUrl;

  return (
    <Card className='p-4 sm:p-5 mt-8'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h3 className='text-xl font-semibold text-black'>Portfolio file</h3>
          <p className='text-sm text-slate-600'>PDF/Doc/PPT/XLS (max ~25MB). One file at a time.</p>
        </div>

        <Button className='!w-fit' name={uploading ? 'Uploading…' : hasFile ? 'Replace file' : 'Upload file'} icon={uploading ? <Loader2 className='h-4 w-4 animate-spin' /> : hasFile ? <UploadCloud className='h-4 w-4' /> : <UploadCloud className='h-4 w-4' />} onClick={pickFile} disabled={uploading || deleting} loading={uploading || deleting} />

        <input ref={inputRef} type='file' accept='.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' className='hidden' onChange={handleSelected} />
      </div>

      {/* Preview / state */}
      <div className='mt-4'>
        {uploading && !hasFile ? (
          <div className='h-14 w-full rounded-xl bg-slate-200 animate-pulse' />
        ) : hasFile ? (
          <div className='relative flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3'>
            <a href={resolveUrl(fileUrl)} target='_blank' rel='noreferrer' className='inline-flex items-center gap-3 text-slate-800 hover:underline' title='Open file'>
              <FileText className='h-5 w-5' />
              <span className='truncate max-w-[60ch]'>{filenameFromUrl(fileUrl)}</span>
            </a>

            <Button className='!w-fit' color='red' name={deleting ? 'Deleting…' : 'Delete'} icon={deleting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />} onClick={handleDelete} loading={deleting || uploading} />

            {/* overlay while deleting */}
            {deleting && <div className='absolute inset-0 grid place-items-center rounded-xl bg-black/10 pointer-events-none' />}
          </div>
        ) : (
          <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500'>No file uploaded yet.</div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------ Page ---------------------------------- */
export default function Overview() {
  const [dirty, setDirty] = useState(false);
  const baselineRef = useRef(null); // holds the "last saved" snapshot
  const [reverting, setReverting] = useState(false); // optional spinner on revert

  const id = getUserInfo()?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // unified editable state per your requested shape
  const [state, setState] = useState({
    username: '',
    email: '',
    password: '', // optional new field for changing password
    type: '', // 'Business' | 'Individual'
    phone: '',
    profileImage: '',
    role: '',
    status: '',
    lastLogin: '',
    ownerType: '',
    description: '',
    languages: [],
    country: '',
    sellerLevel: '',
    skills: [],
    education: [],
    certifications: [],
    introVideoUrl: '',
    portfolioItems: [],
    portfolioFile: '',
    responseTime: null,
    deliveryTime: '',
    ageGroup: '',
    revisions: 0,
    preferences: {},
    balance: 0,
    totalSpent: 0,
    totalEarned: 0,
    reputationPoints: 0,
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
    let ignore = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const user = await api.get(`/auth/user/${id}`).then(r => r.data);

        if (ignore) return;

        // map API → editable state
        setState(s => ({
          ...s,
          username: user.username || '',
          email: user.email || '',
          type: user.type || '',
          phone: user.phone || '',
          profileImage: user.profileImage || '',
          role: user.role || '',
          status: user.status || '',
          lastLogin: user.lastLogin || '',
          ownerType: user.ownerType || '',
          description: user.description || '',
          languages: user.languages || [],
          country: user.country || '',
          sellerLevel: user.sellerLevel || '',
          skills: user.skills || [],
          education: Array.isArray(user.education) ? user.education : [],
          certifications: Array.isArray(user.certifications) ? user.certifications : [],
          introVideoUrl: user.introVideoUrl || '',
          portfolioItems: user.portfolioItems || [],
          portfolioFile: user.portfolioFile || '',
          responseTime: user.responseTime ?? null,
          deliveryTime: user.deliveryTime || '',
          ageGroup: user.ageGroup || '',
          revisions: user.revisions ?? 0,
          preferences: user.preferences || {},
          balance: Number(user.balance ?? 0),
          totalSpent: Number(user.totalSpent ?? 0),
          totalEarned: Number(user.totalEarned ?? 0),
          reputationPoints: Number(user.reputationPoints ?? 0),
          topRated: !!user.topRated,
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
          phone: user.phone || '',
          profileImage: user.profileImage || '',
          role: user.role || '',
          status: user.status || '',
          ownerType: user.ownerType || '',
          description: user.description || '',
          languages: user.languages || [],
          country: user.country || '',
          sellerLevel: user.sellerLevel || '',
          skills: user.skills || [],
          education: Array.isArray(user.education) ? user.education : [],
          certifications: Array.isArray(user.certifications) ? user.certifications : [],
          introVideoUrl: user.introVideoUrl || '',
          portfolioItems: user.portfolioItems || [],
          portfolioFile: user.portfolioFile || '',
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

        try {
          const s = await api.get('/auth/profile/stats', { params: { id } }).then(r => r.data);
          if (!ignore) {
            setStats(s);
            setState(prev => ({ ...prev, topRated: !!s?.topRated }));
          }
        } catch {
          // ignore missing stats
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
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
    setSaving(true);
    try {
      const payload = {
        username: state.username,
        email: state.email,
        password: state.password || undefined, // optional
        type: state.type,
        phone: state.phone,
        profileImage: state.profileImage,
        role: state.role, // if editable in your backend
        status: state.status, // if editable
        ownerType: state.ownerType,
        description: state.description,
        languages: state.languages,
        country: state.country,
        sellerLevel: state.sellerLevel,
        skills: state.skills,
        education: state.education,
        certifications: state.certifications,
        introVideoUrl: state.introVideoUrl,
        portfolioItems: state.portfolioItems,
        portfolioFile: state.portfolioFile,
        responseTime: state.responseTime,
        deliveryTime: state.deliveryTime,
        ageGroup: state.ageGroup,
        revisions: state.revisions,
        preferences: state.preferences,
        balance: state.balance,
        totalSpent: state.totalSpent,
        totalEarned: state.totalEarned,
        reputationPoints: state.reputationPoints,
      };

      await toast.promise(api.put(`/auth/profile`, payload), {
        loading: 'Saving profile...',
        success: 'Profile updated successfully ✅',
        error: 'Failed to update profile ❌',
      });

      // refresh minimal meta from server if you want
      const refreshed = await api.get(`/auth/user/${id}`).then(r => r.data);
      setMeta(m => ({
        ...m,
        memberSince: refreshed.memberSince ? toDateShort(refreshed.memberSince) : m.memberSince,
        referralCode: refreshed.referralCode || m.referralCode,
        referralCount: refreshed.referralCount ?? m.referralCount,
        referralRewardsCount: refreshed.referralRewardsCount ?? m.referralRewardsCount,
        referredBy: refreshed.referredBy || m.referredBy,
      }));

      baselineRef.current = stableStringify(pickEditable(state));
      setDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  /* --------------------------- Education/Cert modals ------------------------ */
  const onAddEducation = () => setEduOpen(true);
  const onAddCertification = () => setCertOpen(true);
  const onRemoveEducation = idx => setState(a => ({ ...a, education: a.education.filter((_, i) => i !== idx) }));
  const onRemoveCertification = idx => setState(a => ({ ...a, certifications: a.certifications.filter((_, i) => i !== idx) }));

  return (
    <div className='container !py-8'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        <div className='space-y-6 lg:col-span-3  '>
          <ProfileCard
            loading={loading}
            editing={editing}
            setEditing={setEditing}
            state={state}
            setState={setState}
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
                toast.success('Referral code copied to clipboard ✅');
              } else {
                toast.error('No referral code found');
              }
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
              country: state.country,
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
            onAddEducation={onAddEducation}
            onAddCertification={onAddCertification}
            onRemoveEducation={onRemoveEducation}
            onRemoveCertification={onRemoveCertification}
            countryOptions={countryOptions}
            onCountryChange={code => setState(s => ({ ...s, country: code }))}
            accountTypeOptions={accountTypeOptions}
            onTypeChange={t => setState(s => ({ ...s, type: t }))}
          />

          {/* {!loading && (
            <div className='flex items-center justify-end gap-3'>
              <Button color='secondary' name='Cancel' onClick={() => window.location.reload()} className='!w-auto !px-4' />
              <Button color='green' name={saving ? '' : 'Save changes'} loading={saving} onClick={saveAuthProfile} className='!w-auto !px-5' />
            </div>
          )} */}
        </div>

        <div className='space-y-6 lg:col-span-9 lg:sticky lg:top-30 h-fit'>
          <KPICard
            loading={loading}
            stats={{
              ordersCompleted: 0,
              repeatBuyers: state?.repeatBuyers || 0,
              averageRating: 0,
              topRated: state.topRated,
            }}
          />

          <Assets initialVideoUrl={state.introVideoUrl} initialImages={(state.portfolioItems || []).slice(0, 6).map(it => (typeof it === 'string' ? it : it?.url))} onVideoChange={url => setState(s => ({ ...s, introVideoUrl: url }))} onImagesChange={urls => setState(s => ({ ...s, portfolioItems: urls }))} />
          <PortfolioFileBox initialUrl={state?.portfolioFile || ''} />
        </div>

        {/* Bottom Save Drawer */}
        <div className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ${dirty ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className='mx-auto mb-4 w-[min(960px,92%)] rounded-2xl border border-emerald-200 bg-white/95 shadow-[0_20px_40px_rgba(0,0,0,0.12)] backdrop-blur'>
            <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='mt-[2px] h-5 w-5 text-amber-600' />
                <div>
                  <div className='font-semibold'>You have unsaved changes</div>
                  <div className='text-sm text-slate-600'>Don’t lose your edits. Save now or discard them.</div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  color='secondary'
                  name='Discard'
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
                <Button color='green' name={saving ? '' : 'Save changes'} loading={saving} onClick={saveAuthProfile} className='!w-auto !px-5' />
              </div>
            </div>
          </div>
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
  const { username, email, password, type, phone, profileImage, role, status, ownerType, description, languages, country, sellerLevel, skills, education, certifications, introVideoUrl, portfolioItems, portfolioFile, responseTime, deliveryTime, ageGroup, revisions, preferences, balance, totalSpent, totalEarned, reputationPoints } = state;
  return {
    username,
    email,
    password: password || undefined,
    type,
    phone,
    profileImage,
    role,
    status,
    ownerType,
    description,
    languages,
    country,
    sellerLevel,
    skills,
    education,
    certifications,
    introVideoUrl,
    portfolioItems,
    portfolioFile,
    responseTime,
    deliveryTime,
    ageGroup,
    revisions,
    preferences,
    balance,
    totalSpent,
    totalEarned,
    reputationPoints,
  };
}
