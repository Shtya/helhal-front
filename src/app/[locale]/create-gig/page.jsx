'use client';

import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, Pencil, ArrowUp, ArrowDown, Search, Plus, Trash2, X, HelpCircle, ChevronRight } from 'lucide-react';
import ProgressBar from '@/components/pages/gig/ProgressBar';
import InputList from '@/components/atoms/InputList';
import Textarea from '@/components/atoms/Textarea';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { Switcher } from '@/components/atoms/Switcher';
import AttachFilesButton, { getFileIcon } from '@/components/atoms/AttachFilesButton';
import { apiService } from '@/services/GigServices';
import { useEffect, useState, useMemo, useRef } from 'react';
import { AnimatedCheckbox } from '@/components/atoms/CheckboxAnimation';
import api, { baseImg } from '@/lib/axios';
import toast from 'react-hot-toast';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import CategorySelect from '@/components/atoms/CategorySelect';
import FormErrorMessage from '@/components/atoms/FormErrorMessage';
import { useDebounce } from '@/hooks/useDebounce';
import LocationSelect from '@/components/atoms/LocationSelect';
import { useValues } from '@/context/GlobalContext';

const normalizeFile = (file) => ({
  ...file,
  filename: file.filename || file.fileName || '',
});

export const useGigCreation = () => {
  const t = useTranslations('CreateGig.toast');
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    category: null,
    subcategory: null,
    tags: [],
    title: '',
    brief: '',
    packages: [
      { test: false, title: 'Basic', description: '', deliveryTime: 3, revisions: 1, price: 0 },
      { test: false, title: 'Standard', description: '', deliveryTime: 5, revisions: 2, price: 0 },
      { test: false, title: 'Premium', description: '', deliveryTime: 7, revisions: 3, price: 0 },
    ],
    extraFastDelivery: false,
    additionalRevision: false,
    description: '',
    faqs: [],
    questions: [],
    images: [],
    video: [],
    documents: [],
    country: null,
    state: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingServices, setLoadingServices] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGigData = async () => {
      // const gigSlug = searchParams.get('slug');
      const gigSlug = '';
      const savedData = sessionStorage.getItem('gigCreationData');
      const savedStep = sessionStorage.getItem('gigCreationStep');

      if (!gigSlug) return;
      if (savedStep) {
        setStep(parseInt(savedStep, 10));
      }

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.slug === gigSlug) {
            setFormData(parsed);
            return; // ✅ stop here if we already have matching saved data
          }
        } catch (err) {
          console.error('Error parsing saved session data', err);
        }
      }


      try {
        const res = await apiService.getService(gigSlug);

        const newData = {
          id: res.id,
          slug: res.slug,
          category: res.category,
          country: res.country || null,
          state: res.state || null,
          subcategory: res.subcategory,
          tags: res.searchTags,
          title: res.title,
          brief: res.brief,
          packages: res.packages,
          extraFastDelivery: res.extraFastDelivery,
          additionalRevision: res.additionalRevision,
          faqs: res.faq,
          questions: res.requirements,
          images: res.gallery
            ?.filter(e => e.type === 'image')
            .map(normalizeFile),

          video: res.gallery
            ?.filter(e => e.type === 'video')
            .map(normalizeFile),

          documents: res.gallery
            ?.filter(e => e.type === 'document')
            .map(normalizeFile),
        };

        setFormData(newData);
        sessionStorage.setItem('gigCreationData', JSON.stringify(newData));
      } catch (err) {
        console.error('Error fetching gig data', err);
      }
    };

    fetchGigData();
  }, [searchParams]);


  useEffect(() => {
    const gigSlug = searchParams.get('slug');
    if (!gigSlug) {
      loadSavedData();
    }
  }, []);

  const loadSavedData = () => {
    if (typeof window === 'undefined') return;

    const savedData = sessionStorage.getItem('gigCreationData');
    const savedStep = sessionStorage.getItem('gigCreationStep');

    // If the session draft includes an 'id', it came from Edit mode.
    // Do NOT reuse this data in Create mode
    const parsedData = JSON.parse(savedData);
    const savedId = parsedData?.id;
    if (savedId) return;

    if (savedData) setFormData(parsedData);
    if (savedStep) setStep(parseInt(savedStep));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem('gigCreationData', JSON.stringify(formData));
    sessionStorage.setItem('gigCreationStep', step.toString());
  }, [formData, step]);

  const nextStep = () => step < 6 && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  const handleSubmit = async () => {
    const gigSlug = searchParams.get('slug');

    try {
      setLoadingServices(true);

      const serviceData = {
        title: formData.title,
        brief: formData.brief,
        searchTags: formData.tags,
        categoryId: formData.category?.id,
        subcategoryId: formData.subcategory?.id,
        status: 'Pending',
        faq: formData.faqs,
        packages: formData.packages,
        gallery: [
          ...formData.images.map(img => ({ type: 'image', fileName: img.filename, url: img.url, assetId: img.id })),
          ...formData.video.map(vid => ({ type: 'video', url: vid.url, fileName: vid.filename, assetId: vid.id })),
          ...formData.documents.map(doc => ({ type: 'document', url: doc.url, fileName: doc.filename, assetId: doc.id }))],
        requirements: formData.questions,
        countryId: formData.country || null,
        stateId: formData.state || null,
        // fastDelivery: formData.extraFastDelivery,
        // additionalRevision: formData.additionalRevision,
      };

      console.log(serviceData);

      if (gigSlug) {
        const gigId = formData?.id;
        await apiService.updateService(gigId, serviceData);
        toast.success(t('serviceUpdated'));
      } else {
        await apiService.createService(serviceData);
        toast.success(t('serviceCreated'));
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gigCreationData');
        sessionStorage.removeItem('gigCreationStep');
      }
      router.push('/my-gigs');
    } catch (error) {
      const meg = error?.message;
      toast.error(meg || t('failedToCreate'));
    } finally {
      setLoadingServices(false);
    }
  };

  return {
    step,
    setStep,
    formData,
    setFormData,
    loading,
    error,
    nextStep,
    prevStep,
    handleSubmit,
    loadingServices,
  };
};

// --- VALIDATION SCHEMAS ---
const getStep1Schema = (t) => yup.object({
  title: yup.string().trim().required(t('validation.titleRequired')).min(5, t('validation.titleMin')).max(100, t('validation.titleMax')),
  brief: yup.string().trim().required(t('validation.briefRequired')).min(10, t('validation.briefMin')).max(500, t('validation.briefMax')),
  category: yup.object().required(t('validation.categoryRequired')),
  subcategory: yup.object().nullable().notRequired(),
  country: yup.string().required(t('validation.countryRequired')),
  state: yup.string().nullable().notRequired(),
  tags: yup.array()
    .of(
      yup.string()
        .trim()
        .required(t('validation.tagRequired'))
    )
    .min(1, t('validation.tagsMin'))
    .max(5, t('validation.tagsMax')),
});

