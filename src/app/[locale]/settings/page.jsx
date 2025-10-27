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

export default function Page() {
  const [activeTab, setActiveTab] = useState('account');
  const tabs = [
    { label: 'Account', value: 'account' },
    { label: 'Security', value: 'security' },
    { label: 'Notifications', value: 'notifications' },
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
  const reasons = [
    { id: 'platform', name: 'I found another platform' },
    { id: 'price', name: 'Too expensive' },
    { id: 'features', name: 'Not satisfied with features' },
    { id: 'other', name: 'Other' },
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
  const t = useTranslations('auth');

  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState(null);
  const [customReason, setCustomReason] = useState('');

  const [pendingEmail, setPendingEmail] = useState(null);

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
    (async () => {
      const pending = await api.get('/auth/pending-email').then(r => r.data?.pendingEmail);
      if (pending) {
        setPendingEmail(pending);
      }
    })();
  }, []);


  useEffect(() => {
    (async () => {
      const u = await api.get('/auth/me').then(r => r.data);
      setMe(u);
      console.log(watch(), u)
      setValue('username', u?.username || '');
      setValue('email', u?.email || '');

      console.log(watch())
    })();
  }, []);

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
              setMe(prev => ({ ...prev, username: updatedUsername }));
            }
          })
        );
      }

      if (email && email !== me?.email && resendCooldown <= 0) {
        // updates.push(
        //   api.post('/auth/request-email-change', { newEmail: email }).then(() => {
        //     setPendingEmail(email);
        //   })
        // );

        //for testing without backend
        updates.push(
          new Promise(resolve => {
            setTimeout(() => {
              setPendingEmail(email);
              startResendCooldown();
              resolve(); // simulate success
            }, 500); // simulate network delay
          })
        );
      }


      if (updates.length === 0) return;

      await Promise.all(updates);

      toast.success('Changes saved successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  })

  async function resendEmail() {
    try {
      await api.post('/auth/resend-email-confirmation');
      toast.success('Confirmation email resent!');
      startResendCooldown(); // trigger cooldown
    } catch (err) {
      toast.error('Failed to resend email');
    }
  }

  async function cancelEmailChange() {
    try {
      await api.post('/auth/cancel-email-change');
      setPendingEmail(null);
      toast.success('Email change request canceled');
    } catch (err) {
      toast.error('Failed to cancel email change');
    }
  }

  async function deactivate() {
    const finalReason = reason === 'other' ? customReason : reason;
    if (!finalReason) return;
    setDeactivating(true);
    try {

      await api.post('/auth/account-deactivation', { reason: finalReason });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('currentDeviceId');
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
            A confirmation link has been sent to <strong>{maskEmail(pendingEmail)}</strong>.
            Please check your inbox to confirm the change.
          </p>
          <div className='grid items-center grid-cols-1 xs:grid-cols-2 gap-2'>

            <Button
              name='Cancel request'
              color='gray'
              className='mt-2 text-base !text-red-600 !bg-transparent'
              onClick={cancelEmailChange}
            />

            {resendCooldown > 0 ? (
              <span className='mt-2 text-blue-600 text-nowrap text-center'>Resend in {resendCooldown}s</span>
            ) : (
              <Button
                name='Resend Email'
                color='green'
                className='mt-2 text-base'
                onClick={resendEmail}
              />
            )}

          </div>
        </div>
      )}

      <h2 className='text-xl font-semibold text-gray-800'>Need to update your public profile?</h2>

      <Input
        label='Username'
        placeholder='Enter Text'
        className='mt-6 max-w-[450px] w-full'
        error={errors.username?.message && t(`errors.${errors.username?.message}`)}
        {...register('username')}
      />


      <Input
        label='Email'
        placeholder='you@example.com'
        type='email'
        className='mt-6 max-w-[450px] w-full'
        error={errors.email?.message}
        {...register('email')}
      />



      <Button name={saving ? '' : 'Save Changes'} loading={saving} className='mt-6 max-w-[450px] w-full !rounded-md ' onClick={saveProfile} />

      <Divider className='!my-8' />

      <h3 className='p !opacity-100'>Account deactivation</h3>
      <p className='text-sm opacity-90 mt-2'>What happens when you deactivate your account?</p>
      <div className='mt-3 space-y-1 text-sm text-gray-600'>
        <p>• Your profile and Gigs won’t be shown anymore.</p>
        <p>• Active orders will be cancelled.</p>
      </div>

      <Select className='mt-6 max-w-[450px] w-full' cnLabel='!text-sm opacity-90 mt-2' label='I’m leaving because' placeholder='Choose a Reason' value={reason} onChange={opt => setReason(opt?.id)} options={reasons} />
      {reason === 'other' && (
        <Input
          label='Please tell us why'
          placeholder='Your reason for leaving'
          className='mt-4 max-w-[450px] w-full'
          value={customReason}
          onChange={e => setCustomReason(e.target.value)}
        />
      )}

      <Button name='Deactivate Account' color='red' loading={deactivating} className='mt-6 max-w-[450px] w-full !rounded-md' onClick={() => {
        const finalReason = reason === 'other' ? customReason : reason;
        if (!finalReason) return;
        setConfirmOpen(true)
      }} />
      {confirmOpen && (
        <Modal title='Confirm Deactivation' onClose={() => setConfirmOpen(false)}>
          <p className='text-sm text-gray-700 mb-4'>
            Are you sure you want to deactivate your account?
          </p>
          <div className='flex justify-end gap-3'>
            <Button
              name='Cancel'
              variant='ghost'
              onClick={() => setConfirmOpen(false)}
            />
            <Button
              name='Yes, Deactivate'
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

function SecuritySettings() {
  const [sessions, setSessions] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [curPwd, setCurPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [meRes, sesRes] = await Promise.all([api.get('/auth/me').then(r => r.data), api.get('/auth/sessions').then(r => r.data)]);
      setMe(meRes);
      setSessions(sesRes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changePassword() {
    if (!curPwd) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPwd) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPwd !== newPwd2) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    if (!curPwd || !newPwd || newPwd !== newPwd2) return;
    setPwdSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: curPwd, newPassword: newPwd });
      toast.success('✅ Your password has been updated successfully.');
      setCurPwd('');
      setNewPwd('');
      setNewPwd2('');
    } catch (err) {
      toast.error(err.response.data.message);
    } finally {
      setPwdSaving(false);
    }
  }

  async function revoke(id) {
    setRevoking(id);
    try {
      await api.delete(`/auth/sessions/${id}`);
      setSessions(prev => prev.map(s => (s.id === id ? { ...s, revokedAt: new Date().toISOString() } : s)));
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllOthers() {
    await api.post('/auth/logout-all'); // keeps current
    await load();
  }

  return (
    <div>
      <h2 className='text-xl font-semibold text-gray-800'>Change Password</h2>
      <Input label='Current Password' placeholder='********' type='password' className='mt-6 max-w-[450px] w-full' value={curPwd} onChange={e => setCurPwd(e.target.value)} />
      <Input label='New Password' placeholder='********' type='password' className='mt-3 max-w-[450px] w-full' value={newPwd} onChange={e => setNewPwd(e.target.value)} />
      <Input label='Confirm Password' placeholder='********' type='password' className='mt-3 max-w-[450px] w-full' value={newPwd2} onChange={e => setNewPwd2(e.target.value)} />
      <Button name={pwdSaving ? '' : 'Save Changes'} loading={pwdSaving} className='mt-6 max-w-[450px] w-full !rounded-md' color='green' onClick={changePassword} />

      <Divider className='!my-8' />

      <div className='border border-slate-200 rounded-lg p-4'>
        <h2 className='text-xl font-semibold'>Connected Devices</h2>
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
            {sessions.length === 0 && <p className='text-sm text-gray-600'>No active sessions.</p>}
            {sessions.map((s, i) => {
              // ✅ compare current session id with row id
              const isThisDevice = !!(me?.currentDeviceId && s.id && me.currentDeviceId === s.id);
              const killed = !!s.revokedAt;
              const meta = `${s.browser || 'Unknown'}${s.os ? `, ${s.os}` : ''}${s.deviceType ? ` (${s.deviceType})` : ''}`;
              return (
                <div key={s.id} className={`py-3 px-2 ${i !== sessions.length - 1 ? 'border-b border-slate-200' : ''}`}>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <p className='font-medium text-gray-800'>
                        {meta}
                        {isThisDevice && <span className='ml-2 text-emerald-600 text-xs font-semibold'>THIS DEVICE</span>}
                        {killed && <span className='ml-2 text-red-600 text-xs font-semibold'>SIGNED OUT</span>}
                      </p>
                      <p className='text-sm text-gray-600'>
                        IP {s.ipAddress || '—'} · Last activity {fmt(s.lastActivity)}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>{!killed ? <Button name={revoking === s.id ? '' : 'Sign Out'} loading={revoking === s.id} color='red' className='!w-auto !px-3 !py-1.5' onClick={() => revoke(s.id)} /> : <span className='text-xs text-gray-500'>Revoked {fmt(s.revokedAt)}</span>}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && sessions.length > 1 && <Button name='Sign Out From All Other Devices' className='mt-4 !rounded-md' color='red' onClick={revokeAllOthers} />}
      </div>
    </div>
  );
}

function NotificationSettings() {
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
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className='text-xl font-semibold text-gray-800'>Notifications</h2>
        <p className='text-sm opacity-90 mt-2'>For important updates regarding your activity, certain notifications cannot be disabled.</p>

        {/* Skeleton table */}
        <div className='mt-6 overflow-x-auto'>
          <table className='w-full border-collapse text-sm'>
            <thead>
              <tr className='text-left text-gray-600 border-b border-slate-200'>
                <th className='pb-2'>Type</th>
                <th className='pb-2'>Email</th>
                <th className='pb-2'>Mobile</th>
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

        <h3 className='text-lg font-semibold text-gray-800'>Push notifications (for mobile devices)</h3>
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
      <h2 className='text-xl font-semibold text-gray-800'>Notifications</h2>
      <p className='text-sm opacity-90 mt-2'>For important updates regarding your activity, certain notifications cannot be disabled.</p>

      <div className='mt-6 overflow-x-auto'>
        <table className='w-full border-collapse text-sm text-gray-800'>
          <thead>
            <tr className='text-left text-gray-600 border-b border-b-slate-200'>
              <th className='pb-2'>Type</th>
              <th className='pb-2'>Email</th>
              <th className='pb-2'>Mobile</th>
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

      <h3 className='text-lg font-semibold text-gray-800'>Push notifications (for mobile devices)</h3>
      <div className='mt-6 space-y-6'>
        <div className='flex items-center gap-3'>
          <Switcher checked={!!settings.push?.enabled} onChange={v => setSettings(p => ({ ...p, push: { ...p.push, enabled: v } }))} />
          <div>
            <p className='text-sm font-medium text-gray-800'>Enable/disable push notifications</p>
            <p className='text-xs text-gray-500'>Try Me</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Switcher checked={!!settings.push?.sound} onChange={v => setSettings(p => ({ ...p, push: { ...p.push, sound: v } }))} />
          <div>
            <p className='text-sm font-medium text-gray-800'>Enable/disable sound</p>
            <p className='text-xs text-gray-500'>Try Me</p>
          </div>
        </div>
      </div>

      <Divider className='!my-8' />

      <Button name={saving ? '' : 'Save Changes'} loading={saving} className='mt-6 max-w-[450px] w-full !rounded-md' color='green' onClick={save} />
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
