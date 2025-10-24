'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import OtpInput from 'react-otp-input';
import toast from 'react-hot-toast';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

import api from '@/lib/axios';
import { SocialButton } from '@/components/pages/auth/SocialButton';
import { SubmitButton } from '@/components/pages/auth/SubmitButton';
import { Input } from '@/components/pages/auth/Input';
import { SelectInput } from '@/components/pages/auth/SelectInput';

/* ---------- schemas ----------- */
const loginSchema = z.object({
  email: z.email('invalidEmail'),
  password: z.string().min(1, 'passwordRequired'),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'usernameMin')
    .max(30, 'usernameMax')
    .regex(/^[a-zA-Z0-9_ ]+$/, 'usernameInvalid')
    .transform(val => val.trim())
    .refine(val => val.length >= 3, 'usernameMin')
    .refine(val => !val.includes('  '), 'usernameSpaces'),
  email: z.email('invalidEmail'),
  password: z.string().min(8, 'passwordMin').max(20, 'passwordMax').regex(/^[A-Za-z0-9_@$!%*?&]+$/, 'passwordInvalidChars'),
  role: z.enum(['buyer', 'seller']).default('buyer'),
  type: z.enum(['Business', 'Individual']).default('Individual'),
  ref: z
    .string()
    .max(150, 'refMax')
    .optional()
    .nullable(),

});

const forgetPasswordSchema = z.object({
  email: z.email('invalidEmail'),
});

const passwordResetFormSchema = z
  .object({
    newPassword: z.string().min(8, 'passwordMin').max(20, 'passwordMax').regex(/^[A-Za-z0-9_@$!%*?&]+$/, 'passwordInvalidChars'),
    confirmNewPassword: z.string(),
    otp: z.string().regex(/^[0-9]+$/, 'otpNumbersOnly').length(6, 'otpLength')
    ,
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'passwordsMatch',
    path: ['confirmNewPassword'],
  });

const phoneLoginSchema = z.object({
  phone: z.string().min(10, 'phoneMin'),
});

/* ---------- context ---------- */
const AuthContext = createContext(null);

/* ---------- small UI bits (titles/tabs) unchanged from your file ---------- */
function TitleByTab({ activeTab, view }) {
  const t = useTranslations('auth');
  const TITLES = {
    login: {
      options: { title: t('signIn'), subtitle: t('chooseMethod') },
      email: { title: t('signIn'), subtitle: t('emailMethod') },
      phone: { title: t('signIn'), subtitle: t('phoneMethod') },
      otp: { title: t('signIn'), subtitle: t('otpMethod') },
    },
    register: {
      options: { title: t('signUp'), subtitle: t('chooseMethod') },
      email: { title: t('signUp'), subtitle: t('createAccount') },
      phone: { title: t('signUp'), subtitle: t('phoneSignUp') },
      otp: { title: t('verifyEmail'), subtitle: t('verifyEmail') },
    },
    'forgot-password': {
      email: { title: t('forgotPassword'), subtitle: t('resetPassword') },
      otp: { title: t('verifyIdentity'), subtitle: t('verifyIdentity') },
      reset: { title: t('setNewPassword'), subtitle: t('passwordRequirements') },
    },
  };
  const tabData = TITLES[activeTab] || TITLES.login;
  const content = tabData[view] || tabData.options || { title: '', subtitle: '' };

  return (
    <motion.div key={`${activeTab}-${view}`} className='mb-6 text-center md:text-left'>
      <h1 className='text-center mt-2 text-xl md:text-2xl font-extrabold'>{content.title}</h1>
      {content.subtitle && <p className='text-center mt-1 text-base text-gray-600'>{content.subtitle}</p>}
    </motion.div>
  );
}

const TABS = [
  { key: 'login', label: 'signIn' },
  { key: 'register', label: 'signUp' },
  { key: 'forgot-password', label: 'forgotPassword' },
];