const getStep2Schema = (t) => yup.object({
  packages: yup
    .array()
    .of(
      yup.object({
        type: yup.string().oneOf(['basic', 'standard', 'premium']).required(),
        // title: yup.string().trim().required(t('validation.packageTitleRequired')).max(60, t('validation.packageTitleMax')),
        description: yup.string().trim().required(t('validation.packageDescriptionRequired')).max(220, t('validation.packageDescriptionMax')),
        deliveryTime: yup.number().typeError(t('validation.deliveryTimeRequired')).required().min(1, t('validation.deliveryTimeMin')).max(1200, t('validation.deliveryTimeMax')),
        revisions: yup.number().typeError(t('validation.revisionsRequired')).required().min(0, t('validation.revisionsMin')).max(20, t('validation.revisionsMax')),
        price: yup.number().typeError(t('validation.priceRequired')).required().min(1, t('validation.priceMin')).max(100000, t('validation.priceMax')),
        // test: yup.boolean().required(t('validation.testRequired')),
        features: yup.array().of(yup.string().trim().required(t('validation.featureRequired')).max(50, t('validation.featureMax'))).min(1, t('validation.featuresMin')).max(5, t('validation.featuresMax')),
      }),
    )
    .min(1, t('validation.atLeastOnePackage')),
  // extraFastDelivery: yup.boolean(),
  // additionalRevision: yup.boolean(),
});

const getStep3Schema = (t) =>
  yup.object({
    faqs: yup
      .array()
      .of(
        yup.object({
          question: yup
            .string()
            .trim()
            .required(t('validation.faqQuestionRequired'))
            .max(200, t('validation.faqQuestionMax')),
          answer: yup
            .string()
            .trim()
            .required(t('validation.faqAnswerRequired'))
            .max(1000, t('validation.faqAnswerMax')),
        })
      )
      .max(12, t('validation.faqsMax')),
  });



const getStep4Schema = (t) =>
  yup.object({
    questions: yup
      .array()
      .of(
        yup.object({
          question: yup
            .string()
            .trim()
            .required(t('validation.questionRequired'))
            .max(200, t('validation.questionMax')),
          requirementType: yup
            .string()
            .oneOf(['text', 'multiple_choice', 'file'])
            .required(t('validation.requirementTypeRequired')),
          isRequired: yup.boolean().default(false),
          options: yup.array().when('requirementType', {
            is: 'multiple_choice',
            then: (schema) =>
              schema
                .of(
                  yup
                    .string()
                    .trim()
                    .max(100, t('validation.optionMax'))
                    .required(t('validation.optionRequired'))
                )
                .min(1, t('validation.optionMin'))
                .max(10, t('validation.optionMaxCount')),
            otherwise: (schema) => schema.optional(),
          }),
        })
      )
      .max(12, t('validation.questionsMax')),
  });



const MAX_IMAGE_SIZE_MB = 10;   // example
const MAX_VIDEO_SIZE_MB = 200; // example
const MAX_PORTFOLIO_SIZE_MB = 25;

const ALLOWED_PORTFOLIO_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];


const fileSchema = yup.object({
  id: yup.string().optional(),
  filename: yup.string().required(),
  url: yup.string().required(),
  type: yup.string().oneOf(['image', 'video', 'document']).required(),
  mimeType: yup.string().optional(),
  size: yup.number().optional(),
});

// Main schema
const getStep5Schema = (t) => yup.object({
  images: yup.array()
    .of(fileSchema.test(
      'image-validation',
      t('validation.imageInvalid'),
      file => {
        if (!file) return true;

        if (file?.type) return file?.type === 'image';
        if (file?.mimeType) return file?.mimeType.startsWith('image/');
        if (file?.size) return file?.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024;

        return true;
      }
    ))
    .min(1, t('validation.imagesMin'))
    .max(3, t('validation.imagesMax')),

  video: yup.array()
    .of(fileSchema.test(
      'video-validation',
      t('validation.videoInvalid'),
      file => {
        if (!file) return true;

        if (file?.type) return file?.type === 'video';
        if (file?.mimeType) return file?.mimeType.startsWith('video/');
        if (file?.size) return file?.size <= MAX_VIDEO_SIZE_MB * 1024 * 1024;

        return true;
      }
    ))
    .max(1, t('validation.videoMax')),

  documents: yup.array()
    .of(fileSchema.test(
      'document-validation',
      t('validation.documentInvalid'),
      file => {
        if (!file) return true;

        if (file?.type) return file?.type === 'document';
        if (file?.mimeType) return ALLOWED_PORTFOLIO_TYPES.includes(file.mimeType);
        if (file?.size) return file?.size <= MAX_PORTFOLIO_SIZE_MB * 1024 * 1024;

        return true;
      }
    ))
    .max(2, t('validation.documentsMax')),
});

