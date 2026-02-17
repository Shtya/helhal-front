'use client';

import { useTranslations } from 'next-intl';
import MonitorChatApp from '@/components/pages/chat/MonitorChatApp';

export default function MonitorPage() {
  const t = useTranslations('Dashboard.monitor');

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t('title')}</h1>
      <MonitorChatApp />
    </div>
  );
}