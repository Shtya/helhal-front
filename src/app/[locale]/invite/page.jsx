'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Input from '@/components/atoms/Input';

import AOS from 'aos';
import 'aos/dist/aos.css';
import Textarea from '@/components/atoms/Textarea';
import { Pencil, Plus, X, Users, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import z from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useLocale, useTranslations } from 'next-intl';
import FAQSection from '@/components/common/Faqs';
import { useValues } from '@/context/GlobalContext';

const emailSchema = z.email();

export default function Invite() {
  // ======= State =======
  const t = useTranslations('Invite.page');
  const { user } = useAuth();
  const [rawEmails, setRawEmails] = useState('');
  const [validEmails, setValidEmails] = useState([]);
  const [invalidEmails, setInvalidEmails] = useState([]);

  const [link, setLink] = useState('');

  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState('');
  const [senderName, setSenderName] = useState(user?.username || '');

  const locale = useLocale();
  const { settings, loadingSettings } = useValues();
  const faqs = locale === 'ar' ? settings?.inviteFaqs_ar : settings?.inviteFaqs_en;

  useEffect(() => {
    setSenderName(user?.username || '');
  }, [user])

  const [message, setMessage] = useState('');


  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const [showPreview, setShowPreview] = useState(false);

  //init link with referral code
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://helhal.page.link';

    if (user?.referralCode) {
      setLink(`${origin}/ar/auth?tab=register&ref=${user.referralCode}`);
    } else {
      setLink(origin); // fallback to main domain
    }
  }, [user]);
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
    const good = uniq.filter(e => emailSchema.safeParse(e).success);
    const bad = uniq.filter(e => !emailSchema.safeParse(e).success);
    return { good, bad };
  }, [rawEmails]);

  useEffect(() => {
    setValidEmails(parsed.good);
    setInvalidEmails(parsed.bad);
  }, [parsed]);

  const canSend =
    validEmails.length > 0 &&
    !sending;

  const inviteBodyResolved = useMemo(() => {
    const base = message.replace('{link}', link).trim();
    const withName = senderName ? `${base}\n\n— ${senderName}` : base;
    return withName;
  }, [message, link, senderName]);


  function sanitizeText(text) {
    return text
      .replace(/[“”‘’–—]/g, "'") // replace smart quotes/dashes with plain ones
      .replace(/\n/g, '\r\n'); // proper line breaks for email clients
  }

  const gmailHref = useMemo(() => {
    const recipients = validEmails.join(',');
    const subjectEncoded = encodeURIComponent(sanitizeText(subject.trim()));
    const bodyEncoded = encodeURIComponent(sanitizeText(inviteBodyResolved));

    return `mailto:${recipients}?subject=${subjectEncoded}&body=${bodyEncoded}`;
  }, [validEmails, subject, inviteBodyResolved]);



  const shareLinks = useMemo(
    () => ({
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(link)}&description=${encodeURIComponent(subject)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(subject)}&hashtags=Helhal,Freelance`,
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
      toast.error(t('errors.couldNotCopy'));
    }
  };

  const handleSendInvites = async () => {
    if (!canSend) return;

    if (subject.trim().length < 5) {
      toast.error(t('errors.subjectTooShort'));
      return;
    }

    if (message.trim().length < 7) {
      toast.error(t('errors.messageTooShort'));
      return;
    }

    setSending(true);

    try {
      const res = await api.post('/invite/send', {
        emails: validEmails,
        subject: subject.trim(),
        senderName: senderName.trim(),
        message: message.trim(),
      });

      toast.success(t('successfullySent', { count: validEmails.length }));
      setSentCount(validEmails.length);
      setRawEmails('');
    } catch (e) {
      toast.error(t('errors.failedToSend'));
    } finally {
      setSending(false);
    }
  };


  const handleTikTok = async e => {
    e.preventDefault();
    // لا يوجد Share رسمي للويب → ننسخ الرابط كخيار منطقي
    await handleCopy();
  };

  // ======= UI =======
  return (
    <div className='container !mt-8'>
      {/* Hero - Already works well with text-white and overlay */}
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
          <h1 className='text-left text-3xl md:text-5xl font-extrabold mb-4 leading-tight'>
            {t('hero.title')}
          </h1>

          <p className='text-start text-lg md:text-2xl text-white/90'>
            {t.rich('hero.subtitle', {
              strong: (chunk) => <strong className='text-white font-semibold'>{chunk}</strong>
            })}
          </p>
        </div>
      </section>

      {/* Main Card */}
      <div className='rounded-[24px] space-y-6 md:space-y-10 lg:space-y-14 shadow-inner border border-slate-200 dark:border-dark-border p-6 md:p-10 mt-10 bg-white dark:bg-dark-bg-card' data-aos='fade-up' data-aos-delay='150'>

        {/* Inputs Row */}
        <div className='grid grid-cols-1 lg:grid-cols-2 max-w-[1100px] mx-auto gap-8 items-start'>

          {/* Emails Section */}
          <div className='flex flex-col gap-4' data-aos='fade-right' data-aos-delay='200'>
            <Input
              cnInput='!h-[52px] !rounded-xl dark:bg-dark-bg-input dark:border-dark-border dark:text-dark-text-primary'
              label={t('inviteFriends')}
              cnLabel='text-base md:text-lg dark:text-dark-text-primary'
              placeholder={t('addEmailsPlaceholder')}
              actionIcon='/icons/send-arrow.svg'
              onAction={handleSendInvites}
              value={rawEmails}
              onChange={(e) => setRawEmails(e.target.value)}
              className='h-[56px]'
              disabled={sending}
            />

            {/* Helper + Preview */}
            <div className='flex flex-wrap items-center justify-between mt-5 gap-3 text-sm'>
              <span className='text-slate-600 dark:text-dark-text-secondary'>{t('separateEmails')}</span>
              <div className='flex items-center gap-3'>
                <button onClick={() => setShowPreview(true)} className='text-main-700 dark:text-main-400 hover:underline underline-offset-2'>
                  {t('previewEmail')}
                </button>
                <button onClick={() => setRawEmails('')} className='text-slate-500 dark:text-dark-text-secondary hover:text-slate-700 dark:hover:text-dark-text-primary underline underline-offset-2'>
                  {t('clear')}
                </button>
              </div>
            </div>

            {/* Chips */}
            {(validEmails.length > 0 || invalidEmails.length > 0) && (
              <div className='flex flex-wrap gap-2'>
                {validEmails.map(e => (
                  <span key={`good-${e}`} className='px-2.5 py-1 rounded-full bg-main-50 dark:bg-main-900/20 text-main-700 dark:text-main-400 text-xs border border-main-200 dark:border-main-800'>
                    {e}
                  </span>
                ))}
                {invalidEmails.map(e => (
                  <span key={`bad-${e}`} className='px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-800'>
                    {e}
                  </span>
                ))}
              </div>
            )}

            {/* Stats + Send button */}
            <div className='mt-1 flex items-center justify-between'>
              <div className='text-sm text-slate-600 dark:text-dark-text-secondary'>
                <b className='text-main-700 dark:text-main-400'>{validEmails.length}</b> {t('valid')} • <b className='text-rose-600 dark:text-rose-400'>{invalidEmails.length}</b> {t('invalid')}
              </div>

              <button onClick={handleSendInvites} disabled={!canSend} className='inline-flex items-center gap-2 rounded-xl bg-main-600 text-white px-4 py-2 text-sm font-medium hover:bg-main-700 transition disabled:opacity-50 disabled:cursor-not-allowed'>
                {sending ? <span className='animate-pulse'>{t('sending')}</span> : <div className='flex items-center gap-2'>{t('sendInvites')} <img src='/icons/send-arrow.svg' alt='' className='w-4' /></div>}
              </button>
            </div>
          </div>

          {/* Link + personalization */}
          <div className='flex flex-col gap-5' data-aos='fade-left' data-aos-delay='200'>
            <Input
              cnInput='!h-[52px] !rounded-xl dark:bg-dark-bg-input dark:border-dark-border dark:text-dark-text-primary'
              label={t('uniqueLink')}
              cnLabel='text-base md:text-lg dark:text-dark-text-primary'
              placeholder='https://…'
              actionIcon='/icons/copy.svg'
              onAction={handleCopy}
              value={link}
              onChange={setLink}
              className='h-[56px]'
            />
            <div className='flex items-center gap-3 mt-5 '>
              <button onClick={handleCopy} className='h-9 px-4 rounded-md bg-main-600 text-white text-sm font-medium hover:bg-main-700 transition'>
                {t('copy')}
              </button>
              <span className={`text-sm ${copied ? 'text-main-700 dark:text-main-400' : 'text-slate-500 dark:text-dark-text-secondary'}`}>{copied ? t('copied') : t('shareLink')}</span>
            </div>

            <div className='rounded-xl border border-slate-200 dark:border-dark-border p-4 bg-slate-50/50 dark:bg-dark-bg-input/50'>
              <div className='grid grid-cols-1 md:grid-cols-2 mb-3 gap-3'>
                <Input label={t('emailSubject')} cnLabel="dark:text-dark-text-primary" cnInput="dark:bg-dark-bg-input dark:border-dark-border dark:text-dark-text-primary" value={subject} onChange={e => setSubject(e.target.value)} />
                <Input label={t('yourName')} cnLabel="dark:text-dark-text-primary" cnInput="dark:bg-dark-bg-input dark:border-dark-border dark:text-dark-text-primary" value={senderName} onChange={e => setSenderName(e.target.value)} />
              </div>
              <Textarea
                className="dark:bg-dark-bg-input dark:border-dark-border dark:text-dark-text-primary"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                label={t('message')}
                cnLabel="dark:text-dark-text-primary"
              />
            </div>
          </div>
        </div>

        {/* Referral Info Section */}
        <div data-aos="zoom-in-up" data-aos-delay="150" className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold dark:text-dark-text-primary mb-8">
            {t("referral.title")}
          </h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            {t.raw('referral.description').map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg-input p-5 shadow-sm hover:shadow-md transition-all"
              >
                <span className="mt-2 h-2 w-2 flex-none rounded-full bg-main-600" />
                <p className="text-slate-700 dark:text-dark-text-secondary text-base text-start leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ & Social */}
        <section data-aos='zoom-in-up' data-aos-delay='150'>
          <FAQSection faqs={faqs} loading={loadingSettings} />
        </section>

        <div className='flex flex-wrap items-center justify-center gap-6 md:gap-10' data-aos='zoom-in-up' data-aos-delay='150'>
          <IconLink href={shareLinks.linkedin} src='/social/linkedin.png' alt='LinkedIn' className="dark:brightness-90 hover:dark:brightness-110" />
          <IconLink href={shareLinks.gmail} src='/social/google.png' alt='Gmail' />
          <IconLink href={shareLinks.twitter} src='/social/twitter.png' alt='twitter' className="dark:invert" />
          {/* ... other social links */}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className='fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'>
          <div className='bg-white dark:bg-dark-bg-card rounded-2xl shadow-xl w-full max-w-2xl p-6 border dark:border-dark-border'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold dark:text-dark-text-primary'>{t('emailPreview')}</h3>
              <button onClick={() => setShowPreview(false)} className='w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-bg-input dark:text-dark-text-primary'>✕</button>
            </div>
            <div className='space-y-3'>
              <div className='text-sm text-slate-600 dark:text-dark-text-secondary'>
                <b className="dark:text-dark-text-primary">{t('to')}</b> {validEmails.length ? validEmails.join(', ') : <span className='italic'>{t('noRecipients')}</span>}
              </div>
              <div className='text-sm text-slate-600 dark:text-dark-text-secondary'>
                <b className="dark:text-dark-text-primary">{t('subject')}</b> {subject}
              </div>
              <pre className='mt-2 text-sm bg-slate-50 dark:bg-dark-bg-input border border-slate-200 dark:border-dark-border rounded-xl p-3 whitespace-pre-wrap dark:text-dark-text-secondary'>{inviteBodyResolved}</pre>
            </div>
            <div className='mt-6 flex items-center justify-end gap-3'>
              <button onClick={() => setShowPreview(false)} className='rounded-xl border border-slate-300 dark:border-dark-border px-4 py-2 text-sm dark:text-dark-text-primary hover:bg-slate-50 dark:hover:bg-dark-bg-input transition'>
                {t('close')}
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
    <a
      href={href}
      onClick={onClick}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel='noreferrer'
      className='inline-flex items-center justify-center max-md:w-8 max-md:h-8 w-16 h-16 rounded-full hover:scale-105 transition bg-transparent dark:hover:bg-dark-bg-card'
      aria-label={alt}
      data-aos='fade'
    >
      <img
        src={src}
        alt={alt}
        className='w-[70px] h-[70px] object-contain dark:brightness-90 dark:contrast-125'
      />
    </a>
  );
}

export function Card({ className = '', children }) {
  return (
    <div className={[
      'rounded-2xl border border-[#EDEDED] bg-white shadow-[0_1px_0_#EDEDED,0_16px_40px_rgba(0,0,0,0.04)]',
      'dark:border-dark-border dark:bg-dark-bg-card dark:shadow-none',
      className
    ].join(' ')}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, onEdit, withEdit }) {
  return (
    <div className='flex items-center justify-between'>
      {/* Replaced #000000 with dark-text-primary */}
      <h3 className='text-2xl font-bold text-[#000000] dark:text-dark-text-primary'>{title}</h3>
      {withEdit && (
        <button
          onClick={onEdit}
          aria-label={`Edit ${title}`}
          className='inline-flex items-center justify-center rounded-xl border border-[var(--color-main-600)] text-[var(--color-main-600)] p-2 hover:bg-[var(--color-main-600)]/5 transition dark:border-main-500 dark:text-main-500'
        >
          <Pencil className='h-4 w-4' />
        </button>
      )}
    </div>
  );
}

export function RemovablePill({ label, onRemove }) {
  return (
    <span className={[
      'relative inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-[#292D32] ring-1 ring-[#EDEDED] shadow',
      'dark:bg-dark-bg-input dark:text-dark-text-secondary dark:ring-dark-border dark:shadow-none'
    ].join(' ')}>
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className='absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-[#EDEDED] hover:bg-slate-50 dark:bg-dark-bg-card dark:ring-dark-border dark:hover:bg-dark-bg-input'
        >
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
        {/* Replaced #292D32 with dark-text-primary for better contrast on headings */}
        <h4 className='text-xl font-semibold text-[#292D32] dark:text-dark-text-primary'>{title}</h4>
        <button
          onClick={onAdd}
          aria-label={`Add to ${title}`}
          className='inline-flex items-center justify-center rounded-xl border border-[var(--color-main-600)] text-[var(--color-main-600)] p-2 hover:bg-[var(--color-main-600)]/5 transition dark:border-main-500 dark:text-main-500'
        >
          <Plus className='h-4 w-4' />
        </button>
      </div>
      <div className='mt-3 flex flex-wrap gap-3'>{children}</div>
    </div>
  );
}