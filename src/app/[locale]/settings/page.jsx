'use client';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import Tabs from '@/components/common/Tabs';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import { Switcher } from '@/components/atoms/Switcher';
import { AnimatedCheckbox } from '@/components/atoms/CheckboxAnimation';
import { Divider } from '@/app/[locale]/services/[category]/[service]/page';
import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/common/Modal';
import { maskEmail } from '@/utils/helper';
import FormErrorMessage from '@/components/atoms/FormErrorMessage';
import { usernameSchema } from '@/utils/profile';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';


export default function Page() {
  const t = useTranslations('Settings');
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { label: t('tabs.account'), value: 'account' },
    { label: t('tabs.security'), value: 'security' },
    // { label: 'Notifications', value: 'notifications' },
  ];

  return (
    <main className='container flex flex-col items-center !max-w-[700px] mx-auto !mt-6'>
      <Tabs tabs={tabs} setActiveTab={setActiveTab} activeTab={activeTab} />
      <div className='py-6 md:py-10 w-full'>
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }} className='w-full mx-auto rounded-2xl border border-slate-100 bg-white p-6 md:p-10 shadow-sm'>
          {activeTab === 'account' && <AccountSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </motion.div>
      </div>
    </main>
  );
}

const formSchema = z.object({
  username: usernameSchema,
  email: z.string().email('Invalid email address'),
});


