'use client';

import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Pencil, ArrowUp, ArrowDown, Search, Eye, EyeOff, Info, Plus, Minus, Trash2, X, HelpCircle, Logs } from 'lucide-react';
import ProgressBar from '@/components/pages/gig/ProgressBar';
import InputList from '@/components/atoms/InputList';
import Textarea from '@/components/atoms/Textarea';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { Switcher } from '@/components/atoms/Switcher';
import AttachFilesButton, { getFileIcon } from '@/components/atoms/AttachFilesButton';
import { apiService } from '@/services/GigServices';
import { useEffect, useState, useMemo } from 'react';
import { AnimatedCheckbox } from '@/components/atoms/CheckboxAnimation';
import { baseImg } from '@/lib/axios';
import toast from 'react-hot-toast';
import { getUserInfo } from '@/hooks/useUser';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import CategorySelect from '@/components/atoms/CategorySelect';

export const useGigCreation = () => {
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
  }); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingServices, setLoadingServices] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const gigId = searchParams.get('gigId');
    const savedData = sessionStorage.getItem('gigCreationData');
    const savedStep = sessionStorage.getItem('gigCreationStep');
    if (savedStep) {
      setStep(parseInt(savedStep, 10));
    }
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.id === gigId) {
          setFormData(parsed);
          return;
        }
      } catch (err) {
        console.error('Error parsing saved session data', err);
      }
    }
    apiService.getService(gigId).then(res => {
      const newData = {
        id: res.id,
        category: res.category,
        subcategory: res.subcategory,
        tags: res.searchTags,
        title: res.title,
        brief: res.brief,
        packages: res.packages,
        extraFastDelivery: res.extraFastDelivery,
        additionalRevision: res.additionalRevision,
        faqs: res.faq,
        questions: res.requirements,
        images: res.gallery?.filter(e => e.type === 'image'),
        video: res.gallery?.filter(e => e.type === 'video'),
        documents: res.gallery?.filter(e => e.type === 'document'),
      };

      setFormData(newData);
      sessionStorage.setItem('gigCreationData', JSON.stringify(newData));
    });
  }, [searchParams]);

  useEffect(() => {
    const gigId = searchParams.get('gigId');
    if (!gigId) {
      loadSavedData();
    }
  }, []);

  const loadSavedData = () => {
    if (typeof window === 'undefined') return;

    const savedData = sessionStorage.getItem('gigCreationData');
    const savedStep = sessionStorage.getItem('gigCreationStep');

    if (savedData) setFormData(JSON.parse(savedData));
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
    const gigId = searchParams.get('gigId');

    try {
      setLoadingServices(true);
			console.log("here");

      const serviceData = {
        title: formData.packages[0]?.title,
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
        fastDelivery: formData.extraFastDelivery,
        additionalRevision: formData.additionalRevision,
      };

      console.log(serviceData);

      if (gigId) {
        await apiService.updateService(gigId, serviceData);
        toast.success('Service updated successfully');
      } else {
        await apiService.createService(serviceData);
        toast.success('Service created successfully');
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gigCreationData');
        sessionStorage.removeItem('gigCreationStep');
      }
      setTimeout(() => {
        router.push('/my-gigs');
      }, 500);
    } catch (error) {
      toast.error('Failed to create gig. Please try again.');
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
const step1Schema = yup.object({
  title: yup.string().required('Gig title is required').max(100, "Gig title can't exceed 100 characters"),
  brief: yup.string().required('Gig brief is required').max(500, "Gig brief can't exceed 500 characters"),
  category: yup.object().required('Category is required'),
  subcategory: yup.object().nullable().required('Subcategory is required'),
  tags: yup.array().min(1, 'At least one tag is required').max(5, 'Maximum 5 tags allowed').of(yup.string().required('Tag is required')),
});

const step2Schema = yup.object({
  packages: yup
    .array()
    .of(
      yup.object({
        type: yup.string().oneOf(['basic', 'standard', 'premium']).required(),
        title: yup.string().required('Package title is required').max(60, 'Max 60 characters'),
        description: yup.string().required('Package description is required').max(220, 'Max 220 characters'),
        deliveryTime: yup.number().typeError('Delivery time is required').required().min(1, 'Min 1 day'),
        revisions: yup.number().typeError('Revisions is required').required().min(0, 'Cannot be negative').max(20, 'Be realistic'),
        price: yup.number().typeError('Price is required').required().min(0, 'Price cannot be negative').max(100000, 'Too high'),
        test: yup.boolean().required('Test field is required'),
        features: yup.array().of(yup.string().trim().required('Feature is required')).min(3, 'At least 3 features').max(5, 'At most 5 features'),
      }),
    )
    .min(1, 'At least one package is required'),
  extraFastDelivery: yup.boolean(),
  additionalRevision: yup.boolean(),
});

const step3Schema = yup.object({
  faqs: yup.array().of(
    yup.object({
      question: yup.string().required('Question is required'),
      answer: yup.string().required('Answer is required'),
    }),
  ),
});

const step4Schema = yup.object({
  questions: yup.array().of(
    yup.object({
      question: yup.string().required('Question is required'),
      requirementType: yup.string().oneOf(['text', 'multiple_choice', 'file']).required('Question type is required'),
      isRequired: yup.boolean().default(false),
      options: yup.array().when('requirementType', {
        is: 'multiple_choice',
        then: schema => schema.min(1, 'At least one option is required for multiple choice'),
        otherwise: schema => schema.optional(),
      }),
    }),
  ),
});

const step5Schema = yup.object({
  images: yup.array(),
  video: yup.array().max(1, 'Only one video allowed'),
  documents: yup.array().max(2, 'Maximum 2 documents allowed'),
});

export default function GigCreationWizard() {
  const { step, formData, loadingServices, setFormData, loading, error, nextStep, prevStep, handleSubmit } = useGigCreation();

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

  return (
    <div className='container !mt-8 !mb-12'>
      <div className='mx-auto max-w-[1200px] w-full'>
        {/* Progress Header */}
        <ProgressBar step={step} />

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
    resolver: yupResolver(step1Schema),
    defaultValues: {
      title: formData.title || '',
      brief: formData.brief || '',
      category: formData.category || null,
      subcategory: formData.subcategory || null,
      tags: formData.tags || [],
    },
  });

  // reinitialize when formData changes
  useEffect(() => {
    reset({
      title: formData.title || '',
      brief: formData.brief || '',
      category: formData.category || null,
      subcategory: formData.subcategory || null,
      tags: formData.tags || [],
    });
  }, [formData, reset]);

  const titleVal = watch('title') || '';
  const briefVal = watch('brief') || '';

  const onSubmit = async data => {
    const isValid = await trigger();
    if (!isValid) return;
    setFormData({ ...formData, ...data });
    nextStep();
  };

  const handleInputListChange = value => {
    const merged = [...(formData?.tags || []), ...(value || [])];
    setValue('tags', merged);
    setFormData({ ...formData, tags: merged });
  };

  const handleCategoryChange = value => {
    setValue('category', value);
    setFormData({ ...formData, category: value, subcategory: null }); // clear sub when main changes
  };

  const handleSubcategoryChange = value => {
    setValue('subcategory', value);
    setFormData({ ...formData, subcategory: value });
  };

  const handleRemoveInputList = index => {
    setFormData(prev => {
      const updatedTags = (prev.tags || []).filter((_, i) => i !== index);
      setValue('tags', updatedTags);
      return { ...prev, tags: updatedTags };
    });
  };

  return (
    <form onSubmit={e => e.preventDefault()} className='rounded-2xl border border-slate-200 bg-white/60 p-6 md:p-10'>
      {/* Header */}
      <div className='mb-8 flex items-start justify-between gap-6'>
        <div>
          <h2 className='text-2xl font-semibold text-slate-900'>Basic Details</h2>
          <p className='mt-1 text-sm text-slate-500'>Set a compelling foundation for your gig.</p>
        </div>
        <div className='hidden md:block rounded-xl bg-slate-50 px-4 py-2 text-xs text-slate-600'>Step 1 of 3</div>
      </div>

      <div className='mx-auto max-w-5xl space-y-8'>
        {/* Gig Title */}
        <Field title='Gig title' desc='Clear, searchable, and specific. Include your main keyword.' required error={errors?.title?.message} hint={`${titleVal.length}/80`}>
          <Textarea placeholder='e.g., I will design a responsive landing page in Next.js' {...register('title')} rows={2} className='resize-none' maxLength={80} />
        </Field>

        {/* Gig Brief */}
        <Field className='pt-8 border-t border-slate-200' title='Gig brief' desc='Short value proposition. What problem do you solve and how?' required error={errors?.brief?.message} hint={`${briefVal.length}/300`}>
          <Textarea placeholder='Briefly describe the outcome, approach, and what sets you apart.' {...register('brief')} rows={4} className='resize-y' maxLength={300} />
        </Field>

        {/* Category / Subcategory */}
        <Field className='pt-8 border-t border-slate-200' title='Category' desc='Pick the most accurate category and subcategory.' required error={errors?.category?.message || errors?.subcategory?.message}>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='mb-4'>
              <Controller name='categoryId' control={control} render={({ field }) => <CategorySelect type='category' label='Category' value={formData.category?.id} onChange={handleCategoryChange} error={errors?.category?.message} placeholder='Select a category' />} />
            </div>

            <div className='mb-4'>
              <Controller name='subcategoryId' control={control} render={({ field }) => <CategorySelect type='subcategory' parentId={watch('category')?.id} label='SubCategory' value={formData.subcategory?.id} onChange={handleSubcategoryChange} error={errors?.subcategory?.message} placeholder={watch('category') ? 'Select a subcategory' : 'Select a category first'} />} />
            </div>

            {/* <Select label='Category' options={categories} value={formData.category?.id} onChange={handleCategoryChange} error={errors?.category?.message} required />
            <Select label='Subcategory'  value={formData.subcategory?.id} onChange={handleSubcategoryChange} error={errors?.subcategory?.message} disabled={!watch('category')} /> */}
          </div>
        </Field>

        {/* Tags */}
        <Field className='pt-8 border-t border-slate-200' title='Search tags' desc='Use up to 5 tags that buyers would actually search.' error={errors?.tags?.message} hint='Letters and numbers only.'>
          <div>
            <InputList onChange={handleInputListChange} onRemoveItemHandler={handleRemoveInputList} label='Enter tags' value={formData.tags} setValue={setValue} getValues={getValues} fieldName='tags' placeholder='Add a tag and press Enter' errors={errors} validationMessage={errors?.tags?.message} maxItems={5} />
            <div className='mt-2 flex items-center justify-between text-xs text-slate-500'>
              <span>Max 5 tags.</span>
              <span>{(formData.tags || []).length}/5</span>
            </div>
          </div>
        </Field>
      </div>

      {/* Footer */}
      <div className='mt-10 flex justify-end'>
        <Button onClick={handleSubmit(onSubmit)} name='Continue' color='green' className='!w-fit !px-8' />
      </div>
    </form>
  );
}

const LABELS = ['Basic', 'Standard', 'Premium'];
const TYPES = ['basic', 'standard', 'premium'];
function Step2({ formData, setFormData, nextStep, prevStep }) {
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
    resolver: yupResolver(step2Schema),
    mode: 'onChange',
    defaultValues: normalizeDefaults(formData),
  });

  // Field arrays for features per package
  const fa0 = useFieldArray({ control, name: 'packages.0.features' });
  const fa1 = useFieldArray({ control, name: 'packages.1.features' });
  const fa2 = useFieldArray({ control, name: 'packages.2.features' });
  const fieldArrays = [fa0, fa1, fa2];

  const values = watch();

  // keep outer wizard state in sync
  useEffect(() => {
    setFormData(prev => ({ ...prev, ...values }));
  }, [values, setFormData]);

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
          <div className='px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500'>Field</div>
          {LABELS.map((label, idx) => (
            <div key={label} className='border-l border-l-slate-200 px-4 py-4'>
              <div className='flex items-center justify-between'>
                <span className='text-base font-semibold text-slate-900'>{label}</span>
                {/* Show per-column summary error indicator */}
                {pkgErrors?.[idx] && <span className='rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700'>Check errors</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className='grid grid-cols-1 sm:grid-cols-4'>
          {/* Title */}
          <FieldLabel>Title</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`title-${i}`}>
              <Input placeholder='e.g., Basic Logo' {...register(`packages.${i}.title`)} error={pkgErrors?.[i]?.title?.message} />
            </Cell>
          ))}

          {/* Description */}
          <FieldLabel>Description</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`desc-${i}`}>
              <Textarea rows={3} placeholder='Short description (what’s included?)' {...register(`packages.${i}.description`)} error={pkgErrors?.[i]?.description?.message} />
            </Cell>
          ))}

          {/* Delivery Time */}
          <FieldLabel>Delivery Time (days)</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`delivery-${i}`}>
              <Input type='number' min={1} step={1} placeholder='3' {...register(`packages.${i}.deliveryTime`, { valueAsNumber: true })} error={pkgErrors?.[i]?.deliveryTime?.message} />
            </Cell>
          ))}

          {/* Revisions */}
          <FieldLabel>Revisions</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`revisions-${i}`}>
              <Input type='number' min={0} step={1} placeholder='1' {...register(`packages.${i}.revisions`, { valueAsNumber: true })} error={pkgErrors?.[i]?.revisions?.message} />
            </Cell>
          ))}

          {/* Price */}
          <FieldLabel>Price ($)</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`price-${i}`}>
              <Input type='number' min={0} step={1} placeholder='50' {...register(`packages.${i}.price`, { valueAsNumber: true })} error={pkgErrors?.[i]?.price?.message} />
            </Cell>
          ))}

          {/* Test (boolean) */}
          <FieldLabel>Test (flag)</FieldLabel>
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
          ))}

          {/* Features editor */}
          <FieldLabel>Features (3–5)</FieldLabel>
          {TYPES.map((_, i) => (
            <Cell key={`features-${i}`}>
              <FeaturesEditor idx={i} fieldArray={fieldArrays[i]} register={register} errors={pkgErrors?.[i]?.features} />
            </Cell>
          ))}
        </div>
      </div>

      {/* Extra Services */}
      <div className='rounded-xl bg-slate-50 p-6'>
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
      </div>

      {/* Footer actions */}
      <div className='flex justify-end gap-2 pt-4'>
        <Button type='button' name='Back' color='outline' onClick={prevStep} icon={<ChevronLeft className='ltr:scale-x-[-1]' />} className='!w-fit' />
        <Button type='button' onClick={handleSubmit(onSubmit)} name='Continue' color='green' className='!w-fit !px-8' />
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
  const { fields, append, remove } = fieldArray;

  const canAdd = fields.length < 5;
  const canRemove = fields.length > 1;

  return (
    <div>
      <div className='space-y-2'>
        {fields.map((f, i) => (
          <div key={f.id} className=' relative flex items-start gap-2'>
            <Input placeholder={`Feature ${i + 1}`} {...register(`packages.${idx}.features.${i}`)} error={errors?.[i]?.message} className='flex-1  ' onAction={() => remove(i)} actionIcon={'/icons/minus.svg'} />
            {/* <Button className=" absolute top-1/2 rtl:left-2 ltr:right-2 -translate-y-1/2 !w-fit !px-2 " color='outline'  disabled={!canRemove} onClick={() => remove(i)} icon={<Minus className='h-4 !w-4' />}  aria-label='Remove feature'   /> */}
          </div>
        ))}
      </div>

      <div className='mt-2 flex-col flex gap-2 '>
        {typeof errors?.message === 'string' && <span className='ml-2 text-xs text-rose-600'>{errors?.message}</span>}
        <Button type='button' color='outline' disabled={!canAdd} onClick={() => append('')} icon={<Plus className='h-4 w-4' />} name='Add feature' className='!w-fit' />
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
      features: ['1 Concept', '1 Revision', 'PNG/JPG format'],
    },
    {
      type: 'standard',
      title: 'Standard Logo Pack',
      description: 'Multiple options with vector files and color variations.',
      deliveryTime: 5,
      revisions: 3,
      price: 120,
      test: false,
      features: ['3 Concepts', '3 Revisions', 'Vector Files Included'],
    },
    {
      type: 'premium',
      title: 'Premium Brand Identity',
      description: 'Complete identity with guide and social kit.',
      deliveryTime: 7,
      revisions: 10,
      price: 250,
      test: false,
      features: ['5 Concepts', 'Unlimited Revisions', 'Brand Guide'],
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
    extraFastDelivery: !!formData?.extraFastDelivery,
    additionalRevision: !!formData?.additionalRevision,
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
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(step3Schema),
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
    [next[index], next[target]] = [next[target], next[index]];
    setValue('faqs', next, { shouldValidate: true });
  };

  const addPreset = preset => {
    if (faqs.length >= MAX_FAQS) return;
    if (faqs.some(f => f.question.trim().toLowerCase() === preset.question.trim().toLowerCase())) return;
    setValue('faqs', [...faqs, preset], { shouldValidate: true });
  };

  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-6'>
      {/* FAQ Section */}
      <section className='rounded-xl border border-slate-200 bg-white/60 backdrop-blur-sm shadow-sm'>
        <div className='flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-2'>
            <h3 className='text-base font-semibold text-slate-900'>FAQs</h3>
            <span className='ml-2 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600'>
              {faqs.length}/{MAX_FAQS}
            </span>
          </div>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder='Search FAQs…' className='w-56 rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30' />
          </div>
        </div>

        {/* FAQ list */}
        <ul className='divide-y divide-slate-200'>
          {filteredFaqs.length === 0 ? (
            <li className='p-4 text-sm text-slate-500'>No FAQs yet. Add one below or pick from presets.</li>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const realIndex = faqs.findIndex(f => f.question === faq.question && f.answer === faq.answer);
              const isEditing = editingIndex === realIndex;
              return (
                <li key={`${faq.question}-${realIndex}`} className='group p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      {isEditing ? <input value={editingTemp.question} onChange={e => setEditingTemp(s => ({ ...s, question: e.target.value }))} className='w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm' /> : <h4 className='truncate text-sm font-semibold text-slate-900'>{faq.question}</h4>}
                      <div className='mt-2'>{isEditing ? <textarea value={editingTemp.answer} onChange={e => setEditingTemp(s => ({ ...s, answer: e.target.value }))} rows={3} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm' /> : <p className='text-sm text-slate-700'>{faq.answer}</p>}</div>
                    </div>

                    <div className='shrink-0'>
                      {isEditing ? (
                        <div className='flex items-center gap-1'>
                          <button type='button' onClick={() => saveEdit(realIndex)} className='rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-emerald-50'>
                            <Check className='h-4 w-4' />
                          </button>
                          <button type='button' onClick={cancelEdit} className='rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50'>
                            <X className='h-4 w-4' />
                          </button>
                        </div>
                      ) : (
                        <div className='invisible flex items-center gap-1 group-hover:visible'>
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
          <div className='mb-3 text-sm font-medium text-slate-700'>Add New FAQ</div>
          <div className='grid gap-3 md:grid-cols-2'>
            <input value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} placeholder='Question' className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm' />
            <textarea value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} placeholder='Answer' rows={3} className='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2' />
          </div>

          <div className='mt-3 flex items-center justify-between'>
            <div className='flex flex-wrap gap-2'>
              {PRESET_FAQS.map((p, i) => (
                <button key={i} type='button' onClick={() => addPreset(p)} className='rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50'>
                  + {p.question}
                </button>
              ))}
            </div>

            <Button name={'Add FAQ'} disabled={!newFaq.question.trim() || !newFaq.answer.trim() || faqs.length >= MAX_FAQS} icon={<Plus className='h-4 w-4' />} onClick={addFaq} className='!w-fit !px-4' />
          </div>
        </div>
      </section>

      {/* Navigation Buttons */}
      <div className='flex justify-end gap-2 pt-2'>
        <Button name={'Back'} onClick={prevStep} className='!w-fit !px-4' color='outline' icon={<ChevronLeft className='h-4 w-4 ltr:scale-x-[-1]  ' />} />
        <Button name={'Continue'} onClick={handleSubmit(onSubmit)} className='!w-fit !px-4' />
      </div>
    </form>
  );
}

function Step4({ formData, setFormData, nextStep, prevStep }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(step4Schema),
    defaultValues: {
      questions: formData?.questions || [],
    },
  });

  const questions = watch('questions') || [];

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    requirementType: 'text', // text | multiple_choice | file
    isRequired: false,
    options: [],
  });

  const onSubmit = async data => {
    const isValid = await trigger();
    if (isValid) {
      setFormData({ ...formData, ...data });
      nextStep();
    }
  };
  const addQuestion = () => {
    if (newQuestion.question) {
      const currentQuestions = watch('questions') || [];
      setValue('questions', [...currentQuestions, newQuestion], { shouldValidate: true });
      setNewQuestion({ question: '', type: 'multiple_choice', options: [] });
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
    setNewQuestion(q => ({ ...q, options: [...q.options, v] }));
  };

  const removeOption = i => {
    setNewQuestion(q => ({ ...q, options: q.options.filter((_, idx) => idx !== i) }));
  };

  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-8'>
      {/* Existing questions list */}
      <div className='rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-slate-100'>
          <div className='flex items-center gap-2'>
            <div className='inline-flex h-8 items-center rounded-full bg-emerald-50 px-3 text-sm font-medium text-emerald-700 border border-emerald-100'>
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </div>
            {errors?.questions && <span className='text-[13px] text-red-600'>{errors.questions.message}</span>}
          </div>
          <div className='text-xs text-slate-500'>Drag-free • Minimal • Clean</div>
        </div>

        <div className='p-5 space-y-4'>
          {questions.length === 0 && (
            <div className='rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center'>
              <div className='mx-auto mb-2 h-10 w-10 rounded-full bg-white shadow-sm grid place-items-center'>
                <HelpCircle className='w-5 h-5 text-slate-500' />
              </div>
              <p className='text-slate-700 font-medium'>No questions yet</p>
              <p className='text-sm text-slate-500'>Start by adding a question below — text, multiple choice, or file upload.</p>
            </div>
          )}

          {questions.map((q, index) => (
            <div key={index} className='group rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_0_0_rgba(0,0,0,0.03)] transition hover:shadow-md'>
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <h4 className='font-medium text-slate-900 break-words'>{q.question}</h4>

                  <div className='mt-2 flex flex-wrap items-center gap-2 text-xs'>
                    <span className='inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700'>{q.requirementType?.replace('_', ' ') || 'text'}</span>
                    <span className={q.isRequired ? 'inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700' : 'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600'}>{q.isRequired ? 'Required' : 'Optional'}</span>
                  </div>

                  {q.requirementType === 'multiple_choice' && Array.isArray(q.options) && q.options.length > 0 && (
                    <div className='mt-3'>
                      <p className='text-xs font-medium text-slate-600 mb-1'>Options</p>
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
        </div>
      </div>

      {/* Add new question */}
      <div className='rounded-2xl border border-emerald-200 bg-white shadow-[0_1px_0_0_rgba(16,138,0,0.08)]'>
        <div className='px-5 py-4 border-b border-emerald-100 flex items-center justify-between'>
          <h4 className='font-semibold text-emerald-900'>Add New Question</h4>
          <div className='text-xs text-emerald-700/70'>Text • Multiple Choice • File</div>
        </div>

        <div className='p-5'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='md:col-span-2'>
              <Input label='Question' placeholder='write a question' value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })} error={errors?.newQuestion?.question?.message} />
            </div>

            <div>
              <Select
                options={[
                  { id: 'text', name: 'Text Input' },
                  { id: 'multiple_choice', name: 'Multiple Choice' },
                  { id: 'file', name: 'File Upload' },
                ]}
                value={newQuestion.requirementType}
                onChange={opt => setNewQuestion({ ...newQuestion, requirementType: opt.id })}
                label='Type'
                placeholder='Select type'
                className='w-full'
              />
            </div>
          </div>

          <div className='mt-4 flex items-center gap-3'>
            <AnimatedCheckbox checked={newQuestion.isRequired} onChange={v => setNewQuestion({ ...newQuestion, isRequired: v })} />
            <label className='text-sm text-slate-700'>Required</label>
          </div>

          {newQuestion.requirementType === 'multiple_choice' && (
            <div className='mt-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4'>
              <label className='block text-sm font-medium text-slate-700 mb-2'>Options</label>

              <div className='flex items-center gap-2'>
                <Input
                  placeholder='Type an option and press Add'
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className='flex-1'
                />
                <Button
                  type='button'
                  color='green'
                  icon={<Plus className='w-4 h-4' />}
                  onClick={() => {
                    const el = document.activeElement;
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
                  <span key={i} className='inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] text-emerald-800'>
                    {opt}
                    <button type='button' onClick={() => removeOption(i)} className='ml-1 rounded p-0.5 hover:bg-emerald-100' aria-label={`Remove option ${opt}`}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              {newQuestion.requirementType === 'multiple_choice' && newQuestion.options.length === 0 && <p className='mt-2 text-[13px] text-rose-600'> At least one option is required for multiple choice</p>}
            </div>
          )}

          <div className='mt-6 flex justify-end'>
            <Button type='button' name='Add Question' color='green' disabled={!newQuestion.question || (newQuestion.requirementType === 'multiple_choice' && newQuestion.options.length < 1)} onClick={addQuestion} className='!w-fit !px-6 rounded-xl shadow-[0_6px_20px_-6px_rgba(16,138,0,0.45)] data-[disabled=true]:opacity-60' />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className='flex justify-end gap-2 pt-4'>
        <Button icon={<ChevronLeft />} type='button' name='Back' color='outline' onClick={prevStep} className='!w-fit !px-6 py-2 rounded-xl border-2 border-slate-200 text-slate-700 hover:bg-slate-100' />
        <Button onClick={handleSubmit(onSubmit)} name='Continue' color='green' className='!w-fit !px-8 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-[0_8px_24px_-8px_rgba(16,138,0,0.55)]' />
      </div>
    </form>
  );
}

function Step5({ formData, setFormData, nextStep, prevStep }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm({
    resolver: yupResolver(step5Schema),
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

  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-6'>
      <LabelWithInput className=' items-center bg-gray-50 p-6 rounded-xl mb-6' title={'Images (up to 3)'} desc={'Get noticed by the right buyers with visual examples of your services.'}>
        <div className='flex flex-wrap gap-3'>
          {formData?.images?.map((e, i) => (
            <div className='  flex items-center justify-center flex-col w-[200px] shadow-inner border border-slate-200 p-2 px-6 gap-2 rounded-xl '>
              {(e?.mimeType || e?.type)?.startsWith('image') ? <img src={baseImg + e.url} className='w-full  aspect-square  ' /> : <div className=' mx-auto aspect-square w-[100px] flex items-center justify-center  rounded-md'>{getFileIcon(e?.mimeType || e?.type)}</div>}

              <h4 className=' text-base whitespace-nowrap truncate max-w-[100px]  '>{e?.filename}</h4>
            </div>
          ))}
          <div className=' overflow-hidden w-[200px] relative text-center shadow-inner border border-slate-200 rounded-xl p-2  '>
            <img src='/icons/uploadImage.png' alt='' className='w-[100px] h-[100px] mx-auto mb-2 ' />
            Drag & drop a Photo or <div className='text-[#108A00] font-[500] '> Browse</div>
            <AttachFilesButton className={'scale-[10]  opacity-0 !absolute '} hiddenFiles={true} onChange={files => handleFileSelection(files, 'images')} />
          </div>
        </div>
      </LabelWithInput>

      <LabelWithInput className=' items-center bg-gray-50 p-6 rounded-xl mb-6' title={'Video (One Only)'} desc={'Get noticed by the right buyers with visual examples of your services.'}>
        <div className='flex flex-wrap gap-3'>
          {formData?.video?.map((e, i) => (
            <div className='  flex items-center justify-center flex-col w-[200px] shadow-inner border border-slate-200 p-2 px-6 gap-2 rounded-xl '>
              {(e?.mimeType || e?.type)?.startsWith('image') ? <img src={baseImg + e.url} alt={e.filename} className='w-full  aspect-square  ' /> : <div className=' mx-auto aspect-square w-[100px] flex items-center justify-center  rounded-md'>{getFileIcon(e?.mimeType || e?.type)}</div>}

              <h4 className=' text-base whitespace-nowrap truncate max-w-[100px]  '>{e.filename}</h4>
            </div>
          ))}
          <div className=' overflow-hidden w-[200px] relative text-center shadow-inner border border-slate-200 rounded-xl p-2  '>
            <img src='/icons/uploadImage.png' alt='' className='w-[100px] h-[100px] mx-auto mb-2 ' />
            Drag & drop a video or <div className='text-[#108A00] font-[500] '> Browse</div>
            <AttachFilesButton className={'scale-[10]  opacity-0 !absolute '} hiddenFiles={true} onChange={files => handleFileSelection(files, 'video')} />
          </div>
        </div>
      </LabelWithInput>

      <LabelWithInput className=' items-center bg-gray-50 p-6 rounded-xl mb-6' title={'Document (up to 2)'} desc={'Get noticed by the right buyers with visual examples of your services.'}>
        <div className='flex flex-wrap gap-3'>
          {formData?.documents?.map((e, i) => (
            <div className='  flex items-center justify-center flex-col w-[200px] shadow-inner border border-slate-200 p-2 px-6 gap-2 rounded-xl '>
              {(e?.mimeType || e?.type)?.startsWith('image') ? <img src={baseImg + e.url} alt={e.filename} className='w-full  aspect-square  ' /> : <div className=' mx-auto aspect-square w-[100px] flex items-center justify-center  rounded-md'>{getFileIcon(e?.mimeType || e?.type)}</div>}

              <h4 className=' text-base whitespace-nowrap truncate max-w-[100px]  '>{e.filename}</h4>
            </div>
          ))}
          <div className=' overflow-hidden w-[200px] relative text-center shadow-inner border border-slate-200 rounded-xl p-2  '>
            <img src='/icons/uploadImage.png' alt='' className='w-[100px] h-[100px] mx-auto mb-2 ' />
            Drag & drop a documents or <div className='text-[#108A00] font-[500] '> Browse</div>
            <AttachFilesButton className={'scale-[10]  opacity-0 !absolute '} hiddenFiles={true} onChange={files => handleFileSelection(files, 'documents')} />
          </div>
        </div>
      </LabelWithInput>

      <div className='flex justify-end gap-2 pt-6'>
        <Button icon={<ChevronLeft />} type='button' name='Back' color='secondary' onClick={prevStep} className='!w-fit !px-6 py-2 text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-colors' />
        <Button onClick={handleSubmit(onSubmit)} name='Continue' color='green' className='!w-fit !px-8 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors' />
      </div>
    </form>
  );
}

function Step6({ formData, handleSubmit, prevStep, loading }) {
  const searchParams = useSearchParams();
  const gigId = searchParams.get('gigId'); // check if gigId exists

  const isUpdate = Boolean(gigId); // true if updating

  return (
    <div className='text-center space-y-8 py-8'>
      <div>
        <div className='w-[200px] h-fit bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <img src='/icons/congratlation.png' alt='' className='w-[300px]' />
        </div>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Congratulations!</h1>
        <p className='max-w-[900px] mb-2 mx-auto text-center text-gray-600'>{isUpdate ? "You're almost done updating your Gig." : 'You’re almost done with your first Gig.'}</p>
        {!isUpdate && (
          <>
            <p className='max-w-[900px] mb-2 mx-auto text-center text-gray-600'>Before you start selling on UpPhoto, there is one last thing we need you to do: The security of your account is important to us. Therefore, we require all our sellers to verify their phone number before we can publish their first Gig.</p>
            <p className='max-w-[900px] mb-2 mx-auto text-center text-gray-600'>Your phone number remains private and is not used for marketing purposes. See more in our Privacy Policy.</p>
          </>
        )}
      </div>

      <div className='flex flex-col sm:flex-row justify-center gap-4 pt-4'>
        <Button type='button' icon={<ChevronLeft />} name='Back to Edit' color='secondary' onClick={prevStep} className='!w-fit !px-8 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors' />
        <Button type='button' name={isUpdate ? 'Update Gig' : 'Publish Gig'} color='green' onClick={handleSubmit} loading={loading} disabled={loading} className='!w-fit !px-8 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors' />
      </div>
    </div>
  );
}

function SkeletonLoading() {
  return (
    <div className='flex flex-col items-center justify-center py-20 space-y-8 relative animate-pulse'>
      <div className='absolute w-full h-full inset-0 bg-gray-100 rounded-lg z-[-1]'></div>
      {/* Animated spinner with smooth green gradient */}
      <div className='relative'>
        <div className='w-16 h-16 border-6 border-green-200 rounded-full'></div>
        <div className='absolute top-0 left-0 w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin'></div>
      </div>

      {/* Loading text with smooth fading animation */}
      <div className='text-center space-y-4'>
        <p className='text-xl font-semibold text-green-800'>Loading your gig creator</p>
        <p className='text-sm text-green-600 animate-pulse'>Getting everything ready for you...</p>
      </div>

      {/* Progress dots with a pulsating effect and subtle delay */}
      <div className='flex space-x-3'>
        <div className='w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></div>
        <div className='w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-bounce' style={{ animationDelay: '200ms' }}></div>
        <div className='w-3 h-3 bg-gradient-to-r from-green-600 to-green-700 rounded-full animate-bounce' style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
}

const LabelWithInput = ({ children, title, desc, className }) => {
  return (
    <div className={`flex ${className} gap-4`}>
      <div className='max-w-[300px] w-full shrink-0 '>
        <label className='text-[22px] font-[600] '>{title}</label>
        {desc && <p className='text-sm font-[400] '>{desc}</p>}
      </div>
      {children}
    </div>
  );
};
