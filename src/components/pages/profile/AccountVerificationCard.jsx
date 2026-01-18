'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, Divider } from '@/components/UI/ui';
import { Modal } from '@/components/common/Modal';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import PhoneInputWithCountry from '@/components/atoms/PhoneInputWithCountry';
import FormErrorMessage from '@/components/atoms/FormErrorMessage';
import OTPInput from 'react-otp-input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { maskEmail } from '@/utils/helper';
import { validatPhone } from '@/utils/profile';
import z from 'zod';

const defaultCountryCode = { code: 'SA', dial_code: '+966' };

// Email form schema
const emailSchema = z.object({
    email: z.string().email('Invalid email address'),
});

// NAFAZ form schema
const nafazSchema = z.object({
    nationalId: z.string().regex(/^[12][0-9]{9}$/, 'National ID must be 10 digits starting with 1 or 2'),
});

function AccountVerificationCard({ loading, user }) {
    const t = useTranslations('Profile.accountVerification');
    const { setCurrentUser } = useAuth();
    const [emailOpen, setEmailOpen] = useState(false);
    const [phoneOpen, setPhoneOpen] = useState(false);
    const [nafazOpen, setNafazOpen] = useState(false);

    // Email verification status (mock - replace with actual user data)
    const emailVerified = !!user?.email || false;
    const phoneVerified = user?.isPhoneVerified || false;
    const nafazVerified = user?.nafazVerified || false;

    return (
        <Card className='lg:sticky lg:top-30'>
            <div className='px-6 py-7'>
                <h2 className='text-xl font-semibold text-[#000000] mb-2'>{t('title')}</h2>
                <p className='text-sm text-[#6B7280] mb-6'>{t('subtitle')}</p>

                {loading ? (
                    <div className='space-y-4'>
                        <div className='h-16 bg-slate-200/70 animate-pulse rounded-lg' />
                        <div className='h-16 bg-slate-200/70 animate-pulse rounded-lg' />
                        <div className='h-16 bg-slate-200/70 animate-pulse rounded-lg' />
                    </div>
                ) : (
                    <div className='space-y-0'>
                        {/* Email */}
                        <VerificationItem
                            icon={<Mail className='h-5 w-5' />}
                            label={t('email')}
                            verified={emailVerified}
                            onEdit={() => setEmailOpen(true)}
                        />
                        <Divider className='!my-0' />

                        {/* Phone */}
                        <VerificationItem
                            icon={<Phone className='h-5 w-5' />}
                            label={t('phoneNumber')}
                            verified={phoneVerified}
                            onEdit={() => setPhoneOpen(true)}
                        />
                        <Divider className='!my-0' />

                        {/* NAFAZ */}
                        <VerificationItem
                            icon={
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                                    <circle cx="8" cy="10" r="2" />
                                    <line x1="14" y1="8" x2="18" y2="8" />
                                    <line x1="14" y1="12" x2="18" y2="12" />
                                </svg>

                            }
                            label={t('nafaz')}
                            verified={nafazVerified}
                            onEdit={() => setNafazOpen(true)}
                        />
                    </div>
                )}
            </div>

            {/* Email Modal */}
            {emailOpen && (
                <EmailEditModal
                    user={user}
                    onClose={() => setEmailOpen(false)}
                    onUpdate={updatedUser => {
                        setCurrentUser(prev => ({ ...prev, ...updatedUser }));
                    }}
                />
            )}

            {/* Phone Modal */}
            {phoneOpen && (
                <PhoneEditModal
                    user={user}
                    onClose={() => setPhoneOpen(false)}
                    onUpdate={updatedUser => {
                        setCurrentUser(prev => ({ ...prev, ...updatedUser }));
                    }}
                />
            )}

            {/* NAFAZ Modal */}
            {nafazOpen && (
                <NafazEditModal
                    onClose={() => setNafazOpen(false)}
                />
            )}
        </Card>
    );
}