function AccountSettings() {
  const t = useTranslations('Settings.account');
  const reasons = [
    { id: 'platform', name: t('reasons.platform') },
    { id: 'price', name: t('reasons.price') },
    { id: 'features', name: t('reasons.features') },
    { id: 'other', name: t('reasons.other') },
  ];
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  });


  const { user: me, setCurrentUser, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState(null);
  const [customReason, setCustomReason] = useState('');

  const [pendingEmail, setPendingEmail] = useState(me?.pendingEmail);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  function startResendCooldown() {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    setPendingEmail(me?.pendingEmail);
  }, [me?.pendingEmail]);


  useEffect(() => {
    setValue('username', me?.username || '');
    setValue('email', me?.email || '');
  }, [me]);

  const saveProfile = handleSubmit(async ({ username, email }) => {
    setSaving(true);


    try {
      const updates = [];

      if (username && username !== me?.username) {
        updates.push(
          api.put('/auth/profile', { username }).then(res => {
            const updatedUsername = res.data?.username;
            if (updatedUsername) {
              setValue('username', updatedUsername);
              setCurrentUser(prev => ({ ...prev, username: updatedUsername }));
            }
          })
        );
      }

      if (email && email !== me?.email && resendCooldown <= 0) {
        updates.push(
          api.post('/auth/request-email-change', { newEmail: email }).then(() => {
            startResendCooldown(); // trigger cooldown
            setPendingEmail(email);
            setCurrentUser(prev => ({ ...prev, pendingEmail: email }));
          })
        );
      }


      if (updates.length === 0) return;

      await Promise.all(updates);

      toast.success(t('toast.changesSaved'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('toast.failedToSave'));
    } finally {
      setSaving(false);
    }
  })
  const [resendLoading, setResendLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  async function resendEmail() {
    try {
      setResendLoading(true);
      await api.post('/auth/resend-email-confirmation');
      toast.success(t('toast.emailResent'));
      startResendCooldown(); // trigger cooldown
    } catch (err) {
      toast.error(err?.response?.data?.message || t('toast.failedToResend'));
    } finally {
      setResendLoading(false);
    }
  }

  async function cancelEmailChange() {
    try {
      setCancelLoading(true);
      await api.post('/auth/cancel-email-change');
      setPendingEmail(null);
      setCurrentUser(prev => ({ ...prev, pendingEmail: null }));
      toast.success(t('toast.changeCanceled'));
    } catch (err) {
      toast.error(t('toast.failedToCancel'));
    } finally {
      setCancelLoading(false);
    }
  }

  async function deactivate() {
    const finalReason = reason === 'other' ? customReason : reason;
    if (!finalReason?.trim()) return;
    setDeactivating(true);
    try {

      await api.post('/auth/account-deactivation', { reason: finalReason?.trim() });
      await logout();
      window.location.href = '/';
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div>
      {pendingEmail && (
        <div className=' max-w-[450px] mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md text-sm text-gray-800'>
          <p>
            {t.rich('pendingEmail', {
              email: maskEmail(pendingEmail),
              strong: (chunk) => <strong>{chunk}</strong>
            })}
          </p>

          <div className='grid items-center grid-cols-1 xs:grid-cols-2 gap-2'>
            <Button
              name={cancelLoading ? t('canceling') : t('cancelRequest')}
              color='gray'
              className='mt-2 text-sm !text-red-600 !bg-transparent'
              onClick={cancelEmailChange}
              disabled={cancelLoading || resendLoading}
            />

            {resendCooldown > 0 ? (
              <span className='mt-2 text-sm text-blue-600 text-nowrap text-center'>
                {t('resendIn', { seconds: resendCooldown })}
              </span>
            ) : (
              <Button
                name={resendLoading ? t('resending') : t('resendEmail')}
                color='green'
                className='mt-2 text-sm'
                onClick={resendEmail}
                disabled={resendLoading || cancelLoading}
              />
            )}
          </div>
        </div>
      )}

      <h2 className='text-xl font-semibold text-gray-800'>{t('updateProfile')}</h2>

      <Input
        label={t('username')}
        placeholder='Enter Text'
        className='mt-6 max-w-[450px] w-full'
        error={errors.username?.message && t(`errors.${errors.username?.message}`)}
        {...register('username')}
      />


      <Input
        label={t('email')}
        placeholder='you@example.com'
        type='email'
        className='mt-6 max-w-[450px] w-full'
        error={errors.email?.message}
        {...register('email')}
      />



      <Button name={saving ? '' : t('saveChanges')} loading={saving} className='mt-6 max-w-[450px] w-full !rounded-md ' onClick={saveProfile} />

      <Divider className='!my-8' />

      <h3 className='p !opacity-100'>{t('accountDeactivation')}</h3>
      <p className='text-sm opacity-90 mt-2'>{t('deactivationDescription')}</p>
      <div className='mt-3 space-y-1 text-sm text-gray-600'>
        <p>• {t('deactivationPoints.profileHidden')}</p>
        <p>• {t('deactivationPoints.ordersCancelled')}</p>
      </div>

      <Select className='mt-6 max-w-[450px] w-full' cnLabel='!text-sm opacity-90 mt-2' label={t('leavingReason')} placeholder={t('chooseReason')} value={reason} onChange={opt => setReason(opt?.id)} options={reasons} />
      {reason === 'other' && (
        <Input
          label={t('tellUsWhy')}
          placeholder={t('yourReason')}
          className='mt-4 max-w-[450px] w-full'
          value={customReason}
          onChange={e => {
            const value = e.target.value.slice(0, 500)
            setCustomReason(value)
          }}
        />
      )}

      <Button name={t('deactivateAccount')} color='red' loading={deactivating} className='mt-6 max-w-[450px] w-full !rounded-md' onClick={() => {
        const finalReason = reason === 'other' ? customReason : reason;
        if (!finalReason?.trim()) return;
        setConfirmOpen(true)
      }} />
      {confirmOpen && (
        <Modal title={t('confirmDeactivation')} onClose={() => setConfirmOpen(false)}>
          <p className='text-sm text-gray-700 mb-4'>
            {t('confirmMessage')}
          </p>
          <div className='flex justify-end gap-3'>
            <Button
              name={t('cancel')}
              variant='ghost'
              onClick={() => setConfirmOpen(false)}
            />
            <Button
              name={t('yesDeactivate')}
              color='red'
              loading={deactivating}
              onClick={deactivate}
            />
          </div>
        </Modal>
      )}

    </div>
  );
}


const securitySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
});