function AuthTabs({ setView, activeTab, setActiveTab }) {
  const t = useTranslations('auth');
  const router = useRouter();

  const handleClick = key => {
    setActiveTab(key);
    router.push(`/auth?tab=${key}`);
    if (key === 'login' || key === 'register') setView('options');
    if (key === 'forgot-password') setView('email');
  };

  return (
    <LayoutGroup id='auth-tabs'>
      <div className='mb-10 grid grid-cols-3 gap-1 sm:gap-2 rounded-2xl bg-gray-100/80 pb-[3px] p-1 text-sm font-medium ring-1 ring-black/5'>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <motion.button key={tab.key} role='tab' aria-selected={isActive} onClick={() => handleClick(tab.key)} className='relative rounded-xl px-3 py-2 cursor-pointer'>
              {isActive && <motion.span layoutId='active-pill' className='absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400' />}
              <span className={`relative z-10 ${isActive ? 'text-white' : 'text-gray-700'}`}>{t(tab.label)}</span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* ---------- social buttons (unchanged interface) ---------- */
const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/`;

export const ContinueWithGoogleButton = ({ referralCode }) => {
  const t = useTranslations('auth');
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleGoogleLogin = async () => {
    let url = `${API_BASE_URL}auth/google`;
    const params = new URLSearchParams();
    if (redirectUrl) params.append('redirect', redirectUrl);
    if (referralCode) params.append('ref', referralCode);
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else toast.error(t('errors.googleLoginFailed'));
    } catch {
      toast.error(t('errors.googleLoginFailed'));
    }
  };

  return <SocialButton icon='/images/google-icon.png' text={t('continueWithGoogle')} onClick={handleGoogleLogin} />;
};

export const ContinueWithAppleButton = ({ referralCode }) => {
  const t = useTranslations('auth');
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleAppleLogin = async () => {
    let url = `${API_BASE_URL}auth/apple`;
    const params = new URLSearchParams();
    if (redirectUrl) params.append('redirect', redirectUrl);
    if (referralCode) params.append('ref', referralCode);
    if (params.toString()) url += `?${params.toString()}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else toast.error(t('errors.appleLoginFailed'));
    } catch {
      toast.error(t('errors.appleLoginFailed'));
    }
  };

  return <SocialButton icon='/images/apple-icon.png' text={t('continueWithApple')} onClick={handleAppleLogin} />;
};

export const ContinueWithEmailButton = ({ onClick }) => {
  const t = useTranslations('auth');
  return <SocialButton icon='/images/email-icon.png' text={t('continueWithEmail')} onClick={onClick} />;
};
export const ContinueWithPhoneButton = ({ onClick }) => {
  const t = useTranslations('auth');
  return <SocialButton icon='/images/phone-icon.png' text={t('continueWithPhone')} onClick={onClick} />;
};