export default function GigCreationWizard() {
  const { step, formData, loadingServices, setFormData, loading, error, nextStep, prevStep, handleSubmit } = useGigCreation();
  const searchParams = useSearchParams()
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const renderStep = () => {
    if (loading) return <SkeletonLoading />;
    if (error) return <div className='text-red-500 text-center py-12'>{error}</div>;

    switch (step) {
      case 1:
        return <Step1 formData={formData} setFormData={setFormData} nextStep={nextStep} />;
      case 2:
        return <Step2 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <Step3 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <Step4 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 5:
        return <Step5 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 6:
        return <Step6 formData={formData} handleSubmit={handleSubmit} prevStep={prevStep} loading={loadingServices} />;
      default:
        return <Step1 formData={formData} setFormData={setFormData} nextStep={nextStep} />;
    }
  };

  const t = useTranslations('CreateGig');
  const gigSlug = searchParams.get('slug');
  const isEditMode = Boolean(gigSlug);

  // Base steps
  const steps = [
    {
      label: t('steps.overview'),
      title: isEditMode ? t('stepTitles.editGig') : t('stepTitles.createGig'),
      description: t('stepDescriptions.overview')
    },
    { label: t('steps.pricing'), title: t('stepTitles.packagesPricing'), description: t('stepDescriptions.pricing') },
    { label: t('steps.descriptionFaq'), title: t('stepTitles.faq'), description: t('stepDescriptions.faq') },
    { label: t('steps.requirements'), title: t('stepTitles.buyerRequirements'), description: t('stepDescriptions.requirements') },
    { label: t('steps.gallery'), title: t('stepTitles.galleryMedia'), description: t('stepDescriptions.gallery') },
    { label: t('steps.publish'), title: t('stepTitles.publishTitle'), description: t('stepDescriptions.publish') },
  ];


  return (
    <div className='container !mt-8 !mb-12'>
      <div className='mx-auto max-w-[1200px] w-full'>
        {/* Progress Header */}
        <ProgressBar step={step} steps={steps} />

        {/* Step Content */}
        <div className=''>
          <AnimatePresence mode='wait'>
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- STEP COMPONENTS ---
const Field = ({ title, desc, required, error, hint, className = '', children }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 ${className}`}>
      {/* Left label/description panel */}
      <div className='md:col-span-4'>
        <label className='block text-lg font-semibold leading-6 text-slate-800'>
          {title}
          {required ? <span className='text-rose-600 ml-1'>*</span> : null}
        </label>
        {desc ? <p className='mt-1 text-sm text-slate-500'>{desc}</p> : null}
      </div>

      {/* Right input panel */}
      <div className='md:col-span-8'>
        <div className=' bg-white '>{children}</div>
        {hint ? <p className='mt-1 text-xs text-slate-500'>{hint}</p> : null}
        {error ? <p className='mt-1 text-xs font-medium text-rose-600'>{error}</p> : null}
      </div>
    </div>
  );
};

// ---------- Step 1 (refreshed UI) ----------
function Step1({ formData, setFormData, nextStep }) {

  const t = useTranslations('CreateGig.step1');
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
    trigger,
    reset,
    control,
  } = useForm({
    resolver: yupResolver(getStep1Schema(t)),
    defaultValues: {
      title: formData.title || '',
      brief: formData.brief || '',
      category: formData.category || null,
      subcategory: formData.subcategory || null,
      country: formData.country || null,
      state: formData.state || null,
      tags: formData.tags || [],
    }
  });

  const [titleStatus, setTitleStatus] = useState({
    loading: false,
    valid: null,
  });


  const titleVal = watch('title') || '';
  const briefVal = watch('brief') || '';

  const { debouncedValue: debouncedTitle } = useDebounce({ value: titleVal, delay: 500 });

  useEffect(() => {
    if (!debouncedTitle || debouncedTitle.length < 5) {
      setTitleStatus({ loading: false, valid: null });
      return;
    }

    let cancelled = false;

    const checkTitle = async () => {
      setTitleStatus(prev => ({ ...prev, loading: true }));

      try {
        const res = await api.get(`/services/check-title/${debouncedTitle}`);

        if (cancelled) return;
        const { isUnique, ownedByCurrentUser } = res.data;

        let message = '';
        let valid = false;

        if (isUnique) {
          valid = true;
          message = t('titleAvailable');
        } else if (ownedByCurrentUser) {
          valid = false; // allow user to proceed
          message = t('titleUsedByYou');
        } else {
          valid = false;
          message = t('titleUsedByOther');
        }

        setTitleStatus({
          loading: false,
          valid,
          message,
        });
      } catch {
        if (!cancelled) {
          setTitleStatus({
            loading: false,
            valid: false,
            message: t('errors.titleCheckFailed'),
          });
        }
      }
    };

    checkTitle();

    return () => {
      cancelled = true;
    };
  }, [debouncedTitle]);


  // reinitialize when formData changes
  useEffect(() => {
    reset({
      title: formData.title || '',
      brief: formData.brief || '',
      category: formData.category || null,
      subcategory: formData.subcategory || null,
      country: formData.country || null,
      state: formData.state || null,
      tags: formData.tags || [],
    });
  }, [formData, reset]);



  const onSubmit = async data => {
    const isValid = await trigger();
    if (!isValid) return;

    if (titleStatus.valid === false || titleStatus.valid === null) {
      setTitleStatus(prev => ({ ...prev, message: t('errors.titleInvalid') }));
      return;
    }


    setFormData({ ...formData, title: titleVal, brief: briefVal, ...data });
    nextStep();
  };

  const handleInputListChange = value => {
    // const merged = [...(formData?.tags || []), ...(value || [])];
    const merged = [...value || []];
    setValue('tags', merged);
    setFormData({ ...formData, title: titleVal, brief: briefVal, tags: merged });
  };

  const handleCategoryChange = value => {
    setValue('category', value);

    setFormData({ ...formData, title: titleVal, brief: briefVal, category: value, subcategory: null }); // clear sub when main changes
  };

  const handleSubcategoryChange = value => {
    setValue('subcategory', value);
    setFormData({ ...formData, title: titleVal, brief: briefVal, subcategory: value });
  };

  const handleCountryChange = value => {
    setValue('country', value);

    setFormData({ ...formData, title: titleVal, brief: briefVal, country: value, state: null }); // clear sub when main changes
  };

  const handleStateChange = value => {
    setValue('state', value);
    setFormData({ ...formData, title: titleVal, brief: briefVal, state: value });
  };

  const handleRemoveInputList = value => {
    setFormData(prev => {
      const updatedTags = (prev.tags || []).filter((val) => val !== value);
      setValue('tags', updatedTags);
      return { ...prev, tags: updatedTags };
    });
  };
  return (
    <form onSubmit={e => e.preventDefault()} className='rounded-2xl border border-slate-200 bg-white/60 p-6 md:p-10'>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        {/* Note about platform fee (improved UI) */}


      </div>

      <div className='mx-auto max-w-5xl space-y-8'>
        {/* Gig Title */}
        <Field title={t('gigTitle')} desc={t('gigTitleDesc')} required error={errors?.title?.message} hint={`${titleVal.length}/80`}>
          <Textarea placeholder={t('placeholders.titleExample')} {...register('title')} rows={2} className='resize-none' maxLength={80} />
          {/* Title status */}
          {titleStatus.loading && (
            <p className="mt-1 text-xs text-slate-400">
              {t('checkingTitle')}...
            </p>
          )}

          {!titleStatus.loading && titleStatus.valid === true && (
            <p className="mt-1 text-xs text-main-600">
              {titleStatus.message || t('titleAvailable')}
            </p>
          )}

          {!titleStatus.loading && titleStatus.valid === false && (
            <p className="mt-1 text-xs text-red-600">
              {titleStatus.message}
            </p>
          )}
        </Field>

        {/* Gig Brief */}
        <Field className='pt-8 border-t border-slate-200' title={t('gigBrief')} desc={t('gigBriefDesc')} required error={errors?.brief?.message} hint={`${briefVal.length}/300`}>
          <Textarea placeholder={t('placeholders.briefExample')} {...register('brief')} rows={4} className='resize-y' maxLength={300} />
        </Field>

        {/* Category / Subcategory */}
        <Field className='pt-8 border-t border-slate-200' title={t('category')} desc={t('categoryDesc')} required >
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='mb-4'>
              <Controller name='categoryId' control={control} render={({ field }) => (
                <CategorySelect type='category' label={t('category')} value={formData.category?.id} onChange={handleCategoryChange} error={errors?.category?.message} placeholder={t('placeholders.selectCategory')} />
              )} />
            </div>

            <div className='mb-4'>
              <Controller name='subcategoryId' control={control} render={({ field }) =>
              (
                <CategorySelect type='subcategory' parentId={watch('category')?.id} label={t('subcategory')} value={formData.subcategory?.id} onChange={handleSubcategoryChange} error={errors?.subcategory?.message} placeholder={watch('category') ? t('placeholders.selectSubcategory') : t('placeholders.selectCategoryFirst')} />
              )} />
            </div>

            {/* <Select label='Category' options={categories} value={formData.category?.id} onChange={handleCategoryChange} error={errors?.category?.message} required />
            <Select label='Subcategory'  value={formData.subcategory?.id} onChange={handleSubcategoryChange} error={errors?.subcategory?.message} disabled={!watch('category')} /> */}
          </div>
        </Field>

        {/* country / state */}
        <Field className='pt-8 border-t border-slate-200' title={t('country')} desc={t('countryDesc')} required >
          <div className='grid gap-4 md:grid-cols-2'>
            <LocationSelect
              type='country'
              value={formData?.country}
              // cnPlaceholder='!text-gray-900'
              error={errors?.country?.message}
              label={t('country')}
              onChange={opt => {
                handleCountryChange(opt?.id ?? '');
              }}
              placeholder={t('selectCountry')}
            />

            <LocationSelect
              type='state'
              parentId={watch('country')} // Pass selected countryId here
              value={formData?.state}
              error={errors?.state?.message}
              // cnPlaceholder='!text-gray-900'
              label={t('state')}
              onChange={opt => {
                handleStateChange(opt?.id ?? '');
              }}
              placeholder={formData?.country ? t('selectState') : t('selectCountryFirst')}
              disabled={!formData?.country}
            />


            {/* <Select label='Category' options={categories} value={formData.category?.id} onChange={handleCategoryChange} error={errors?.category?.message} required />
            <Select label='Subcategory'  value={formData.subcategory?.id} onChange={handleSubcategoryChange} error={errors?.subcategory?.message} disabled={!watch('category')} /> */}
          </div>
        </Field>

        {/* Tags */}
        <Field className='pt-8 border-t border-slate-200' title={t('searchTags')} desc={t('searchTagsDesc')} hint={t('tagsHint')}>
          <div>
            <InputList onChange={handleInputListChange} onRemoveItemHandler={handleRemoveInputList} label={t('placeholders.enterTagsLabel')} value={formData.tags} setValue={setValue} getValues={getValues} fieldName='tags' placeholder={t('placeholders.addTag')} errors={errors} validationMessage={errors?.tags?.message} maxItems={5} />
            <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
              <span>{t('maxTags')}</span>
              <span>{(formData.tags || []).length}/5</span>
            </div>
          </div>
        </Field>
      </div>

      {/* Footer */}
      <div className='mt-10 flex justify-end'>
        <Button onClick={handleSubmit(onSubmit)} name={t('continue')} color='green' className='!w-fit !px-8' />
      </div>
    </form>
  );
}

const TYPES = ['basic', 'standard', 'premium'];
function Step2({ formData, setFormData, nextStep, prevStep }) {
  const t = useTranslations('CreateGig.step2');
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
    watch,
    trigger,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: yupResolver(getStep2Schema(t)),
    mode: 'onChange',
    defaultValues: normalizeDefaults(formData),
  });

  const LABELS = [t('packageTypes.basic'), t('packageTypes.standard'), t('packageTypes.premium')];

  // Field arrays for features per package
  const fa0 = useFieldArray({ control, name: 'packages.0.features' });
  const fa1 = useFieldArray({ control, name: 'packages.1.features' });
  const fa2 = useFieldArray({ control, name: 'packages.2.features' });
  const fieldArrays = [fa0, fa1, fa2];

  const values = watch();

  const onSubmit = async data => {
    const ok = await trigger();
    if (!ok) return;
    setFormData(prev => ({ ...prev, ...data }));
    nextStep();
  };

  /* --------------------------------- UI ---------------------------------- */
  const pkgErrors = errors.packages || [];

  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-6'>
      {/* Matrix (desktop) / Cards (mobile) */}
      <div className='rounded-xl overflow-hidden border border-slate-200'>
        {/* Sticky header */}
        <div className='sticky top-0 z-[1] grid grid-cols-1 border-b border-slate-200 bg-white/80 backdrop-blur sm:grid-cols-4'>
          <div className='px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500'>{t('field')}</div>
          {LABELS.map((label, idx) => (
            <div key={label} className='border-l border-l-slate-200 px-4 py-4'>
              <div className='flex items-center justify-between'>
                <span className='text-base font-semibold text-slate-900'>{label}</span>
                {/* Show per-column summary error indicator */}
                {pkgErrors?.[idx] && <span className='rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700'>{t('checkErrors')}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className='grid grid-cols-1 sm:grid-cols-4'>
          {/* Title */}
          {/* <FieldLabel>{t('title')}</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`title-${i}`}>
              <Input placeholder={t('placeholders.title')} {...register(`packages.${i}.title`)} error={pkgErrors?.[i]?.title?.message} />
            </Cell>
          ))} */}

          {/* Description */}
          <FieldLabel>{t('description')}</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`desc-${i}`}>
              <Textarea rows={3} placeholder={t('placeholders.description')} {...register(`packages.${i}.description`)} error={pkgErrors?.[i]?.description?.message} />
            </Cell>
          ))}

          {/* Delivery Time */}
          <FieldLabel>{t('deliveryTime')}</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`delivery-${i}`}>
              <Input type='number' min={1} step={1} placeholder={t('placeholders.deliveryTime')} {...register(`packages.${i}.deliveryTime`, { valueAsNumber: true })} error={pkgErrors?.[i]?.deliveryTime?.message} />
            </Cell>
          ))}

          {/* Revisions */}
          <FieldLabel>{t('revisions')}</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`revisions-${i}`}>
              <Input type='number' min={0} step={1} placeholder={t('placeholders.revisions')} {...register(`packages.${i}.revisions`, { valueAsNumber: true })} error={pkgErrors?.[i]?.revisions?.message} />
            </Cell>
          ))}

          {/* Price */}
          <FieldLabel>{t('price')}</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`price-${i}`}>
              <Input type='number' min={0} step={1} placeholder={t('placeholders.price')} {...register(`packages.${i}.price`, { valueAsNumber: true })} error={pkgErrors?.[i]?.price?.message} />
            </Cell>
          ))}

          {/* Test (boolean) */}
          {/* <FieldLabel>{t('test')}</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`test-${i}`} className='flex items-center'>
              <AnimatedCheckbox
                checked={!!watch(`packages.${i}.test`)}
                onChange={() => {
                  const v = getValues(`packages.${i}.test`);
                  setValue(`packages.${i}.test`, !v, { shouldDirty: true, shouldValidate: true });
                }}
              />
              {pkgErrors?.[i]?.test?.message && <span className='ml-2 text-xs text-rose-600'>{pkgErrors?.[i]?.test?.message}</span>}
            </Cell>
          ))} */}

          {/* Features editor */}
          <FieldLabel>{t('features')}</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`features-${i}`}>
              <FeaturesEditor idx={i} fieldArray={fieldArrays[i]} register={register} errors={pkgErrors?.[i]?.features} />
            </Cell>
          ))}
        </div>
      </div>

      {/* Extra Services */}
      {/* <div className='rounded-xl bg-slate-50 p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Extra Services</h3>

        <Row>
          <ColLeft title='Extra Fast Delivery' desc='Complete orders faster for an additional fee' />
          <ColRight>
            <Switcher checked={watch('extraFastDelivery')} onChange={v => setValue('extraFastDelivery', v, { shouldDirty: true })} />
          </ColRight>
        </Row>

        <Row>
          <ColLeft title='Additional Revision' desc='Offer extra revisions for an additional fee' />
          <ColRight>
            <Switcher checked={watch('additionalRevision')} onChange={v => setValue('additionalRevision', v, { shouldDirty: true })} />
          </ColRight>
        </Row>
      </div> */}

      {/* Footer actions */}
      <div className='flex justify-end gap-2 pt-4'>
        <Button type='button' name={t('back')} color='outline' onClick={prevStep} icon={<ChevronRight className='ltr:scale-x-[-1]' />} className='!w-fit !flex-row-reverse' />
        <Button type='button' onClick={handleSubmit(onSubmit)} name={t('continue')} color='green' className='!w-fit !px-8' />
      </div>
    </form>
  );
}

/* ---------------------------- Helper Components --------------------------- */
function FieldLabel({ children }) {
  return <div className='border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 sm:border-r'>{children}</div>;
}
function Cell({ children, className = '' }) {
  return <div className={`border-t border-slate-200 px-4 py-3 sm:border-r ${className}`}>{children}</div>;
}
function Row({ children }) {
  return <div className='flex items-center justify-between border-b border-slate-200 py-3 last:border-b-0'>{children}</div>;
}
function ColLeft({ title, desc }) {
  return (
    <div>
      <h4 className='font-medium text-slate-900'>{title}</h4>
      <p className='text-sm text-slate-600'>{desc}</p>
    </div>
  );
}
function ColRight({ children }) {
  return <div className='flex items-center'>{children}</div>;
}

/* ---------------------------- Features Editor ----------------------------- */
function FeaturesEditor({ idx, fieldArray, register, errors }) {
  const t = useTranslations('CreateGig.step2');
  const { fields, append, remove } = fieldArray;

  const canAdd = fields.length < 5;
  const canRemove = fields.length > 1;

  return (
    <div>
      <div className='space-y-2'>
        {fields.map((f, i) => (
          <div key={f.id} className=' relative flex items-start gap-2'>
            <Input placeholder={t('placeholders.feature', { number: i + 1 })} {...register(`packages.${idx}.features.${i}`)} error={errors?.[i]?.message} className='flex-1  ' onAction={() => remove(i)} actionIcon={'/icons/minus.svg'} />
            {/* <Button className=" absolute top-1/2 rtl:left-2 ltr:right-2 -translate-y-1/2 !w-fit !px-2 " color='outline'  disabled={!canRemove} onClick={() => remove(i)} icon={<Minus className='h-4 !w-4' />}  aria-label='Remove feature'   /> */}
          </div>
        ))}
      </div>

      <div className='mt-2 flex-col flex gap-2 '>
        {typeof errors?.message === 'string' && <span className='ml-2 text-xs text-rose-600'>{errors?.message}</span>}
        <Button type='button' color='outline' disabled={!canAdd} onClick={() => append('')} icon={<Plus className='h-4 w-4' />} name={t('addFeature')} className='!w-fit' />
      </div>
    </div>
  );
}

/* --------------------------- Default Normalizer --------------------------- */
function normalizeDefaults(formData) {
  // Ensure three packages with required keys and 3 default features
  const base = [
    {
      type: 'basic',
      title: 'Basic Logo',
      description: 'Simple and clean logo suitable for startups.',
      deliveryTime: 3,
      revisions: 1,
      price: 50,
      test: false,
      // features: ['1 Concept', '1 Revision', 'PNG/JPG format'],
      features: ['1 Concept'],
    },
    {
      type: 'standard',
      title: 'Standard Logo Pack',
      description: 'Multiple options with vector files and color variations.',
      deliveryTime: 5,
      revisions: 3,
      price: 120,
      test: false,
      // features: ['3 Concepts', '2 Revisions', 'Vector Files Included'],
      features: ['3 Concepts'],
    },
    {
      type: 'premium',
      title: 'Premium Brand Identity',
      description: 'Complete identity with guide and social kit.',
      deliveryTime: 7,
      revisions: 10,
      price: 250,
      test: false,
      // features: ['5 Concepts', '3 Revisions', 'Brand Guide'],
      features: ['5 Concepts'],
    },
  ];

  const incoming = Array.isArray(formData?.packages) ? formData.packages : [];
  const merged = TYPES.map((t, i) => {
    const current = incoming[i] || {};
    return {
      type: t,
      title: current.title ?? base[i].title,
      description: current.description ?? base[i].description,
      deliveryTime: current.deliveryTime ?? base[i].deliveryTime,
      revisions: current.revisions ?? base[i].revisions,
      price: current.price ?? base[i].price,
      test: typeof current.test === 'boolean' ? current.test : base[i].test,
      features: Array.isArray(current.features) && current.features.length ? current.features.slice(0, 5) : base[i].features,
    };
  });

  return {
    packages: merged,
    // extraFastDelivery: !!formData?.extraFastDelivery,
    // additionalRevision: !!formData?.additionalRevision,
  };
}

const MAX_FAQS = 12;

const PRESET_FAQS = [
  { question: 'What is included in this service?', answer: 'You get X, Y, and Z deliverables, plus 1 revision within 7 days.' },
  { question: 'How long does delivery take?', answer: 'Standard delivery is 3 business days. Rush options are available.' },
  { question: 'What do you need from me to start?', answer: 'Please provide your brief, examples you like, and brand assets if any.' },
  { question: 'What if I am not satisfied?', answer: 'I offer revisions according to the plan you choose. I’ll work with you until the scope is met.' },
];

function Step3({ formData, setFormData, nextStep, prevStep }) {
  const t = useTranslations('CreateGig.step3');
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(getStep3Schema(t)),
    defaultValues: {
      faqs: formData.faqs || [],
    },
  });

  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTemp, setEditingTemp] = useState({ question: '', answer: '' });
  const [query, setQuery] = useState('');

  const faqs = watch('faqs') || [];

  const filteredFaqs = useMemo(() => (faqs || []).filter(f => (f?.question || '').toLowerCase().includes(query.toLowerCase()) || (f?.answer || '').toLowerCase().includes(query.toLowerCase())), [faqs, query]);


  const onSubmit = async data => {
    const isValid = await trigger();
    if (isValid) {
      setFormData({ ...formData, ...data });
      nextStep();
    }
  };

  const addFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    if (faqs.some(f => f.question.trim().toLowerCase() === newFaq.question.trim().toLowerCase())) return;
    if (faqs.length >= MAX_FAQS) return;

    setValue('faqs', [...faqs, { question: newFaq.question.trim(), answer: newFaq.answer.trim() }], {
      shouldValidate: true,
    });
    setNewFaq({ question: '', answer: '' });
  };

  const removeFaq = index => {
    setValue(
      'faqs',
      faqs.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
    if (editingIndex === index) setEditingIndex(null);
  };

  const startEdit = index => {
    setEditingIndex(index);
    setEditingTemp({ ...faqs[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingTemp({ question: '', answer: '' });
  };

  const saveEdit = index => {
    const tempQ = editingTemp.question?.trim();
    const tempA = editingTemp.answer?.trim();
    if (!tempQ || !tempA) return;
    if (faqs.some((f, i) => i !== index && f.question.trim().toLowerCase() === tempQ.toLowerCase())) return;

    const next = [...faqs];
    next[index] = { question: tempQ, answer: tempA };
    setValue('faqs', next, { shouldValidate: true });
    setEditingIndex(null);
    setEditingTemp({ question: '', answer: '' });
  };

  const moveFaq = (index, dir) => {
    const next = [...faqs];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;

    // Swap items
    [next[index], next[target]] = [next[target], next[index]];
    setValue('faqs', next, { shouldValidate: true });

    // If editing, update editingIndex to follow the moved item
    if (editingIndex === index) {
      setEditingIndex(target);
    } else if (editingIndex === target) {
      setEditingIndex(index);
    }
  };


  const addPreset = preset => {
    if (faqs.length >= MAX_FAQS) return;
    if (faqs.some(f => f.question.trim().toLowerCase() === preset.question.trim().toLowerCase())) return;
    setValue('faqs', [...faqs, preset], { shouldValidate: true });
  };
  // Flatten all possible messages (question + answer), skip nulls
  const firstFaqError = useMemo(() => {
    if (!errors?.faqs) return null;

    const messages = errors?.faqs?.flatMap(faq =>
      faq ? [faq.question?.message, faq.answer?.message] : []
    );

    return messages.find(Boolean) || null;
  }, [errors?.faqs]);
  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-6'>
      {/* FAQ Section */}
      <section className='rounded-xl border border-slate-200 bg-white/60 backdrop-blur-sm shadow-sm'>
        <div className='flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-2'>
            <h3 className='text-base font-semibold text-slate-900'>{t('faqs')}</h3>
            <span className='ml-2 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600'>
              {faqs.length}/{MAX_FAQS}
            </span>
          </div>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('searchPlaceholder')} className='w-56 rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-main-500/30' />
          </div>
        </div>

        {/* FAQ list */}
        <ul className='divide-y divide-slate-200'>
          {filteredFaqs.length === 0 ? (
            <li className='p-4 text-sm text-slate-500'>{t('noFaqs')}</li>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const realIndex = faqs.findIndex(f => f.question === faq.question && f.answer === faq.answer);
              const isEditing = editingIndex === realIndex;
              return (
                <li key={`${faq.question}-${realIndex}`} className='group p-4'>
                  <div className={`flex-1 flex items-start justify-between gap-3 ${isEditing ? "flex-col" : ""}`}>
                    <div className={`flex-1 ${isEditing ? "w-full" : "min-w-0"}`}>
                      {isEditing ?
                        <input value={editingTemp.question} onChange={e => setEditingTemp(s => ({ ...s, question: e.target.value }))} className='w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm' />
                        : <h4 className='truncate text-sm font-semibold text-slate-900'>{faq.question}</h4>}
                      <div className='mt-2'>{isEditing ?
                        <textarea value={editingTemp.answer} onChange={e => setEditingTemp(s => ({ ...s, answer: e.target.value }))} rows={3} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm' />
                        : <p className='text-sm text-slate-700'>{faq.answer}</p>}</div>
                    </div>

                    <div className="shrink-0 sm:w-32">
                      {isEditing ? (
                        <div className='flex items-center gap-1'>
                          <button type='button' onClick={() => saveEdit(realIndex)} className='rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-main-50'>
                            <Check className='h-4 w-4' />
                          </button>
                          <button type='button' onClick={cancelEdit} className='rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50'>
                            <X className='h-4 w-4' />
                          </button>
                        </div>
                      ) : (
                        <div className='flex flex-col sm:flex-row items-center gap-1'>
                          <button type='button' onClick={() => moveFaq(realIndex, -1)} className='rounded-lg border border-slate-200 p-1 hover:bg-slate-50'>
                            <ArrowUp className='h-4 w-4' />
                          </button>
                          <button type='button' onClick={() => moveFaq(realIndex, 1)} className='rounded-lg border border-slate-200 p-1 hover:bg-slate-50'>
                            <ArrowDown className='h-4 w-4' />
                          </button>
                          <button type='button' onClick={() => startEdit(realIndex)} className='rounded-lg border border-slate-200 p-1 hover:bg-slate-50'>
                            <Pencil className='h-4 w-4' />
                          </button>
                          <button type='button' onClick={() => removeFaq(realIndex)} className='rounded-lg border border-slate-200 p-1 hover:bg-rose-50'>
                            <Trash2 className='h-4 w-4 text-rose-600' />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {/* Add new + presets */}
        <div className='border-t border-slate-200 p-4'>
          <div className='mb-3 text-sm font-medium text-slate-700'>{t('addNewFaq')}</div>
          <div className='grid gap-3 md:grid-cols-2'>
            <input value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} placeholder={t('question')} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2' />
            <textarea value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} placeholder={t('answer')} rows={3} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2' />
          </div>
          <FormErrorMessage message={firstFaqError} />

          <div className='mt-3 flex flex-col sm :flex-row gap-4 items-center justify-between'>
            <div className='flex flex-wrap gap-2'>
              {PRESET_FAQS.map((p, i) => (
                <button key={i} type='button' onClick={() => addPreset(p)} className='rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50'>
                  + {p.question}
                </button>
              ))}
            </div>

            <Button name={t('addFaq')} disabled={!newFaq.question.trim() || !newFaq.answer.trim() || faqs.length >= MAX_FAQS} icon={<Plus className='h-4 w-4' />} onClick={addFaq} className='!w-fit !px-4' />
          </div>
        </div>
      </section>

      {/* Navigation Buttons */}
      <div className='flex justify-end gap-2 pt-2'>
        <Button type='button' name={t('back')} color='outline' onClick={prevStep} icon={<ChevronRight className='ltr:scale-x-[-1]' />} className='!w-fit !flex-row-reverse' />
        <Button name={t('continue')} onClick={handleSubmit(onSubmit)} className='!w-fit !px-4' />
      </div>
    </form>
  );
}

const MAX_QUES = 12;
function Step4({ formData, setFormData, nextStep, prevStep }) {
  const t = useTranslations('CreateGig.step4');
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(getStep4Schema(t)),
    defaultValues: {
      questions: formData?.questions || [],
    },
  });
  const multiInputRef = useRef()
  const questions = watch('questions') || [];

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    requirementType: 'text', // text | multiple_choice | file
    isRequired: false,
    options: [],
  });

  const onSubmit = async data => {
    if (questions.length >= MAX_QUES) return;

    const isValid = await trigger();
    if (isValid) {
      setFormData({ ...formData, ...data });
      nextStep();
    }
  };
  const addQuestion = () => {
    if (questions.length >= MAX_QUES) return;

    if (newQuestion.question) {
      const currentQuestions = watch('questions') || [];
      setValue('questions', [...currentQuestions, newQuestion], { shouldValidate: true });
      setNewQuestion({ question: '', requirementType: 'text', options: [] });
    }
  };

  const removeQuestion = index => {
    const currentQuestions = watch('questions') || [];
    setValue(
      'questions',
      currentQuestions.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  };

  const addOption = value => {
    const v = (value || '').trim();
    if (!v) return;

    setNewQuestion(q => {
      if (q.options.includes(v)) return q; // Skip if already exists
      return { ...q, options: [...q.options, v] };
    });
  };

  const removeOption = op => {
    setNewQuestion(q => ({ ...q, options: q.options.filter((val) => val !== op) }));
  };

  const firstQuesError = useMemo(() => {
    if (!errors?.questions) return null;

    const messages = errors.questions.flatMap(ques => {
      if (!ques) return [];

      const optionMessage = Array.isArray(ques.options)
        ? ques.options.find(opt => opt?.message)?.message
        : ques.options?.message;

      return [
        ques.question?.message,
        ques.requirementType?.message,
        optionMessage,
      ];
    });

    return messages.find(Boolean) || null;
  }, [errors?.questions]);


  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-8'>
      {/* Existing questions list */}
      <div className='rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-slate-100'>
          <div className='flex items-center gap-2'>
            <h3 className='text-base font-semibold text-slate-900'>{t('questions')}</h3>
            <span className='ml-2 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600'>
              {questions.length}/{MAX_QUES}
            </span>
          </div>
          <div className='text-xs text-slate-500'>{t('dragFree')}</div>
        </div>

        <div className='p-5 space-y-4'>
          {questions.length === 0 && (
            <div className='rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center'>
              <div className='mx-auto mb-2 h-10 w-10 rounded-full bg-white shadow-sm grid place-items-center'>
                <HelpCircle className='w-5 h-5 text-slate-500' />
              </div>
              <p className='text-slate-700 font-medium'>{t('noQuestions')}</p>
              <p className='text-sm text-slate-500'>{t('noQuestionsDesc')}</p>
            </div>
          )}

          {questions.map((q, index) => (
            <div key={index} className='group rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_0_rgba(0,0,0,0.03)] transition hover:shadow-md'>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <h4 className='font-medium text-slate-900 break-words'>{q.question}</h4>

                  <div className='mt-2 flex flex-wrap items-center gap-2 text-xs'>
                    <span className='inline-flex items-center gap-1 rounded-full border border-main-200 bg-main-50 px-2.5 py-1 text-main-700'>{q.requirementType?.replace('_', ' ') || 'text'}</span>
                    <span className={q.isRequired ? 'inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700' : 'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600'}>{q.isRequired ? t('required') : t('optional')}</span>
                  </div>

                  {q.requirementType === 'multiple_choice' && Array.isArray(q.options) && q.options.length > 0 && (
                    <div className='mt-3'>
                      <p className='text-xs font-medium text-slate-600 mb-1'>{t('options')}</p>
                      <div className='flex flex-wrap gap-2'>
                        {q.options.map((opt, i) => (
                          <span key={i} className='inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] text-slate-700'>
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button type='button' onClick={() => removeQuestion(index)} className='shrink-0 rounded-lg p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition' aria-label={`Remove question ${index + 1}`} title='Remove'>
                  <Trash2 className='w-5 h-5' />
                </button>
              </div>
            </div>
          ))}

          <FormErrorMessage message={firstQuesError} />

        </div>
      </div>

      {/* Add new question */}
      <div className='rounded-2xl border border-main-200 bg-white shadow-[0_1px_0_0_rgba(16,138,0,0.08)]'>
        <div className='px-5 py-4 border-b border-main-100 flex items-center justify-between'>
          <h4 className='font-semibold text-main-900'>{t('addNewQuestion')}</h4>
          <div className='text-xs text-main-700/70'>{t('textMultipleFile')}</div>
        </div>

        <div className='p-5'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='md:col-span-2'>
              <Input label={t('questionLabel')} placeholder={t('questionPlaceholder')} value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })} error={errors?.newQuestion?.question?.message} />
            </div>

            <div>
              <Select
                options={[
                  { id: 'text', name: t('textInput') },
                  { id: 'multiple_choice', name: t('multipleChoice') },
                  { id: 'file', name: t('fileUpload') },
                ]}
                value={newQuestion.requirementType}
                onChange={opt => setNewQuestion({ ...newQuestion, requirementType: opt.id })}
                label={t('type')}
                placeholder={t('selectType')}
                className='w-full'
              />
            </div>
          </div>

          <div className='mt-4 flex items-center gap-3'>
            <AnimatedCheckbox checked={newQuestion.isRequired} onChange={v => setNewQuestion({ ...newQuestion, isRequired: v })} />
            <label className='text-sm text-slate-700'>{t('required')}</label>
          </div>

          {newQuestion.requirementType === 'multiple_choice' && (
            <div className='mt-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4'>
              <label className='block text-sm font-medium text-slate-700 mb-2'>{t('optionsLabel')}</label>

              <div className='flex items-center gap-2'>
                <Input
                  placeholder={t('optionsPlaceholder')}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className='flex-1'
                  ref={multiInputRef}
                />
                <Button
                  type='button'
                  color='green'
                  icon={<Plus className='w-4 h-4' />}
                  onClick={() => {
                    const el = multiInputRef.current;
                    if (el && 'value' in el) {
                      addOption(el.value);
                      el.value = '';
                    }
                  }}
                  className='!px-4 !h-[40px] !w-fit '
                />
              </div>

              <div className='mt-3 flex flex-wrap gap-2'>
                {newQuestion.options.map((opt, i) => (
                  <span key={i} className='inline-flex items-center gap-1 rounded-full border border-main-200 bg-main-50 px-2.5 py-1 text-[12px] text-main-800'>
                    {opt}
                    <button type='button' onClick={() => removeOption(opt)} className='ml-1 rounded p-0.5 hover:bg-main-100' aria-label={`Remove option ${opt}`}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              {newQuestion.requirementType === 'multiple_choice' && newQuestion.options.length === 0 && <p className='mt-2 text-[13px] text-rose-600'>{t('atLeastOneOption')}</p>}
            </div>
          )}

          <div className='mt-6 flex justify-end'>
            <Button type='button' name={t('addQuestion')} color='green' disabled={!newQuestion.question || (newQuestion.requirementType === 'multiple_choice' && newQuestion.options.length < 1)} onClick={addQuestion} className='!w-fit !px-6 rounded-xl shadow-[0_6px_20px_-6px_rgba(16,138,0,0.45)] data-[disabled=true]:opacity-60' />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className='flex justify-end gap-2 pt-4'>
        <Button type='button' name={t('back')} color='outline' onClick={prevStep} icon={<ChevronRight className='ltr:scale-x-[-1]' />} className='!w-fit !flex-row-reverse' />
        <Button onClick={handleSubmit(onSubmit)} name={t('continue')} color='green' className='!w-fit !px-8 py-2 rounded-xl text-white bg-main-600 hover:bg-main-700 shadow-[0_8px_24px_-8px_rgba(16,138,0,0.55)]' />
      </div>
    </form>
  );
}

const getFirstFileError = (errors, type) => {
  if (!errors?.[type]) return null;

  // errors[type] can be an array of objects or a direct message
  const arr = errors[type];

  // If Yup put a message directly on the array (like max length)
  if (arr?.message) return arr.message;

  // Otherwise, loop through array items and find first message
  if (Array.isArray(arr)) {
    for (const item of arr) {
      if (!item) continue;

      // Check nested messages (like mimeType/size validation)
      const msg =
        item?.message ||
        item?.mimeType?.message ||
        item?.type?.message;
      if (msg) return msg;
    }
  }

  return null;
};


function Step5({ formData, setFormData, nextStep, prevStep }) {
  const t = useTranslations('CreateGig.step5');
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm({
    resolver: yupResolver(getStep5Schema(t)),
    defaultValues: {
      images: formData?.images || [],
      video: formData?.video || [],
      documents: formData?.documents || [],
    },
  });

  const onSubmit = async data => {

    const isValid = await trigger();
    if (isValid) {
      setFormData({ ...formData, ...data });
      nextStep();
    }
  };



  const handleFileSelection = (files, type) => {
    let limitedFiles = [];


    if (type === 'images') {
      limitedFiles = files.slice(0, 3);
    } else if (type === 'video') {
      limitedFiles = files.slice(0, 1);
    } else if (type === 'documents') {
      limitedFiles = files.slice(0, 2);
    }

    setValue(type, limitedFiles);

    setFormData(prev => ({
      ...prev,
      [type]: limitedFiles,
    }));
  };

  // 🔴 Remove file helper
  const removeFile = (type, index) => {
    const updated = [...formData[type]];
    updated.splice(index, 1);
    setValue(type, updated);
    setFormData(prev => ({
      ...prev,
      [type]: updated,
    }));
  };

  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-6'>
      <div>

        <LabelWithInput className=' items-center bg-gray-50 p-6 rounded-xl mb-6' title={t('images')} desc={t('imagesDesc')}>
          <div className='flex flex-wrap gap-3 justify-end'>
            {formData?.images?.map((e, i) => (
              <div className='relative  flex items-center justify-center flex-col bg-white max-sm:w-full w-[200px] shadow-inner border border-slate-200 p-2 px-6 gap-2 rounded-xl '>
                {(e?.mimeType || e?.type)?.startsWith('image') ? <img src={baseImg + e.url} className='w-full  aspect-square  ' /> : <div className=' mx-auto aspect-square w-[100px] flex items-center justify-center  rounded-md'>{getFileIcon(e?.mimeType || e?.type)}</div>}

                <h4 className=' text-base whitespace-nowrap truncate max-w-[100px]' title={e?.filename}>{e?.filename}</h4>
                <button
                  type="button"
                  onClick={() => removeFile("images", i)}
                  className="absolute top-2 right-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className=' overflow-hidden bg-white max-sm:w-full w-[200px] relative text-center shadow-inner border border-slate-200 rounded-xl p-2  '>
              <img src='/icons/uploadImage.png' alt='' className='w-[100px] h-[100px] mx-auto mb-2 ' />
              <div className=''><span className='text-[var(--color-main-600)] font-[500]'>{t('browseImages')}</span></div>
              <AttachFilesButton className={'scale-[10]  opacity-0 !absolute '} hiddenFiles={true} onChange={files => handleFileSelection(files, 'images')} maxSelection={3} />
            </div>
          </div>
        </LabelWithInput>
        <FormErrorMessage message={getFirstFileError(errors, 'images')} className="mt-4" />
      </div>

      <div>

        <LabelWithInput className=' items-center bg-gray-50 p-6 rounded-xl mb-6' title={t('video')} desc={t('videoDesc')}>
          <div className='flex flex-wrap gap-3 justify-end'>
            {formData?.video?.map((e, i) => (
              <div className='relative  flex items-center justify-center flex-col bg-white max-sm:w-full w-[200px] shadow-inner border border-slate-200 p-2 px-6 gap-2 rounded-xl '>
                {(e?.mimeType || e?.type)?.startsWith('image') ? <img src={baseImg + e.url} alt={e.filename} className='w-full  aspect-square  ' /> : <div className=' mx-auto aspect-square w-[100px] flex items-center justify-center  rounded-md'>{getFileIcon(e?.mimeType || e?.type)}</div>}

                <h4 className=' text-base whitespace-nowrap truncate max-w-[100px]' title={e?.filename}>{e.filename}</h4>
                <button
                  type="button"
                  onClick={() => removeFile("video", i)}
                  className="absolute top-2 right-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className=' overflow-hidden bg-white max-sm:w-full w-[200px] relative text-center shadow-inner border border-slate-200 rounded-xl p-2  '>
              <img src='/icons/uploadImage.png' alt='' className='w-[100px] h-[100px] mx-auto mb-2 ' />
              <div className=''><span className='text-[var(--color-main-600)] font-[500]'>{t('browseVideo')}</span></div>
              <AttachFilesButton className={'scale-[10]  opacity-0 !absolute '} hiddenFiles={true} onChange={files => handleFileSelection(files, 'video')} maxSelection={1} />
            </div>
          </div>
        </LabelWithInput>
        <FormErrorMessage message={getFirstFileError(errors, 'video')} className="mt-4" />
      </div>

      <div>
        <LabelWithInput className=' items-center bg-gray-50 p-6 rounded-xl mb-6' title={t('document')} desc={t('documentDesc')}>
          <div className='flex flex-wrap gap-3 justify-end'>
            {formData?.documents?.map((e, i) => (
              <div className='relative  flex items-center justify-center flex-col bg-white max-sm:w-full w-[200px] shadow-inner border border-slate-200 p-2 px-6 gap-2 rounded-xl '>
                {(e?.mimeType || e?.type)?.startsWith('image') ? <img src={baseImg + e.url} alt={e.filename} className='w-full  aspect-square  ' /> : <div className=' mx-auto aspect-square w-[100px] flex items-center justify-center  rounded-md'>{getFileIcon(e?.mimeType || e?.type)}</div>}

                <h4 className=' text-base whitespace-nowrap truncate max-w-[100px]  ' title={e?.filename} >{e.filename}</h4>
                <button
                  type="button"
                  onClick={() => removeFile("documents", i)}
                  className="absolute top-2 right-2 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className=' overflow-hidden bg-white max-sm:w-full w-[200px] relative text-center shadow-inner border border-slate-200 rounded-xl p-2  '>
              <img src='/icons/uploadImage.png' alt='' className='w-[100px] h-[100px] mx-auto mb-2 ' />
              <div className=''><span className='text-[var(--color-main-600)] font-[500]'>{t('browseDocuments')}</span></div>
              <AttachFilesButton className={'scale-[10]  opacity-0 !absolute '} hiddenFiles={true} onChange={files => handleFileSelection(files, 'documents')} maxSelection={2} />
            </div>
          </div>
        </LabelWithInput>
        <FormErrorMessage message={getFirstFileError(errors, 'documents')} className="mt-4" />
      </div>

      <div className='flex justify-end gap-2 pt-6'>
        <Button type='button' name={t('back')} color='outline' onClick={prevStep} icon={<ChevronRight className='ltr:scale-x-[-1]' />} className='!w-fit !flex-row-reverse' />
        <Button onClick={handleSubmit(onSubmit)} name={t('continue')} color='green' className='!w-fit !px-8 py-2 text-white bg-main-600 hover:bg-main-700 rounded-lg transition-colors' />
      </div>
    </form>
  );
}

function Step6({ formData, handleSubmit, prevStep, loading }) {
  const t = useTranslations('CreateGig.step6');
  const searchParams = useSearchParams();
  const gigSlug = searchParams.get('slug'); // check if gigSlug exists
  const locale = useLocale()
  const isArabic = locale === 'ar';
  const isUpdate = Boolean(gigSlug); // true if updating

  return (
    <div className='text-center space-y-8 py-8'>
      <div>
        <div className='w-[200px] h-fit bg-main-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <img src='/icons/congratlation.png' alt='' className='w-[300px]' />
        </div>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>{t('congratulations')}</h1>
        <p className='max-w-[900px] mb-2 mx-auto text-center text-gray-600'>{isUpdate ? t('almostDoneUpdate') : t('almostDoneCreate')}</p>
        {!isUpdate && (
          <>
            <p className='max-w-[900px] mb-2 mx-auto text-center text-gray-600'>{t('phoneVerification')}</p>
            <p className='max-w-[900px] mb-2 mx-auto text-center text-gray-600'>{t('phonePrivacy')}</p>
          </>
        )}
      </div>

      <div className='flex flex-col xs:flex-row justify-center gap-4 pt-4'>
        <Button type='button' icon={isArabic ? <ChevronRight className='ltr:scale-x-[-1]' /> : <ChevronLeft className='' />} name={t('backToEdit')} color='secondary' onClick={prevStep} className='!w-fit !flex-row-reverse !px-8 py-2 text-white bg-main-600 hover:bg-main-700 rounded-lg transition-colors max-xs:!w-full' />
        <Button type='button' name={isUpdate ? t('updateGig') : t('publishGig')} color='green' onClick={handleSubmit} loading={loading} disabled={loading} className='!w-fit !px-8 py-2 text-white bg-main-600 hover:bg-main-700 rounded-lg transition-colors max-xs:!w-full' />
      </div>
    </div>
  );
}

function SkeletonLoading() {
  const t = useTranslations('CreateGig.loading');
  return (
    <div className='flex flex-col items-center justify-center py-20 space-y-8 relative animate-pulse'>
      <div className='absolute w-full h-full inset-0 bg-gray-100 rounded-lg z-[-1]'></div>
      {/* Animated spinner with smooth green gradient */}
      <div className='relative'>
        <div className='w-16 h-16 border-6 border-main-200 rounded-full'></div>
        <div className='absolute top-0 left-0 w-16 h-16 border-4 border-main-600 border-t-transparent rounded-full animate-spin'></div>
      </div>

      {/* Loading text with smooth fading animation */}
      <div className='text-center space-y-4'>
        <p className='text-xl font-semibold text-main-800'>{t('loadingGigCreator')}</p>
        <p className='text-sm text-main-600 animate-pulse'>{t('gettingReady')}</p>
      </div>

      {/* Progress dots with a pulsating effect and subtle delay */}
      <div className='flex space-x-3'>
        <div className='w-3 h-3 bg-gradient-to-r from-main-400 to-main-500 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></div>
        <div className='w-3 h-3 bg-gradient-to-r from-main-500 to-main-600 rounded-full animate-bounce' style={{ animationDelay: '200ms' }}></div>
        <div className='w-3 h-3 bg-gradient-to-r from-main-600 to-main-700 rounded-full animate-bounce' style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
}

const LabelWithInput = ({ children, title, desc, className }) => {
  return (
    <div className={`flex flex-col md:flex-row ${className} gap-6`}>
      <div className="w-full md:max-w-[300px] shrink-0">
        <label className="text-[22px] font-semibold text-slate-900">{title}</label>
        {desc && <p className="text-sm text-slate-600 mt-1">{desc}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};