function VerificationItem({ icon, label, verified, onEdit }) {
    const t = useTranslations('Profile.accountVerification');
    return (
        <div className='flex items-center justify-between py-4'>
            <div className='flex items-center gap-3 flex-1 min-w-0'>
                <div className='text-[#292D32] shrink-0'>{icon}</div>
                <span className='text-[#292D32] font-medium'>{label}</span>
            </div>
            <div className='flex items-center gap-3 shrink-0'>
                {verified ? (
                    <div className="flex items-center gap-2 text-blue-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">{t('verified')}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">{t('notVerified')}</span>
                    </div>
                )}
                <button
                    onClick={onEdit}
                    className='text-[#292D32] text-sm font-medium hover:text-blue-600 transition-colors'
                >
                    {t('edit')}
                </button>
            </div>
        </div>
    );
}

function EmailEditModal({ user, onClose, onUpdate }) {
    const tSettings = useTranslations('Settings.account');
    const t = useTranslations('Profile.accountVerification');
    const { setCurrentUser } = useAuth();
    const [pendingEmail, setPendingEmail] = useState(user?.pendingEmail);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            email: user?.email || '',
        },
    });

    useEffect(() => {
        setPendingEmail(user?.pendingEmail);
    }, [user?.pendingEmail]);

    useEffect(() => {
        setValue('email', user?.email || '');
    }, [user, setValue]);

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

    const onSubmit = handleSubmit(async ({ email }) => {
        if (email === user?.email) {
            onClose();
            return;
        }

        setSaving(true);
        try {
            await api.post('/auth/request-email-change', { newEmail: email });
            startResendCooldown();
            setPendingEmail(email);
            setCurrentUser(prev => ({ ...prev, pendingEmail: email }));
            toast.success(tSettings('toast.changesSaved'));
        } catch (err) {
            toast.error(err?.response?.data?.message || tSettings('toast.failedToSave'));
        } finally {
            setSaving(false);
        }
    });

    async function resendEmail() {
        try {
            setResendLoading(true);
            await api.post('/auth/resend-email-confirmation');
            toast.success(tSettings('toast.emailResent'));
            startResendCooldown();
        } catch (err) {
            toast.error(err?.response?.data?.message || tSettings('toast.failedToResend'));
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
            toast.success(tSettings('toast.changeCanceled'));
        } catch (err) {
            toast.error(tSettings('toast.failedToCancel'));
        } finally {
            setCancelLoading(false);
        }
    }

    return (
        <Modal title={t('editEmail')} onClose={onClose}>
            <div className='space-y-4'>
                {pendingEmail && (
                    <div className='p-4 border border-yellow-300 bg-yellow-50 rounded-md text-sm text-gray-800'>
                        <p>
                            {tSettings.rich('pendingEmail', {
                                email: maskEmail(pendingEmail),
                                strong: (chunk) => <strong>{chunk}</strong>
                            })}
                        </p>

                        <div className='grid items-center grid-cols-1 xs:grid-cols-2 gap-2 mt-3'>
                            <Button
                                name={cancelLoading ? tSettings('canceling') : tSettings('cancelRequest')}
                                color='gray'
                                className='text-sm !text-red-600 !bg-transparent'
                                onClick={cancelEmailChange}
                                disabled={cancelLoading || resendLoading}
                            />

                            {resendCooldown > 0 ? (
                                <span className='text-sm text-blue-600 text-nowrap text-center'>
                                    {tSettings('resendIn', { seconds: resendCooldown })}
                                </span>
                            ) : (
                                <Button
                                    name={resendLoading ? tSettings('resending') : tSettings('resendEmail')}
                                    color='green'
                                    className='text-sm'
                                    onClick={resendEmail}
                                    disabled={resendLoading || cancelLoading}
                                />
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={onSubmit} className='space-y-4'>
                    <div>
                        <Input
                            label={t('email')}
                            placeholder='you@example.com'
                            type='email'
                            error={errors.email?.message}
                            {...register('email')}
                        />
                    </div>

                    <div className='flex gap-3 justify-end'>
                        <Button
                            name={t('cancel')}
                            color='gray'
                            onClick={onClose}
                            className='!w-auto !px-4'
                        />
                        <Button
                            name={saving ? '' : t('saveChanges')}
                            loading={saving}
                            color='green'
                            type='submit'
                            className='!w-auto !px-4'
                        />
                    </div>
                </form>
            </div>
        </Modal>
    );
}

function PhoneEditModal({ user, onClose, onUpdate }) {
    const tBilling = useTranslations('MyBilling.availableBalances');
    const t = useTranslations('Profile.accountVerification');
    const { setCurrentUser } = useAuth();
    const [step, setStep] = useState('edit'); // 'edit' or 'verify'
    const [phoneData, setPhoneData] = useState({
        countryCode: user?.countryCode || defaultCountryCode,
        phone: user?.phone || '',
    });
    const [phoneError, setPhoneError] = useState('');
    const [saving, setSaving] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (seconds <= 0) return;
        const timer = setTimeout(() => setSeconds(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [seconds]);

    const handleChangePhone = (val) => {
        const trimmed = val.phone.trim();
        const isInvalid = validatPhone(trimmed);
        setPhoneError(isInvalid ? 'inValidOptionalPhone' : '');
        setPhoneData(val);
    };

    const handleSavePhone = async () => {
        const trimmed = phoneData.phone.trim();
        const isInvalid = validatPhone(trimmed);

        if (isInvalid) {
            setPhoneError('inValidOptionalPhone');
            return;
        }

        setSaving(true);
        try {
            const res = await api.put('/auth/profile', {
                countryCode: phoneData.countryCode,
                phone: phoneData.phone,
            });

            setCurrentUser(prev => ({
                ...prev,
                countryCode: phoneData.countryCode,
                phone: phoneData.phone,
                isPhoneVerified: false
            }));

            // 2. Attempt to send OTP
            const otpWasSent = await sendOtp();

            // 3. ONLY change the step if the OTP was actually sent
            if (otpWasSent) {
                setStep('verify');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || t('failedToUpdatePhone'));
        } finally {
            setSaving(false);
        }
    };

    const sendOtp = async () => {
        try {
            setOtpLoading(true);
            await api.post('/auth/send-phone-verification-otp');
            toast.success(tBilling('phoneVerification.otpSentSuccess'));
            setOtpSent(true);
            setSeconds(30);
            return true;
        } catch (err) {
            toast.error(err?.response?.data?.message || tBilling('phoneVerification.failedToSend'));
            return false;
        } finally {
            setOtpLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error(tBilling('phoneVerification.invalidOtpLength'));
            return;
        }

        try {
            setOtpLoading(true);
            await api.post('/auth/verify-phone-otp', { otpCode: otp });
            setCurrentUser(prev => ({
                ...prev,
                isPhoneVerified: true,
            }));
            toast.success(tBilling('phoneVerification.verifiedSuccess'));
            onUpdate({ isPhoneVerified: true });
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || tBilling('phoneVerification.invalidOtp'));
        } finally {
            setOtpLoading(false);
        }
    };

    const resendOtp = async () => {
        if (seconds > 0) return;
        try {
            setResending(true);
            await api.post('/auth/send-phone-verification-otp');
            toast.success(tBilling('phoneVerification.otpResentSuccess'));
            setSeconds(30);
        } catch (err) {
            toast.error(err?.response?.data?.message || tBilling('phoneVerification.failedToResend'));
        } finally {
            setResending(false);
        }
    };

    return (
        <Modal title={t('editPhone')} onClose={onClose}>
            <div className='space-y-4'>
                {step === 'edit' ? (
                    <>
                        <div>
                            <PhoneInputWithCountry
                                value={phoneData}
                                onChange={handleChangePhone}
                            />
                            {phoneError && (
                                <FormErrorMessage message={t(`errors.${phoneError}`)} />
                            )}
                        </div>

                        <div className='flex gap-3 justify-end'>
                            <Button
                                name={t('cancel')}
                                color='gray'
                                onClick={onClose}
                                className='!w-auto !px-4'
                            />
                            <Button
                                name={saving ? '' : t('saveChanges')}
                                loading={saving}
                                color='green'
                                onClick={handleSavePhone}
                                className='!w-auto !px-4'
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <Input
                            label={tBilling('phoneVerification.phoneLabel')}
                            value={`${phoneData.countryCode.dial_code} ${phoneData.phone.replace(/^\+/, '')}`}
                            disabled
                            cnInput="cursor-not-allowed"
                        />

                        <form onSubmit={verifyOtp} className='mt-4 space-y-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    {tBilling('phoneVerification.enterOtpLabel')}
                                </label>
                                <OTPInput
                                    value={otp}
                                    onChange={setOtp}
                                    numInputs={6}
                                    renderSeparator={<span className="mx-1">-</span>}
                                    renderInput={props => (
                                        <input
                                            {...props}
                                            className="!w-10 h-10 border rounded-lg text-center text-xl"
                                        />
                                    )}
                                    containerStyle="flex justify-center flex-wrap gap-y-2"
                                />
                            </div>

                            <div className='flex gap-3 justify-end'>
                                <Button
                                    name={t('cancel')}
                                    color='gray'
                                    onClick={onClose}
                                    className='!w-auto !px-4'
                                />
                                <Button
                                    name={tBilling('phoneVerification.verify')}
                                    type='submit'
                                    loading={otpLoading}
                                    color='green'
                                    className='!w-auto !px-4'
                                />
                            </div>
                        </form>

                        <p className='text-center text-gray-600 mt-4 text-sm'>
                            {tBilling('phoneVerification.didNotReceive')}{' '}
                            <button
                                type='button'
                                disabled={seconds > 0 || resending}
                                onClick={resendOtp}
                                className={`text-blue-600 hover:underline disabled:opacity-50 ${seconds > 0 ? 'cursor-not-allowed' : ''
                                    }`}
                            >
                                {seconds > 0
                                    ? tBilling('phoneVerification.resendIn', { seconds })
                                    : tBilling('phoneVerification.resendOtp')}
                            </button>
                        </p>

                        <div className='text-center mt-2'>
                            <button
                                type='button'
                                onClick={() => setStep('edit')}
                                className='text-sm text-blue-600 hover:underline'
                            >
                                {t('editPhoneAgain')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

function NafazEditModal({ onClose }) {
    const t = useTranslations('Profile.accountVerification');
    const [saving, setSaving] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(nafazSchema),
    });

    const onSubmit = handleSubmit(async ({ nationalId }) => {
        setSaving(true);
        try {
            // Mock API call - replace with actual endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success(t('nafazUpdated'));
            onClose();
        } catch (err) {
            toast.error(t('failedToUpdateNafaz'));
        } finally {
            setSaving(false);
        }
    });

    return (
        <Modal title={t('editNafaz')} onClose={onClose}>
            <form onSubmit={onSubmit} className='space-y-4'>
                <div>
                    <Input
                        label={t('nationalId')}
                        placeholder={t('nationalIdPlaceholder')}
                        error={errors.nationalId?.message}
                        {...register('nationalId')}
                    />
                    <p className='text-xs text-gray-500 mt-1'>{t('nationalIdHint')}</p>
                </div>

                <div className='flex gap-3 justify-end'>
                    <Button
                        name={t('cancel')}
                        color='gray'
                        onClick={onClose}
                        className='!w-auto !px-4'
                    />
                    <Button
                        name={saving ? '' : t('saveChanges')}
                        loading={saving}
                        color='green'
                        type='submit'
                        className='!w-auto !px-4'
                    />
                </div>
            </form>
        </Modal>
    );
}

export default AccountVerificationCard;
