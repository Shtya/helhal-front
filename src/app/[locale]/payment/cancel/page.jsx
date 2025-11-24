'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function PaymentCancelPage() {
  const t = useTranslations('Payment.cancel');
  
  return (
    <div className="container max-w-lg py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold text-rose-600">{t('title')}</h1>
      <p className="mb-8 text-slate-700">{t('description')}</p>
      <Link href="/my-jobs" className="text-rose-700 underline">
        {t('backToJobs')}
      </Link>
    </div>
  );
}
