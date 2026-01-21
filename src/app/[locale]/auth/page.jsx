'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
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
import { usernameSchema } from '@/utils/profile';
import { useAuth } from '@/context/AuthContext';
import PhoneInputWithCountry from '@/components/atoms/PhoneInputWithCountry';
import Logo from '@/components/common/Logo';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';


/* ---------- Login Success Animation Component ----------- */
const LoginSuccessAnimation = ({ message, onComplete }) => {
  const t = useTranslations('Auth');

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     onComplete?.();
  //   }, 20000); // Show for 2 seconds

  //   return () => clearTimeout(timer);
  // }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 h-screen w-screen z-[9999] flex items-center justify-center bg-white"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="flex flex-col items-center justify-center"
      >
        {/* Animated Check Circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 15,
            delay: 0.1
          }}
          className="mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{
              duration: 0.6,
              times: [0, 0.6, 1],
              delay: 0.2
            }}
            className="relative"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-main-500 to-main-400 flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
            {/* Ripple effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-main-400"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
            />
          </motion.div>
        </motion.div>

        {/* Success Message */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl font-bold text-gray-800 mb-2"
        >
          {message || t('success.signedIn')}
        </motion.h2>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-2 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-main-500"
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

/* ---------- schemas ----------- */
const loginSchema = z.object({
  email: z.email('invalidEmail'),
  password: z.string().min(1, 'passwordRequired'),
});

const registerSchema = z.object({
  username: usernameSchema,
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
    otp: z.string().regex(/^[0-9]+$/, 'otpNumbersOnly').length(4, 'otpLength')
    ,
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'passwordsMatch',
    path: ['confirmNewPassword'],
  });

const phoneLoginSchema = z.object({
  phone: z.string().min(6, 'phoneMin'),
});

/* ---------- context ---------- */
const AuthFormContext = createContext(null);

/* ---------- small UI bits (titles/tabs) unchanged from your file ---------- */
function TitleByTab({ activeTab, view }) {
  const t = useTranslations('Auth');
  const TITLES = {
    login: {
      options: { title: t('signIn'), subtitle: t('chooseMethod') },
      email: { title: t('signIn'), subtitle: t('emailMethod') },
      phone: { title: t('signIn'), subtitle: t('phoneMethod') },
      otp: { title: t('signIn'), subtitle: t('otpMethod') },
    },
    register: {
      options: { title: t('signUp'), subtitle: t('chooseYourSignUpMethod'), values: [t('signUpMethod1'), t('signUpMethod2')] },
      email: { title: t('signUp'), subtitle: t('createAccount') },
      phone: { title: t('signUp'), subtitle: t('phoneSignUp') },
      otp: { title: t('verifyEmail'), subtitle: t('verifyEmailSubtitle') },
    },
    'forgot-password': {
      email: { title: t('forgotPassword'), subtitle: t('resetPassword') },
      otp: { title: t('verifyIdentity'), subtitle: t('verifyIdentitySubtitle') },
      reset: { title: t('setNewPassword'), subtitle: t('passwordRequirements') },
    },
  };
  const tabData = TITLES[activeTab] || TITLES.login;
  const content = tabData[view] || tabData.options || { title: '', subtitle: '', values: [] };


  return (
    <motion.div key={`${activeTab}-${view}`} className="mb-6 text-center md:text-left">
      <h1 className="text-center mt-2 text-xl md:text-2xl font-extrabold">{content.title}</h1>

      {content.subtitle && (
        <p className="text-center mt-1 text-base text-gray-600">{content.subtitle}</p>
      )}

      {/* عرض القيم إذا موجودة */}
      {content.values && content.values.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 text-gray-600">
          {content.values.map((val, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 flex-none rounded-full bg-main-600" />
              <span>{val}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

const TABS = [
  { key: 'login', label: 'signInTap' },
  { key: 'register', label: 'signUp' },
  { key: 'forgot-password', label: 'forgotPassword' },
];

function AuthTabs({ setView, activeTab, setActiveTab }) {
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = key => {
    setActiveTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

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
              {isActive && <motion.span layoutId='active-pill' className='absolute inset-0 rounded-xl bg-gradient-to-r from-main-500 to-main-400' />}
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
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();

  const redirectUrl = searchParams?.get('redirect') || '/';
  const userType = searchParams.get('type') || null;

  const handleGoogleLogin = async () => {
    let url = `${API_BASE_URL}auth/google`;
    const params = new URLSearchParams();
    if (redirectUrl) params.append('redirect', redirectUrl);
    if (referralCode) params.append('ref', referralCode);
    if (userType) params.append('type', userType);

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
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || null;
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleAppleLogin = async () => {
    let url = `${API_BASE_URL}auth/apple`;
    const params = new URLSearchParams();
    if (redirectUrl) params.append('redirect', redirectUrl);
    if (referralCode) params.append('ref', referralCode);
    if (userType) params.append('type', userType);
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
  const t = useTranslations('Auth');
  return <SocialButton icon='/images/email-icon.png' text={t('continueWithEmail')} onClick={onClick} />;
};
export const ContinueWithPhoneButton = ({ onClick }) => {
  const t = useTranslations('Auth');
  return <SocialButton icon='/images/phone-icon.png' text={t('continueWithPhone')} onClick={onClick} />;
};

/* ---------- forms (switched to api from lib/axios) ---------- */
const LoginForm = ({ onLoggedIn }) => {
  const t = useTranslations('Auth');
  const { login } = useAuth();

  const { setLoading, setError, loading, setShowSuccessAnimation, setSuccessMessage } = useContext(AuthFormContext);
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
      const { accessToken, refreshToken, user: fatchedUser } = await login(data);

      //set login data at cookie
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, refreshToken, user: fatchedUser }),
      });

      // Show success animation instead of toast
      setSuccessMessage(t('success.signedIn'));
      setShowSuccessAnimation(true);

      setLoading(false);
      setTimeout(() => {
        // setShowSuccessAnimation(false);
        onLoggedIn?.(fatchedUser);
      }, 1000);
    } catch (err) {
      const msg = err?.response?.data?.message || t('errors.loginFailed');
      const errorMsg = msg === 'Refresh token not provided in the request body' ? t('errors.incorrectEmailOrPassword') : msg;
      setError(errorMsg);
      toast.error(errorMsg);
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
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const userType = searchParams.get('type') || 'buyer';
  const { setLoading, setError, loading } = useContext(AuthFormContext);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', role: userType, type: 'Individual', ref: referralCode },
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
      <Controller
        name="role"
        control={control}
        render={({ field, fieldState }) => (
          <SelectInput
            label={t('role.selectRole')}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message && t(`errors.${fieldState.error.message}`)}
            options={[
              { value: 'buyer', label: t('role.buyer') },
              { value: 'seller', label: t('role.seller') },
            ]}
          />
        )}
      />

      <Controller
        name="type"
        control={control}
        render={({ field, fieldState }) => (
          <SelectInput
            label={t('userType')}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message && t(`errors.${fieldState.error.message}`)}
            options={[
              { value: 'Business', label: t('business') },
              { value: 'Individual', label: t('individual') },
            ]}
          />
        )}
      />

      <Input label={t('referralCode')} type='text' placeholder={t('enterReferral')} register={register('ref')} error={errors.ref?.message && t(`errors.${errors.ref.message}`)} />
      <SubmitButton isLoading={loading}>{t('createAccountButton')}</SubmitButton>
    </motion.form>
  );
};

const ForgotPasswordForm = ({ onOtp }) => {
  const t = useTranslations('Auth');
  const { setLoading, setSuccess, setError, loading } = useContext(AuthFormContext);
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

const ResetPasswordForm = ({ email, otp, onReset }) => {
  const t = useTranslations('Auth');
  const { setLoading, setSuccess, setError, loading } = useContext(AuthFormContext);

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
      onReset?.()
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

//purpose = 'verify-email' | 'verify-phone' | 'reset'
const OTPForm = ({ value, onVerified, purpose = 'verify-email' }) => {

  const t = useTranslations('Auth');
  const { setLoading, setError, loading } = useContext(AuthFormContext);
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref') || '';
  const userType = searchParams.get('type') || 'buyer';

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
      if (otp.length !== 4) throw new Error('errors.otpLength');
      if (purpose === 'verify-email') {
        await api.post('/auth/verify-email', { email: value, code: otp });
        toast.success(t('success.emailVerified'));
        onVerified?.();
      } else if (purpose === 'verify-phone') {
        const res = await api.post('/auth/verify-phone', { ...value, code: otp });
        const data = res.data;

        // Show success animation instead of toast - handled at parent level
        onVerified?.(data);
      } else {
        onVerified?.(otp); // for reset or other custom flows
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
      if (purpose === 'verify-email') {
        await api.post('/auth/resend-verification-email', { email: value });
      } else if (purpose === 'verify-phone') {
        await api.post('/auth/phone', {
          ...value,
          ref: referralCode,
          role: userType
        });

      } else {
        await api.post('/auth/forgot-password', { email: value });
      }
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
      <Input
        label={purpose === 'verify-phone' ? t('phoneNumber') : t('email')}
        type='text'
        value={purpose === 'verify-phone' ? `\u200E${value.countryCode.dial_code} ${value.phone}` : value}
        disabled
        cnInput='cursor-not-allowed '
      />
      <form onSubmit={onSubmit}>
        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>{t('otpCode')}</label>
          <OtpInput value={otp} onChange={setOtp} numInputs={4} renderSeparator={<span className='mx-1'>-</span>} renderInput={props => <input {...props} className='!w-10 h-10 border rounded-lg text-center text-xl' />} containerStyle='flex justify-center flex-wrap gap-y-2' />
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

const AuthOptions = ({ activeTab, onEmailClick, onPhoneClick, referralCode }) => {
  const t = useTranslations('Auth');
  return (
    <motion.div className='w-full h-full flex flex-col'>
      <div className='flex-1 flex flex-col items-center justify-center gap-4 py-6'>
        <ContinueWithEmailButton onClick={onEmailClick} />
        <ContinueWithGoogleButton referralCode={referralCode} />
        {/* <ContinueWithAppleButton referralCode={referralCode} /> */}
        {activeTab === 'login' && <ContinueWithPhoneButton onClick={onPhoneClick} />}
      </div>
      <p className='text-sm text-gray-500 border-t border-slate-200 mt-6 pt-6'>{t('terms')}</p>
    </motion.div>
  );
};

/* ---------- main ---------- */
export default function AuthPage() {
  const router = useRouter();
  const { user: me, setCurrentUser, refetchUser, updateTokens } = useAuth();
  const searchParams = useSearchParams();
  const t = useTranslations('Auth');

  const tabParam = searchParams?.get('tab') || 'login';
  const loginError = searchParams?.get('error');
  const errorMessage = searchParams?.get('error_message');
  const accessTokenFromUrl = searchParams?.get('accessToken');
  const refreshTokenFromUrl = searchParams?.get('refreshToken');
  const redirectUrl = searchParams?.get('redirect') || '/explore';
  const referralCode = searchParams?.get('ref');

  const [activeTab, setActiveTab] = useState(tabParam);
  const [view, setView] = useState('options');//options
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [OTPValue, setOTPValue] = useState('am259@gmail.com');
  const [otpForReset, setOtpForReset] = useState('');

  const [needsUserTypeSelection, setNeedsUserTypeSelection] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (loginError === 'oauth_failed') {
      toast.error(errorMessage || t('errors.loginFailedTryAgain'));


      // 🔥 Remove query param from URL without reload
      const params = new URLSearchParams(window.location.search);
      params.delete('error');
      params.delete('error_message');

      const newUrl =
        window.location.pathname + '?' + params.toString();

      router.replace(newUrl, { scroll: false });
    }

    if (loginError === 'confirmation_failed') {
      toast.error(errorMessage || t('errors.emailConfirmationFailed'));

      // 🔥 Remove query param from URL without reload
      const params = new URLSearchParams(window.location.search);
      params.delete('error');
      params.delete('error_message');

      const newUrl =
        window.location.pathname + '?' + params.toString();

      router.replace(newUrl, { scroll: false });
    }

  }, [t, router, loginError])

  // OAuth: if query has tokens, store them and fetch /auth/me
  useEffect(() => {
    const run = async () => {
      if (!accessTokenFromUrl) return;
      try {

        updateTokens({ accessToken: accessTokenFromUrl, refreshToken: refreshTokenFromUrl });
        const fatchedUser = await refetchUser();

        //set login data at cookie
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: accessTokenFromUrl, refreshToken: refreshTokenFromUrl, user: fatchedUser }),
        });
        if (!fatchedUser?.type) {
          setNeedsUserTypeSelection(true);
        } else {
          // Show success animation instead of toast
          setSuccessMessage(t('success.loggedInSuccessfully'));
          setShowSuccessAnimation(true);

          setTimeout(() => {
            // setShowSuccessAnimation(false);
            if (fatchedUser.role === 'seller') {
              router.push('/jobs');
            } else {
              router.push(redirectUrl);
            }
          }, 1000);

        }
      } catch (e) {
        console.error('OAuth finalize failed', e);
        toast.error(t('errors.failedToCompleteLogin'));
      }
    };
    run();
  }, [accessTokenFromUrl, refreshTokenFromUrl, router, redirectUrl]);

  const handleUserTypeSelect = async userType => {
    setLoading(true);
    try {
      const me = await api.put('/auth/profile', { type: userType }).then(r => r.data);
      setCurrentUser(prev => ({
        ...prev,
        ...me,
        relatedUsers: prev?.relatedUsers || [], // keep previous relatedUsers
      }));

      toast.success(t('success.userTypeUpdatedSuccessfully'));
      if (me.role === 'seller') {
        router.push('/jobs');
      }
      else {
        router.push(redirectUrl);
      }
    } catch (e) {
      toast.error(t('errors.failedToUpdateUserType'));
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
      if (me && window.location.pathname === '/auth') {
        if (me.role === 'seller') {
          router.push('/jobs');
        }
        else {
          router.push(redirectUrl);
        }
      }
    } catch { }
  }, [router, me]);

  const handleEmailClick = () => setView('email');
  const handlePhoneClick = () => setView('phone');
  const handleOTPRequest = email => {
    setOTPValue(email);
    setView('otp');
  };

  const handleOTPRequestPhone = phone => {
    setOTPValue(phone);
    setView('otp-phone');
  };

  const handleResetOTP = otp => {
    setOtpForReset(otp);
    setView('reset');
  };
  const onOtpVerifiedGoToLogin = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'login');
    router.replace(`/auth?${params.toString()}`, { scroll: false });
    setView('email');
  };
  const handleLoggedIn = user => {
    if (user.role === 'seller') {
      router.push('/jobs');
    }
    else {
      router.push(redirectUrl);
    }
  };

  async function handlePhoneLoggedIn({ accessToken, refreshToken, user }) {
    updateTokens({ accessToken, refreshToken });
    setCurrentUser(user);
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken, user: user }),
    });

    // Show success animation instead of toast
    setSuccessMessage(t('success.phoneVerified'));
    setShowSuccessAnimation(true);

    setTimeout(() => {
      // setShowSuccessAnimation(false);
      if (user.role === 'seller') {
        router.push('/jobs');
      }
      else {
        router.push(redirectUrl);
      }
    }, 1000);

  };


  function handleGoToLogin() {
    setActiveTab('login');
    setView('email');
  }


  const renderContent = () => {
    if (needsUserTypeSelection) return <UserTypeSelection onSelect={handleUserTypeSelect} loading={loading} />;
    if (activeTab === 'forgot-password' && view === 'reset') return <ResetPasswordForm email={OTPValue} otp={otpForReset} onReset={handleGoToLogin} />;


    switch (view) {
      case 'email':
        if (activeTab === 'login') return <LoginForm onLoggedIn={handleLoggedIn} />;
        if (activeTab === 'register') return <RegisterForm onOtp={handleOTPRequest} />;
        return <ForgotPasswordForm onOtp={handleOTPRequest} />;
      case 'phone':
        return <PhoneLoginForm onOtp={handleOTPRequestPhone} />;
      case 'otp':
        if (activeTab === 'forgot-password') return <OTPForm value={OTPValue} onVerified={handleResetOTP} purpose='reset' />;
        return <OTPForm value={OTPValue} onVerified={onOtpVerifiedGoToLogin} purpose='verify-email' />;
      case 'otp-phone':
        return <OTPForm value={OTPValue} onVerified={handlePhoneLoggedIn} purpose='verify-phone' />
      default:
        return <AuthOptions activeTab={activeTab} onEmailClick={handleEmailClick} onPhoneClick={handlePhoneClick} referralCode={referralCode} />;
    }
  };
  const rawFeatures = t.raw('hero.features');
  const features = Array.isArray(rawFeatures) ? rawFeatures : [];
  return (
    <AuthFormContext.Provider value={{ loading, setLoading, error, setError, success, setSuccess, setShowSuccessAnimation, setSuccessMessage }}>
      <AnimatePresence>
        {showSuccessAnimation && (
          <LoginSuccessAnimation
            message={successMessage}
            onComplete={() => setShowSuccessAnimation(false)}
          />
        )}
      </AnimatePresence>
      <div className='min-h-screen !px-0 flex justify-center  bg-gray-100 '>
        <div className='relative max-w-screen-2xl m-0 sm:m-10   sm:rounded-lg flex justify-center flex-1 overflow-hidden bg-white'>


          {/* left hero */}
          <div className='hidden w-full lg:flex p-12 text-white relative overflow-hidden'>
            <div className='absolute inset-0 z-[10]' style={{ background: 'linear-gradient(269.99deg, rgba(0,0,0,0) 15.21%, rgba(0,0,0,0.48) 33.9%, rgba(0,0,0,0.8) 132.88%)' }} />
            <Image priority loading='eager' fill src='/images/auth.jpeg' alt='' className='absolute inset-0 object-cover w-full h-full object-right' />
            <div className='relative z-10 max-w-2xl mx-auto my-auto'>
              <motion.h1 className='text-2xl lg:text-3xl xl:text-4xl font-extrabold mb-3'>  {t('hero.title')}</motion.h1>
              <motion.p className='text-base lg:text-lg xl:text-2xl font-normal mb-2'>{t('hero.subtitle1')}</motion.p>
              <motion.p className='text-base lg:text-lg xl:text-2xl font-normal mb-6'>{t('hero.subtitle2')}</motion.p>              <div className='space-y-2 sm:text-base lg:text-lg xl:text-lg'>
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
          <div className='relative w-full lg:max-w-[500px] flex items-center flex-col justify-center p-6 lg:px-10 '>
            <div className='flex justify-center items-center absolute top-10 start-10'>
              <Logo textHideMobile={false} />
            </div>
            <motion.div className='w-full max-lg:p-8 lg:py-8'>
              <div className='mb-4 w-full text-center md:text-start'>
                <h4 className='text-sm font-semibold text-main-700'>{t('brandingTitle')}</h4>
                <p className='text-xs text-slate-500 mt-1'>{t('brandingSubtitle')}</p>
              </div>
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
      </div>
    </AuthFormContext.Provider>
  );
}