/* ---------- forms (switched to api from lib/axios) ---------- */
const LoginForm = ({ onLoggedIn }) => {
  const t = useTranslations('auth');
  const { setLoading, setError, loading } = useContext(AuthContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async data => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', data);
      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (user?.currentDeviceId) localStorage.setItem('currentDeviceId', user.currentDeviceId);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(t('success.signedIn'));
      onLoggedIn?.(user);
    } catch (err) {
      const msg = err?.response?.data?.message || t('errors.loginFailed');
      setError(msg === 'Refresh token not provided in the request body' ? 'Incorrect email or password' : msg);
      toast.error(msg === 'Refresh token not provided in the request body' ? 'Incorrect email or password' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form onSubmit={handleSubmit(onSubmit)} className='w-full'>
      <Input label={t('email')} type='email' placeholder={t('enterEmail')} register={register('email')} error={errors.email?.message && t(`errors.${errors.email.message}`)} />
      <Input label={t('password')} type='password' placeholder={t('enterPassword')} register={register('password')} error={errors.password?.message && t(`errors.${errors.password.message}`)} />
      <SubmitButton isLoading={loading}>{t('signInButton')}</SubmitButton>
    </motion.form>
  );
};

const RegisterForm = ({ onOtp }) => {
  const t = useTranslations('auth');
  const { setLoading, setError, loading } = useContext(AuthContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', role: 'buyer', type: 'Individual', ref: '' },
  });

  const onSubmit = async data => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', data);
      sessionStorage.setItem('registerEmail', data.email);
      toast.success(t('success.otpSent'));
      onOtp?.(data.email);
    } catch (err) {
      const msg = err?.response?.data?.message || t('errors.registrationFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form onSubmit={handleSubmit(onSubmit)} className='w-full'>
      <Input label={t('username')} type='text' placeholder={t('chooseUsername')} register={register('username')} error={errors.username?.message && t(`errors.${errors.username.message}`)} />
      <Input label={t('email')} type='email' placeholder={t('enterEmail')} register={register('email')} error={errors.email?.message && t(`errors.${errors.email.message}`)} />
      <Input label={t('password')} type='password' placeholder={t('enterPassword')} register={register('password')} error={errors.password?.message && t(`errors.${errors.password.message}`)} />
      <SelectInput
        label={t('role.selectRole')}
        register={register('role')}
        options={[
          { value: 'buyer', label: t('role.buyer') },
          { value: 'seller', label: t('role.seller') },
        ]}
      />
      <SelectInput
        label={t('userType')}
        register={register('type')}
        options={[
          { value: 'Business', label: t('business') },
          { value: 'Individual', label: t('individual') },
        ]}
      />
      <Input label={t('referralCode')} type='text' placeholder={t('enterReferral')} register={register('ref')} error={errors.ref?.message && t(`errors.${errors.ref.message}`)} />
      <SubmitButton isLoading={loading}>{t('createAccountButton')}</SubmitButton>
    </motion.form>
  );
};

const ForgotPasswordForm = ({ onOtp }) => {
  const t = useTranslations('auth');
  const { setLoading, setSuccess, setError, loading } = useContext(AuthContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async data => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await api.post('/auth/forgot-password', data);
      sessionStorage.setItem('resetEmail', data.email);
      setSuccess(true);
      toast.success(t('success.otpSent'));
      onOtp?.(data.email);
    } catch (err) {
      const msg = err?.response?.data?.message || t('errors.resetEmailFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form onSubmit={handleSubmit(onSubmit)} className='w-full'>
      <Input label={t('email')} type='email' placeholder={t('enterEmail')} register={register('email')} error={errors.email?.message && t(`errors.${errors.email.message}`)} />
      <SubmitButton isLoading={loading}>{t('sendOtpButton')}</SubmitButton>
    </motion.form>
  );
};

const ResetPasswordForm = ({ email, otp }) => {
  const t = useTranslations('auth');
  const { setLoading, setSuccess, setError, loading } = useContext(AuthContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(passwordResetFormSchema),
    defaultValues: { newPassword: '', confirmNewPassword: '', otp: otp || '' },
  });

  useEffect(() => {
    if (otp) setValue('otp', otp);
  }, [otp, setValue]);

  const onSubmit = async data => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await api.post('/auth/reset-password', { email, newPassword: data.newPassword, otp: data.otp });
      setSuccess(true);
      toast.success(t('success.passwordReset'));
    } catch (err) {
      const msg = err?.response?.data?.message || t('errors.passwordResetFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form onSubmit={handleSubmit(onSubmit)} className='w-full'>
      <Input label={t('email')} type='text' value={email} disabled cnInput='cursor-not-allowed' />
      <Input label={t('otpCode')} type='text' placeholder={t('enterOtp')} register={register('otp')} error={errors.otp?.message && t(`errors.${errors.otp.message}`)} />
      <Input label={t('newPassword')} type='password' placeholder={t('enterNewPassword')} register={register('newPassword')} error={errors.newPassword?.message && t(`errors.${errors.newPassword.message}`)} />
      <Input label={t('confirmPassword')} type='password' placeholder={t('confirmNewPassword')} register={register('confirmNewPassword')} error={errors.confirmNewPassword?.message && t(`errors.${errors.confirmNewPassword.message}`)} />
      <SubmitButton isLoading={loading}>{t('resetPasswordButton')}</SubmitButton>
    </motion.form>
  );
};

