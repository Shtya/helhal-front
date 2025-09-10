'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Input from '@/components/atoms/Input'; 

import AOS from 'aos';
import 'aos/dist/aos.css';
import Textarea from '@/components/atoms/Textarea';
import { Pencil, Plus, X } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function Invite() {
  // ======= State =======
  const [rawEmails, setRawEmails] = useState('');
  const [validEmails, setValidEmails] = useState([]);
  const [invalidEmails, setInvalidEmails] = useState([]);

  const [link, setLink] = useState('https://helhal.page.link/ojYG');
  const [copied, setCopied] = useState(false);

  const [subject, setSubject] = useState('Join me on UpPhoto');
  const [senderName, setSenderName] = useState(''); // اختياري لتخصيص الرسالة
  const [message, setMessage] = useState('Hey! I’m using UpPhoto and I think you’ll love it.');

  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const [showPreview, setShowPreview] = useState(false);

  // ======= AOS =======
  useEffect(() => {
    AOS.init({ duration: 700, once: true, offset: 80, easing: 'ease-out' });
  }, []);

  // ======= Helpers =======
  const parsed = useMemo(() => {
    const tokens = rawEmails
      .split(/[\s,;]+/g)
      .map(s => s.trim())
      .filter(Boolean);

    const uniq = Array.from(new Set(tokens));
    const good = uniq.filter(e => EMAIL_RE.test(e));
    const bad = uniq.filter(e => !EMAIL_RE.test(e));
    return { good, bad };
  }, [rawEmails]);

  useEffect(() => {
    setValidEmails(parsed.good);
    setInvalidEmails(parsed.bad);
  }, [parsed]);

  const canSend = validEmails.length > 0 && !sending;

  const inviteBodyResolved = useMemo(() => {
    const base = message.replace('{link}', link).trim();
    const withName = senderName ? `${base}\n\n— ${senderName}` : base;
    return withName;
  }, [message, link, senderName]);

  const gmailHref = useMemo(() => {
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inviteBodyResolved)}`;
  }, [subject, inviteBodyResolved]);

  const shareLinks = useMemo(
    () => ({
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(link)}&description=${encodeURIComponent(subject)}`,
      gmail: gmailHref,
    }),
    [link, subject, gmailHref],
  );

  // ======= Actions =======
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert('Could not copy the link.');
    }
  };

  const handleSendInvites = async () => {
    if (!canSend) return;
    setSending(true);
    // 👇 هنا تتصل بالباك-إند الفعلي. حاليا محاكاة:
    await new Promise(r => setTimeout(r, 900));
    setSending(false);
    setSentCount(validEmails.length);
    setRawEmails('');
  };

  const handleTikTok = async e => {
    e.preventDefault();
    // لا يوجد Share رسمي للويب → ننسخ الرابط كخيار منطقي
    await handleCopy();
  };

  // ======= UI =======
  return (
    <div className='container !mt-8' >
      {/* Hero */}
      <section
        className='relative h-[420px] md:h-[520px] lg:h-[560px] w-full rounded-3xl overflow-hidden flex items-center justify-center text-center'
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-aos='fade-up'>
        <div className='absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black/50' />
        <div className='relative z-10 max-w-4xl mx-auto px-6 text-white' data-aos='zoom-in' data-aos-delay='150'>
          <h1 className='text-left text-3xl md:text-5xl font-extrabold mb-4 leading-tight'>Take the credit for referring friends to UpPhoto</h1>
          <p className='text-left text-lg md:text-2xl text-white/90'>
            Earn up to <b>US$500</b> in credits — up to <b>US$100</b> from each referral.
          </p>
        </div>
      </section>

      {/* Card */}
      <div className='rounded-[24px] shadow-inner border border-slate-200 p-6 md:p-10 mt-10 bg-white' data-aos='fade-up' data-aos-delay='150'>
        {/* Inputs Row */}
        <div className='grid grid-cols-1 lg:grid-cols-2 max-w-[1100px] mx-auto gap-8 items-start'>
          {/* Emails */}
          <div className='flex flex-col gap-4' data-aos='fade-right' data-aos-delay='200'>
            <Input cnInput='!h-[52px] !rounded-xl' label='Invite friends through email' cnLabel='text-base md:text-lg' placeholder='Add emails (separate with commas, spaces, or new lines)' actionIcon='/icons/send-arrow.svg' onAction={handleSendInvites} value={rawEmails} onChange={setRawEmails} className='h-[56px]' disabled={sending} />

            {/* Helper + Preview */}
            <div className='flex flex-wrap items-center justify-between mt-5 gap-3 text-sm'>
              <span className='text-slate-600'>Separate emails with commas, spaces, or new lines.</span>
              <div className='flex items-center gap-3'>
                <button onClick={() => setShowPreview(true)} className='text-emerald-700 hover:text-emerald-800 underline underline-offset-2'>
                  Preview Email
                </button>
                <button onClick={() => setRawEmails('')} className='text-slate-500 hover:text-slate-700 underline underline-offset-2'>
                  Clear
                </button>
              </div>
            </div>

            {/* Chips */}
            {(validEmails.length > 0 || invalidEmails.length > 0) && (
              <div className='flex flex-wrap gap-2' data-aos='fade-up' data-aos-delay='0'>
                {validEmails.map(e => (
                  <span key={`good-${e}`} className='px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs border border-emerald-200'>
                    {e}
                  </span>
                ))}
                {invalidEmails.map(e => (
                  <span key={`bad-${e}`} className='px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs border border-rose-200'>
                    {e}
                  </span>
                ))}
              </div>
            )}

            {/* Stats + Send button */}
            <div className='mt-1 flex items-center justify-between'>
              <div className='text-sm text-slate-600'>
                <b className='text-emerald-700'>{validEmails.length}</b> valid • <b className='text-rose-600'>{invalidEmails.length}</b> invalid
              </div>

              <button onClick={handleSendInvites} disabled={!canSend} className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed'>
                {sending ? (
                  <span className='animate-pulse'>Sending…</span>
                ) : (
                  <div className='cursor-pointer flex items-center gap-2 '>
                    Send invites
                    <img src='/icons/send-arrow.svg' alt='' className='w-4' />
                  </div>
                )}
              </button>
            </div>

            {sentCount > 0 && (
              <div className='text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2' data-aos='fade-in'>
                Successfully sent to {sentCount} {sentCount === 1 ? 'email' : 'emails'}.
              </div>
            )}
          </div>

          {/* Link + personalization */}
          <div className='flex flex-col gap-5' data-aos='fade-left' data-aos-delay='200'>
            <Input cnInput='!h-[52px] !rounded-xl' label='Your unique invite link' cnLabel='text-base md:text-lg' placeholder='https://…' actionIcon='/icons/copy.svg' onAction={handleCopy} value={link} onChange={setLink} className='h-[56px]' />
            <div className='flex items-center gap-3 mt-5 '>
              <button onClick={handleCopy} className='h-9 px-4 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition'>
                Copy
              </button>
              <span className={`text-sm ${copied ? 'text-emerald-700' : 'text-slate-500'}`}>{copied ? 'Copied!' : 'Share your link or use social buttons below.'}</span>
            </div>

            <div className='rounded-xl border border-slate-200 p-4 bg-slate-50/50' data-aos='fade-up' data-aos-delay='50'>
              <div className='grid grid-cols-1 md:grid-cols-2 mb-3 gap-3'>
                <Input label='Email subject' placeholder='Subject…' value={subject} onChange={setSubject} />
                <Input label='Your name (optional)' placeholder='e.g., Mohamed' value={senderName} onChange={setSenderName} />
              </div>
              <Textarea placeholder='Write your invite message…' value={message} onChange={e => setMessage(e.target.value)} rows={4} label={`Message`} />
            </div>
          </div>
        </div>

        {/* Social */}
        <div className='mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10' data-aos='zoom-in-up' data-aos-delay='150'>
          <IconLink href={shareLinks.linkedin} src='/social/linkedin.png' alt='LinkedIn' />
          <IconLink href={shareLinks.gmail} src='/social/google.png' alt='Gmail' />
          <IconLink href='#' onClick={handleTikTok} src='/social/tiktok.png' alt='TikTok (copy link)' />
          <IconLink href={shareLinks.pinterest} src='/social/pinterist.png' alt='Pinterest' />
          <IconLink href={shareLinks.facebook} src='/social/facebook.png' alt='Facebook' />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className='fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4' data-aos='fade-in'>
          <div className='bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6' data-aos='zoom-in'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>Email preview</h3>
              <button onClick={() => setShowPreview(false)} className='w-8 h-8 rounded-lg hover:bg-slate-100 grid place-items-center' aria-label='Close'>
                ✕
              </button>
            </div>

            <div className='space-y-3'>
              <div className='text-sm text-slate-600'>
                <b>To:</b> {validEmails.length ? validEmails.join(', ') : <span className='italic'>No recipients</span>}
              </div>
              <div className='text-sm text-slate-600'>
                <b>Subject:</b> {subject}
              </div>
              <pre className='mt-2 text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 whitespace-pre-wrap'>{inviteBodyResolved}</pre>
            </div>

            <div className='mt-6 flex items-center justify-end gap-3'>
              <a href={gmailHref} className='rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-black transition'>
                Open in email client
              </a>
              <button onClick={() => setShowPreview(false)} className='rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 transition'>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconLink({ href, src, alt, onClick }) {
  return (
    <a href={href} onClick={onClick} target={href?.startsWith('http') ? '_blank' : undefined} rel='noreferrer' className='inline-flex items-center justify-center max-md:w-8 max-md:h-8 w-16 h-16 rounded-full hover:scale-105 transition' aria-label={alt} data-aos='fade'>
      <img src={src} alt={alt} className='w-[70px] h-[70px] object-contain' />
    </a>
  );
}

export function Card({ className = '', children }) {
  return <div className={['rounded-2xl border border-[#EDEDED] bg-white shadow-[0_1px_0_#EDEDED,0_16px_40px_rgba(0,0,0,0.04)]', className].join(' ')}>{children}</div>;
}

export function SectionHeader({ title, onEdit, withEdit }) {
  return (
    <div className='flex items-center justify-between'>
      <h3 className='text-2xl font-bold text-[#000000]'>{title}</h3>
      {withEdit && (
        <button onClick={onEdit} aria-label={`Edit ${title}`} className='inline-flex items-center justify-center rounded-xl border border-[#108A00] text-[#108A00] p-2 hover:bg-[#108A00]/5 transition'>
          <Pencil className='h-4 w-4' />
        </button>
      )}
    </div>
  );
}

export function RemovablePill({ label, onRemove }) {
  return (
    <span className='relative inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-[#292D32] ring-1 ring-[#EDEDED] shadow'>
      {label}
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${label}`} className='absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-[#EDEDED] hover:bg-slate-50'>
          <X className='h-3.5 w-3.5' />
        </button>
      )}
    </span>
  );
}

export function RowWithAdd({ title, onAdd, children }) {
  return (
    <div>
      <div className='flex items-center justify-between'>
        <h4 className='text-xl font-semibold text-[#292D32]'>{title}</h4>
        <button onClick={onAdd} aria-label={`Add to ${title}`} className='inline-flex items-center justify-center rounded-xl border border-[#108A00] text-[#108A00] p-2 hover:bg-[#108A00]/5 transition'>
          <Plus className='h-4 w-4' />
        </button>
      </div>
      <div className='mt-3 flex flex-wrap gap-3'>{children}</div>
    </div>
  );
}