/* helper component (unchanged) */
const UserTypeSelection = ({ onSelect, loading }) => {
  const t = useTranslations('Auth');
  const [selectedType, setSelectedType] = useState(null);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='w-full'>
      <h2 className='text-xl font-bold text-center mb-6'>{t('selectUserType')}</h2>
      <p className='text-gray-600 text-center mb-8'>{t('selectUserTypeDescription')}</p>
      <div className='grid grid-cols-2 gap-4 mb-8'>
        <button type='button' onClick={() => setSelectedType('Business')} className={`p-6 rounded-lg border-2 ${selectedType === 'Business' ? 'border-main-500 bg-main-50' : 'border-gray-300'} `}>
          <div className='flex flex-col items-center'>
            <div className='w-12 h-12 mb-3 bg-main-100 rounded-full' />
            <h3 className='font-semibold'>{t('business')}</h3>
            <p className='text-sm text-gray-600 mt-1 text-center'>{t('businessDescription')}</p>
          </div>
        </button>
        <button type='button' onClick={() => setSelectedType('Individual')} className={`p-6 rounded-lg border-2 ${selectedType === 'Individual' ? 'border-main-500 bg-main-50' : 'border-gray-300'} `}>
          <div className='flex flex-col items-center'>
            <div className='w-12 h-12 mb-3 bg-main-100 rounded-full' />
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

const PhoneLoginForm = ({ onOtp }) => {
  const t = useTranslations('Auth');
  const { setLoading, setError, loading } = useContext(AuthFormContext);
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const userType = searchParams.get('type') || 'buyer';

  const [state, setState] = useState({
    countryCode: { code: 'SA', dial_code: '+966' },
    phone: '',
  });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedPhone = state.phone.trim();
    const isValid = trimmedPhone.length >= 6 && /^\d+$/.test(trimmedPhone);

    if (!isValid) {
      const msg = t('errors.phoneMin') || t('errors.phoneNumberValidationMessage');
      setError(msg);
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/phone', {
        countryCode: state.countryCode,
        phone: trimmedPhone,
        ref: referralCode,
        role: userType
      });


      onOtp?.({
        countryCode: state.countryCode,
        phone: trimmedPhone,
      });
      toast.success(t('success.codeSent'));
    } catch (err) {
      const msg = err?.response?.data?.message || t('errors.codeSendFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form onSubmit={onSubmit} className='w-full'>
      <div className='mb-4'>
        <PhoneInputWithCountry value={state} onChange={setState} />
        {state.phone && state.phone.length < 6 && (
          <p className='text-red-500 text-sm mt-2'>{t('errors.phoneMin')}</p>
        )}
      </div>
      <SubmitButton isLoading={loading}>{t('sendCodeButton')}</SubmitButton>
    </motion.form>
  );
};