const OTPForm = ({ email, onVerified, purpose = 'verify' }) => {
  const t = useTranslations('auth');
  const { setLoading, setError, loading } = useContext(AuthContext);
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return;
    const h = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(h);
  }, [seconds]);

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (otp.length !== 6) throw new Error('errors.otpLength');
      if (purpose === 'verify') {
        await api.post('/auth/verify-email', { email, code: otp });
        toast.success(t('success.emailVerified'));
        onVerified?.();
      } else {
        onVerified?.(otp);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t('errors.otpInvalid');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      setResending(true);
      if (purpose === 'verify') await api.post('/auth/resend-verification-email', { email });
      else await api.post('/auth/forgot-password', { email });
      setSeconds(30);
      toast.success(t('success.codeResent'));
    } catch {
      toast.error(t('errors.resendFailed'));
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div className='w-full'>
      <p className='text-gray-600 mb-6'>{t('otpSentTo')}</p>
      <Input label={t('email')} type='text' value={email} disabled cnInput='cursor-not-allowed' />
      <form onSubmit={onSubmit}>
        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>{t('otpCode')}</label>
          <OtpInput value={otp} onChange={setOtp} numInputs={6} renderSeparator={<span className='mx-1'>-</span>} renderInput={props => <input {...props} className='!w-10 h-10 border rounded-lg text-center text-xl' />} containerStyle='flex justify-center flex-wrap gap-y-2' />
        </div>
        <SubmitButton isLoading={loading}>{t('verifyCodeButton')}</SubmitButton>
      </form>

      <p className='text-center text-gray-600 mt-4'>
        {t('didntReceiveCode')}{' '}
        <button type='button' disabled={resending || seconds > 0} className={`text-blue-600 hover:underline disabled:opacity-50 ${seconds > 0 ? 'cursor-not-allowed' : ''}`} onClick={resend}>
          {seconds > 0 ? t('resendIn', { seconds }) : t('resendCode')}
        </button>
      </p>
    </motion.div>
  );
};

const AuthOptions = ({ onEmailClick, onPhoneClick, referralCode }) => {
  const t = useTranslations('auth');
  return (
    <motion.div className='w-full h-full flex flex-col'>
      <div className='flex-1 flex flex-col items-center justify-center gap-4 py-6'>
        <ContinueWithEmailButton onClick={onEmailClick} />
        <ContinueWithGoogleButton referralCode={referralCode} />
        <ContinueWithAppleButton referralCode={referralCode} />
        <ContinueWithPhoneButton onClick={onPhoneClick} />
      </div>
      <p className='text-sm text-gray-500 border-t border-slate-200 mt-6 pt-6'>{t('terms')}</p>
    </motion.div>
  );
};