function SecuritySettings() {
  const t = useTranslations('Settings.security');
  const { user: me, loadingUser, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMore, setLoadMore] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);
  const [revoking, setRevoking] = useState(null);

  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const limit = 50;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(securitySchema),
  });


  const loading = loadingSessions || loadingUser;

  async function loadInitial() {
    setLoadingSessions(true);
    try {
      const res = await api
        .get("/auth/sessions", { params: { limit } })
        .then((r) => r.data);

      setSessions(res.data);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadMore() {
    if (!hasMore) return;

    setLoadMore(true);
    try {
      const res = await api
        .get("/auth/sessions", {
          params: {
            limit,
            cursor,
          },
        })
        .then((r) => r.data);

      setSessions((prev) => [...prev, ...res.data]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    }
    finally {
      setLoadMore(false);
    }
  }


  useEffect(() => {
    loadInitial();
  }, []);


  async function onSubmit(data) {
    try {
      await api.put('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(t('toast.passwordUpdated'));
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || t('toast.failedToUpdate'));
    }
  }


  async function revoke(id) {
    setRevoking(id);
    try {
      await api.delete(`/auth/sessions/${id}`);
      if (me?.currentDeviceId === id) {
        // if current session is revoked, log out
        await logout();
        window.location.href = '/';
      }
      setSessions(prev => prev.map(s => (s.id === id ? { ...s, revokedAt: new Date().toISOString() } : s)));
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllOthers() {
    try {
      setRevokingAll(true)
      await api.post('/auth/logout-all'); // keeps current
      await loadInitial();
    }
    finally {
      setRevokingAll(false)

    }
  }

  return (
    <div>
      <h2 className='text-xl font-semibold text-gray-800'>{t('changePassword')}</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={t('currentPassword')}
          type='password'
          className='mt-6 max-w-[450px] w-full'
          {...register('currentPassword')}
          error={errors.currentPassword?.message}
        />
        <Input
          label={t('newPassword')}
          type='password'
          className='mt-3 max-w-[450px] w-full'
          {...register('newPassword')}
          error={errors.newPassword?.message}
        />
        <Input
          label={t('confirmPassword')}
          type='password'
          className='mt-3 max-w-[450px] w-full'
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <Button
          name={t('saveChanges')}
          loading={isSubmitting}
          className='mt-6 max-w-[450px] w-full !rounded-md'
          color='green'
          type='submit'
        />
      </form>


      <Divider className='!my-8' />

      <div className='border border-slate-200 rounded-lg p-4'>
        <h2 className='text-xl font-semibold'>{t('connectedDevices')}</h2>
        <Divider className='!my-3' />

        {/* skeleton loader */}
        {loading && (
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className=' '>
                <div className=' shimmer h-4 bg-slate-200 rounded w-2/3 mb-2' />
                <div className=' shimmer h-3 bg-slate-100 rounded w-1/2' />
                <Divider className=' shimmer !my-3' />
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className='overflow-auto' style={{ maxHeight: 300 }}>
            {sessions.length === 0 && <p className='text-sm text-gray-600'>{t('noActiveSessions')}</p>}
            {sessions.map((s, i) => {
              // ✅ compare current session id with row id
              const isThisDevice = !!(me?.currentDeviceId && s.id && me?.currentDeviceId === s.id);
              const killed = !!s.revokedAt;
              const meta = `${s.browser || 'Unknown'}${s.os ? `, ${s.os}` : ''}${s.deviceType ? ` (${s.deviceType})` : ''}`;
              return (
                <div key={s.id} className={`py-3 px-2 ${i !== sessions.length - 1 ? 'border-b border-slate-200' : ''}`}>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <p className='font-medium text-gray-800'>
                        {meta}
                        {isThisDevice && <span className='ml-2 text-emerald-600 text-xs font-semibold'>{t('thisDevice')}</span>}
                        {killed && <span className='ml-2 text-red-600 text-xs font-semibold'>{t('signedOut')}</span>}
                      </p>
                      <p className='text-sm text-gray-600'>
                        IP {s.ipAddress || '—'} · {t('lastActivity', { date: fmt(s.lastActivity) })}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>{!killed ? <Button name={revoking === s.id ? '' : t('signOut')} loading={revoking === s.id} color='red' className='!w-auto !px-3 !py-1.5' onClick={() => revoke(s.id)} /> : <span className='text-xs text-gray-500'>{t('revoked', { date: fmt(s.revokedAt) })}</span>}</div>
                  </div>
                </div>
              );
            })}
            {/* LOAD MORE */}
            {hasMore && (
              <div className="text-center mt-4">
                <Button
                  name={t('loadMoreSessions')}
                  disabled={loadingMore}
                  color="gray"
                  onClick={loadMore}
                  className="!rounded-md"
                />
              </div>
            )}
          </div>
        )}


        {!loading && sessions.length > 1 && <Button name={t('signOutAllOthers')} disabled={revokingAll} className='mt-4 !rounded-md' color='red' onClick={revokeAllOthers} />}
      </div>
    </div>
  );
}

function NotificationSettings() {
  const t = useTranslations('Settings.notifications');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    email: {
      inboxMessages: true,
      orderMessages: true,
      serviceUpdates: true,
      quoteOrderUpdates: true,
      ratingReminders: true,
      adminNotifications: true,
    },
    mobile: {
      inboxMessages: false,
      orderMessages: false,
      serviceUpdates: false,
      quoteOrderUpdates: false,
      ratingReminders: false,
      adminNotifications: false,
    },
    push: { enabled: true, sound: true },
  });

  const rows = [
    { key: 'inboxMessages', label: 'Inbox Messages' },
    { key: 'orderMessages', label: 'Order Messages' },
    { key: 'serviceUpdates', label: 'Service Updates' },
    { key: 'quoteOrderUpdates', label: 'Quote Order Updates' },
    { key: 'ratingReminders', label: 'Rating Reminders' },
    { key: 'adminNotifications', label: 'Admin Notifications' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/notifications/settings/user').then(r => r.data);
        if (res?.settings) setSettings(res.settings);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (channel, k) => {
    setSettings(prev => ({ ...prev, [channel]: { ...prev[channel], [k]: !prev[channel][k] } }));
  };

  async function save() {
    setSaving(true);
    try {
      await api.put('/notifications/settings/user', settings);
      toast.success(t('toast.settingsSaved')); // ✅ success toast
    } catch (err) {
      toast.error(t('toast.failedToSave')); // ✅ error toast
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className='text-xl font-semibold text-gray-800'>{t('title')}</h2>
        <p className='text-sm opacity-90 mt-2'>{t('description')}</p>

        {/* Skeleton table */}
        <div className='mt-6 overflow-x-auto'>
          <table className='w-full border-collapse text-sm'>
            <thead>
              <tr className='text-left text-gray-600 border-b border-slate-200'>
                <th className='pb-2'>{t('type')}</th>
                <th className='pb-2'>{t('email')}</th>
                <th className='pb-2'>{t('mobile')}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className='border-b border-slate-200 '>
                  <td className='py-3'>
                    <div className='shimmer h-4 bg-slate-200 rounded w-40' />
                  </td>
                  <td>
                    <div className='shimmer h-4 w-6 bg-slate-200 rounded mx-auto' />
                  </td>
                  <td>
                    <div className='shimmer h-4 w-6 bg-slate-200 rounded mx-auto' />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Divider className='!my-8' />

        <h3 className='text-lg font-semibold text-gray-800'>{t('pushNotifications')}</h3>
        <div className='mt-6 space-y-6'>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3 '>
              <div className='shimmer h-6 w-12 bg-slate-200 rounded-full' />
              <div>
                <div className='shimmer h-4 bg-slate-200 rounded w-48 mb-1' />
                <div className='shimmer h-3 bg-slate-100 rounded w-32' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className='text-xl font-semibold text-gray-800'>{t('title')}</h2>
      <p className='text-sm opacity-90 mt-2'>{t('description')}</p>

      <div className='mt-6 overflow-x-auto'>
        <table className='w-full border-collapse text-sm text-gray-800'>
          <thead>
            <tr className='text-left text-gray-600 border-b border-b-slate-200'>
              <th className='pb-2'>{t('type')}</th>
              <th className='pb-2'>{t('email')}</th>
              <th className='pb-2'>{t('mobile')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.key} className={`border-b border-b-slate-200 ${rows.length === idx + 1 ? '!border-b-transparent' : ''}`}>
                <td className='py-2'>{row.label}</td>
                <td>
                  <AnimatedCheckbox checked={!!settings.email?.[row.key]} onChange={() => toggle('email', row.key)} />
                </td>
                <td>
                  <AnimatedCheckbox checked={!!settings.mobile?.[row.key]} onChange={() => toggle('mobile', row.key)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Divider className='!my-8' />

      <h3 className='text-lg font-semibold text-gray-800'>{t('pushNotifications')}</h3>
      <div className='mt-6 space-y-6'>
        <div className='flex items-center gap-3'>
          <Switcher checked={!!settings.push?.enabled} onChange={v => setSettings(p => ({ ...p, push: { ...p.push, enabled: v } }))} />
          <div>
            <p className='text-sm font-medium text-gray-800'>{t('enableDisablePush')}</p>
            <p className='text-xs text-gray-500'>{t('tryMe')}</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Switcher checked={!!settings.push?.sound} onChange={v => setSettings(p => ({ ...p, push: { ...p.push, sound: v } }))} />
          <div>
            <p className='text-sm font-medium text-gray-800'>{t('enableDisableSound')}</p>
            <p className='text-xs text-gray-500'>{t('tryMe')}</p>
          </div>
        </div>
      </div>

      <Divider className='!my-8' />

      <Button name={saving ? '' : t('saveChanges')} loading={saving} className='mt-6 max-w-[450px] w-full !rounded-md' color='green' onClick={save} />
    </div>
  );
}

function fmt(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '—';
  }
}