/* ---------- main ---------- */
export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');

  const tabParam = searchParams?.get('tab') || 'login';
  const accessTokenFromUrl = searchParams?.get('accessToken');
  const refreshTokenFromUrl = searchParams?.get('refreshToken');
  const redirectUrl = searchParams?.get('redirect') || '/explore';
  const referralCode = searchParams?.get('ref');

  const [activeTab, setActiveTab] = useState(tabParam);
  const [view, setView] = useState('options');//options
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [emailForOTP, setEmailForOTP] = useState('am259@gmail.com');
  const [otpForReset, setOtpForReset] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [needsUserTypeSelection, setNeedsUserTypeSelection] = useState(false);
  const [oauthUser, setOauthUser] = useState(null);

  // OAuth: if query has tokens, store them and fetch /auth/me
  useEffect(() => {
    const run = async () => {
      if (!accessTokenFromUrl) return;
      try {
        localStorage.setItem('accessToken', accessTokenFromUrl);
        if (refreshTokenFromUrl) localStorage.setItem('refreshToken', refreshTokenFromUrl);

        const me = await api.get('/auth/me').then(r => r.data);
        if (me?.currentDeviceId) localStorage.setItem('currentDeviceId', me.currentDeviceId);
        localStorage.setItem('user', JSON.stringify(me || {}));
        setCurrentUser(me);

        if (!me?.type) {
          setOauthUser(me);
          setNeedsUserTypeSelection(true);
        } else {
          toast.success('Logged in successfully!');
          router.push(redirectUrl);
        }
      } catch (e) {
        console.error('OAuth finalize failed', e);
        toast.error('Failed to complete login');
      }
    };
    run();
  }, [accessTokenFromUrl, refreshTokenFromUrl, router, redirectUrl]);

  const handleUserTypeSelect = async userType => {
    setLoading(true);
    try {
      await api.put('/auth/profile', { type: userType }); // backend must allow 'type'
      const me = await api.get('/auth/me').then(r => r.data);
      localStorage.setItem('user', JSON.stringify(me || {}));
      setCurrentUser(me);
      toast.success('User type updated successfully!');
      router.push(redirectUrl);
    } catch (e) {
      toast.error('Failed to update user type');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(tabParam);
    if (tabParam === 'forgot-password') setView('email');
    else if (tabParam === 'login' && view !== 'email') setView('options');
    setError(null);
    setSuccess(false);
  }, [tabParam]);

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const userData = JSON.parse(u);
        setCurrentUser(userData);
        if (userData && window.location.pathname === '/auth') router.push('/explore');
      }
    } catch { }
  }, [router]);

  const handleEmailClick = () => setView('email');
  const handlePhoneClick = () => setView('phone');
  const handleOTPRequest = email => {
    setEmailForOTP(email);
    setView('otp');
  };
  const handleResetOTP = otp => {
    setOtpForReset(otp);
    setView('reset');
  };
  const onOtpVerifiedGoToLogin = () => {
    router.push('/auth?tab=login');
    setView('email');
  };
  const handleLoggedIn = user => {
    setCurrentUser(user);
    router.push('/explore');
  };

  const renderContent = () => {
    if (needsUserTypeSelection) return <UserTypeSelection onSelect={handleUserTypeSelect} loading={loading} />;
    if (activeTab === 'forgot-password' && view === 'reset') return <ResetPasswordForm email={emailForOTP} otp={otpForReset} />;


    switch (view) {
      case 'email':
        if (activeTab === 'login') return <LoginForm onLoggedIn={handleLoggedIn} />;
        if (activeTab === 'register') return <RegisterForm onOtp={handleOTPRequest} />;
        return <ForgotPasswordForm onOtp={handleOTPRequest} />;
      case 'phone':
        return <PhoneLoginForm />;
      case 'otp':
        if (activeTab === 'forgot-password') return <OTPForm email={emailForOTP} onVerified={handleResetOTP} purpose='reset' />;
        return <OTPForm email={emailForOTP} onVerified={onOtpVerifiedGoToLogin} purpose='verify' />;
      default:
        return <AuthOptions onEmailClick={handleEmailClick} onPhoneClick={handlePhoneClick} referralCode={referralCode} />;
    }
  };
  const rawFeatures = t.raw('features');
  const features = Array.isArray(rawFeatures) ? rawFeatures : [];
  return (
    <AuthContext.Provider value={{ loading, setLoading, error, setError, success, setSuccess }}>
      <div className='min-h-screen container !px-0 flex max-lg:flex-col'>
        {/* left hero */}
        <div className='w-full flex p-12 text-white relative overflow-hidden'>
          <div className='absolute inset-0 z-[10]' style={{ background: 'linear-gradient(269.99deg, rgba(0,0,0,0) 15.21%, rgba(0,0,0,0.48) 33.9%, rgba(0,0,0,0.8) 132.88%)' }} />
          <img src='/images/auth.jpeg' alt='' className='absolute inset-0 object-cover w-full h-full object-right' />
          <div className='relative z-10 max-w-2xl mx-auto my-auto'>
            <motion.h1 className='text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3'>  {t('heroTitle')}</motion.h1>
            <motion.p className='text-base sm:text-lg md:text-2xl    font-normal mb-6'>{t('heroSubtitle')}</motion.p>
            <div className='space-y-2 sm:text-base md:text-lg lg:text-lg'>
              {features?.map((text, i) => (
                <p key={i} className='flex gap-2 items-center'>
                  <span className='w-6 h-6 bg-white/20 rounded-full flex items-center justify-center'>✓</span>
                  {text}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* right panel: forms */}
        <div className='w-full lg:max-w-[500px] flex items-center justify-center lg:px-10 p-6'>
          <motion.div className='w-full max-lg:bg-slate-50 max-lg:border max-lg:rounded-2xl max-lg:p-8'>
            <TitleByTab view={view} activeTab={activeTab} />
            <AuthTabs setView={setView} activeTab={activeTab} setActiveTab={setActiveTab} />
            <AnimatePresence mode='wait'>
              <motion.div key={`${activeTab}-${view}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </AuthContext.Provider>
  );
}

/* helper component (unchanged) */
const UserTypeSelection = ({ onSelect, loading }) => {
  const t = useTranslations('auth');
  const [selectedType, setSelectedType] = useState(null);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='w-full'>
      <h2 className='text-xl font-bold text-center mb-6'>{t('selectUserType')}</h2>
      <p className='text-gray-600 text-center mb-8'>{t('selectUserTypeDescription')}</p>
      <div className='grid grid-cols-2 gap-4 mb-8'>
        <button type='button' onClick={() => setSelectedType('Business')} className={`p-6 rounded-lg border-2 ${selectedType === 'Business' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'} `}>
          <div className='flex flex-col items-center'>
            <div className='w-12 h-12 mb-3 bg-emerald-100 rounded-full' />
            <h3 className='font-semibold'>{t('business')}</h3>
            <p className='text-sm text-gray-600 mt-1 text-center'>{t('businessDescription')}</p>
          </div>
        </button>
        <button type='button' onClick={() => setSelectedType('Individual')} className={`p-6 rounded-lg border-2 ${selectedType === 'Individual' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'} `}>
          <div className='flex flex-col items-center'>
            <div className='w-12 h-12 mb-3 bg-emerald-100 rounded-full' />
            <h3 className='font-semibold'>{t('individual')}</h3>
            <p className='text-sm text-gray-600 mt-1 text-center'>{t('individualDescription')}</p>
          </div>
        </button>
      </div>
      <SubmitButton isLoading={loading} onClick={() => (selectedType ? onSelect(selectedType) : toast.error(t('selectUserType')))}>
        {t('continueToExplore')}
      </SubmitButton>
    </motion.div>
  );
};

const PhoneLoginForm = () => {
  const t = useTranslations('auth');
  const { setLoading, setError, loading } = useContext(AuthContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 600));
      toast.success(t('success.codeSent'));
    } catch {
      setError(t('errors.codeSendFailed'));
      toast.error(t('errors.codeSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form onSubmit={handleSubmit(onSubmit)} className='w-full'>
      <Input label={t('phoneNumber')} type='tel' placeholder={t('enterPhone')} register={register('phone')} error={errors.phone?.message && t(`errors.${errors.phone.message}`)} />
      <SubmitButton isLoading={loading}>{t('sendCodeButton')}</SubmitButton>
    </motion.form>
  );
};
