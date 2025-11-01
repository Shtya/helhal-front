'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import BecomeFreelancer from '@/components/pages/shareJobDescription/BecomeFreelancer';
import Textarea from '@/components/atoms/Textarea';
import AttachFilesButton from '@/components/atoms/AttachFilesButton';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import { Switcher } from '@/components/atoms/Switcher';
import { Pencil, Paperclip } from 'lucide-react';
import HeaderCategoriesSwiper from '@/components/molecules/HeaderCategoriesSwiper';
import { createJob, updateJob } from '@/services/jobService';
import { toast } from 'react-hot-toast';
import InputList from '@/components/atoms/InputList';
import AttachmentList from '@/components/common/AttachmentList';
import CategorySelect from '@/components/atoms/CategorySelect';
import FormErrorMessage from '@/components/atoms/FormErrorMessage';

const MIN_SKILL_LENGTH = 2;
const MAX_SKILL_LENGTH = 50;
const MAX_SKILLS = 50;
const jobValidationSchema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters'),

  description: yup
    .string()
    .required('Description is required')
    .min(12, 'Description must be at least 12 characters')
    .max(15000, 'Description must be at most 15,000 characters'),

  categoryId: yup
    .string()
    .required('Category is required'),

  subcategoryId: yup
    .string().optional().nullable(),

  skillsRequired: yup
    .array()
    .of(
      yup
        .string()
        .min(MIN_SKILL_LENGTH, `Each skill  must be at least ${MIN_SKILL_LENGTH} characters`)
        .max(MAX_SKILL_LENGTH, `Each skill must be at most ${MAX_SKILL_LENGTH} characters`)
    )
    .min(1, 'At least one skill is required')
    .max(MAX_SKILLS, `You can add up to ${MAX_SKILLS} skills`)
    .required('Skills are required'),


  attachments: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        filename: yup.string().required(),
        mimeType: yup.string().required(),
        size: yup.number().required(),
        type: yup.string().required(),
        url: yup.string().required(),
      })
    ).max(10, 'You can upload up to 10 attachments'),

  additionalInfo: yup
    .string()
    .nullable()
    .max(5000, 'Additional info must be at most 5,000 characters'),

  budget: yup
    .number()
    .min(0, 'Budget must be positive')
    .max(100000, 'Budget must not exceed 100,000')
    .typeError('Budget is required'),

  budgetType: yup
    .string()
    .oneOf(['fixed', 'hourly'], 'Budget type must be fixed or hourly')
    .required('Budget type is required'),

  preferredDeliveryDays: yup
    .number()
    .min(1, 'Minimum 1 day')
    .max(1200, 'Maximum delivery time is 1200 days')
    .typeError('Preferred Delivery Days is required'),

  status: yup
    .string()
    .oneOf(['draft', 'published']),
});


export default function CreateJobPage() {
  const t = useTranslations('createProject');
  const router = useRouter();
  const searchParams = useSearchParams();

  const steps = [
    { key: 'step1', label: 'Project Details' },
    { key: 'step2', label: 'Budget & Delivery' },
    { key: 'step3', label: 'Review & Submit' },
  ];


  const [currentStep, setCurrentStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingJobId, setExistingJobId] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
    getValues,
    reset,
  } = useForm({
    resolver: yupResolver(jobValidationSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      skillsRequired: [],
      attachments: [],
      additionalInfo: '',
      budget: '',
      budgetType: 'fixed',
      preferredDeliveryDays: '',
      status: 'draft',
    },
    mode: 'onChange',
  });

  const formValues = watch();


  useEffect(() => {
    const saveFormData = () => {
      try {
        const formData = getValues();
        sessionStorage.setItem('jobFormData', JSON.stringify(formData));
        sessionStorage.setItem('jobFormPublishing', JSON.stringify(isPublishing));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };

    const timeoutId = setTimeout(saveFormData, 500);
    return () => clearTimeout(timeoutId);
  }, [formValues, isPublishing, getValues]);

  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedFormData = sessionStorage.getItem('jobFormData');
        const savedPublishing = sessionStorage.getItem('jobFormPublishing');

        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          reset(parsedData);
        }

        if (savedPublishing) {
          setIsPublishing(JSON.parse(savedPublishing));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, [reset]);

  const handleToStep = async idx => {
    if (idx > currentStep) {
      let isValid = false;

      if (currentStep === 0) {
        isValid = await trigger(['title', 'description', 'categoryId', 'skillsRequired']);
      } else if (currentStep === 1) {
        isValid = await trigger(['budget', 'budgetType']);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      if (isValid) {
        setCurrentStep(idx);
      } else {
      }
    } else {
      setCurrentStep(idx);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleReset = () => {
    setCurrentStep(0);
    reset({
      title: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      skillsRequired: [],
      attachments: [],
      additionalInfo: '',
      budget: '',
      budgetType: 'fixed',
      preferredDeliveryDays: '',
      status: 'draft',
    });
    setIsPublishing(true);
    setExistingJobId(null);

    sessionStorage.removeItem('jobFormData');
    sessionStorage.removeItem('jobFormPublishing');

    router.replace('?step=0', { scroll: false });
  };

  const handleFileSelection = async files => {
    try {
      setIsSubmitting(true);

      setValue('attachments', files, {
        shouldValidate: true,
      });
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsSubmitting(false);
    }
  };



  const onSubmit = async data => {
    // setIsSubmitting(true);

    // Base payload
    const payload = {
      ...data,
      attachments: data.attachments.map(file => ({
        name: file.filename,
        url: file.url,
        type: file.type,
      })),
      budget: Number(data.budget),
      preferredDeliveryDays: data.preferredDeliveryDays ? Number(data.preferredDeliveryDays) : undefined,
    };

    // Clean UI-only fields
    delete payload.subcategory;
    delete payload.category;

    // Only send status on UPDATE; for CREATE let backend/setting decide
    if (existingJobId) {
      payload.status = isPublishing ? 'published' : 'draft';
    }

    try {
      const action = existingJobId ? 'update' : 'create';

      const req = () => (existingJobId ? updateJob(existingJobId, payload) : createJob(payload));

      const result = await toast.promise(
        req(),
        {
          loading: action === 'create' ? (isPublishing ? 'Publishing your job…' : 'Saving your draft…') : isPublishing ? 'Updating & publishing…' : 'Updating draft…',
          success: res => {
            // Decide message based on actual backend status
            const status = String(res?.status || '').toLowerCase();

            // Clear persisted form state
            sessionStorage.removeItem('jobFormData');
            sessionStorage.removeItem('jobFormPublishing');

            if (!existingJobId) {
              // CREATE
              if (status === 'published') {
                return 'Your job is live 🎉 Sellers can apply now.';
              }
              if (status === 'draft') {
                return 'Submitted for review ✅ An admin will approve it soon.';
              }
              return 'Job created ✅';
            } else {
              // UPDATE
              if (status === 'published') {
                return 'Job published ✅ It’s now visible to sellers.';
              }
              if (status === 'draft') {
                return 'Draft updated 💾';
              }
              return 'Job updated ✅';
            }
          },
          error: err => {
            const msg = err?.response?.data?.message || err?.message || 'Something went wrong';
            return `Failed: ${msg}`;
          },
        },
        { success: { duration: 4000 }, error: { duration: 5000 } },
      );

      // Navigate based on actual status
      const status = String(result?.status || '').toLowerCase();
      if (!existingJobId) {
        if (status === 'published') {
          router.push('/my-jobs?tab=live');
        } else if (status === 'draft') {
          router.push('/my-jobs?tab=pending');
        } else {
          router.push('/my-jobs');
        }
      } else {
        // For updates, respect the status we got back
        if (status === 'published') {
          router.push('/my-jobs?tab=live');
        } else if (status === 'draft') {
          router.push('/my-jobs?tab=pending');
        } else {
          router.push('/my-jobs');
        }
      }
    } catch (error) {
      console.error('Error submitting job:', error);
      // toast.promise already showed an error toast; no need to duplicate
    } finally {
      setIsSubmitting(false);
    }
  };

  const budgetTypeOptions = [
    { id: 'fixed', name: 'Fixed Price' },
    { id: 'hourly', name: 'Hourly Rate' },
  ];

  return (
    <div className='container mx-auto px-4 py-6'>
      <HeaderCategoriesSwiper />


      <div className='mt-6 mb-8 max-lg:hidden' data-aos='fade-down'>
        <StepBreadcrumbs items={steps} activeIndex={currentStep} onItemClick={handleToStep} onReset={handleReset} resetLabel={t('crumb.reset')} />
      </div>

      <div className='grid grid-cols-1 duration-300 lg:grid-cols-[450_1fr] xl:grid-cols-[590px_1fr] xl:gap-6 gap-6 mb-18 mt-12'>
        <HeroCard currentStep={currentStep} className='lg:sticky lg:top-[100px]' />

        <div className='space-y-8'>
          {currentStep === 0 && <ProjectForm getValues={getValues} key='step1' register={register} control={control} errors={errors} setValue={setValue} trigger={trigger} handleFileSelection={handleFileSelection} watch={watch} setCurrentStep={setCurrentStep} formValues={formValues} />}

          {currentStep === 1 && <BudgetAndDelivery key='step2' register={register} control={control} errors={errors} trigger={trigger} budgetTypeOptions={budgetTypeOptions} setCurrentStep={setCurrentStep} />}

          {currentStep === 2 && <ProjectReview key='step3' data={formValues} isPublishing={isPublishing} onPublishToggle={setIsPublishing} onEditProject={() => setCurrentStep(0)} onEditJob={() => setCurrentStep(1)} onBack={() => setCurrentStep(1)} onSubmit={handleSubmit(onSubmit)} isSubmitting={isSubmitting} errors={errors} />}
        </div>
      </div>
    </div>
  );
}

function StepBreadcrumbs({ items = [], activeIndex = 1, onItemClick, onReset, resetLabel = 'Reset', className = '', accentClass = 'text-emerald-600' }) {
  const [revealedCount, setRevealedCount] = useState(Math.max(1, activeIndex + 1));

  useEffect(() => {
    setRevealedCount(prev => Math.max(prev, activeIndex + 1));
  }, [activeIndex]);

  const visibleItems = items.slice(0, revealedCount);

  return (
    <div className={`my-[20px] ${className}`} aria-label='Breadcrumb'>
      <ol className='flex items-center gap-2 w-fit rounded-2xl bg-slate-50 px-4 py-2 border border-slate-100'>
        <li className='flex items-center'>
          <button onClick={onReset} className='inline-flex items-center -ml-1.5 p-1.5 rounded-lg hover:bg-slate-100' title='Reset'>
            <svg width='30' height='30' className='ltr:mr-3 rtl:ml-3' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <g clipPath='url(#clip0_91_17526)'>
                <path d='M57.3816 23.6815L54.7066 21.0031C54.1406 20.44 53.8308 19.6892 53.8308 18.8937V15.1039C53.8308 10.176 49.8213 6.1658 44.8943 6.1658H41.1052C40.3217 6.1658 39.5532 5.84701 38.9991 5.29285L36.3211 2.61439C32.8359 -0.871465 27.1701 -0.871465 23.6848 2.61439L21.0009 5.29285C20.4468 5.84701 19.6783 6.1658 18.8948 6.1658H15.1058C10.1787 6.1658 6.1692 10.176 6.1692 15.1039V18.8937C6.1692 19.6892 5.8594 20.44 5.2964 21.0031L2.61841 23.6785C0.929402 25.3678 0 27.6143 0 30.0007C0 32.3872 0.93238 34.6337 2.61841 36.32L5.29342 38.9984C5.8594 39.5615 6.1692 40.3123 6.1692 41.1078V44.8976C6.1692 49.8255 10.1787 53.8357 15.1058 53.8357H18.8948C19.6783 53.8357 20.4468 54.1545 21.0009 54.7086L23.6789 57.3901C25.4215 59.13 27.7093 60 29.997 60C32.2848 60 34.5725 59.13 36.3152 57.3871L38.9932 54.7086C39.5532 54.1545 40.3217 53.8357 41.1052 53.8357H44.8943C49.8213 53.8357 53.8308 49.8255 53.8308 44.8976V41.1078C53.8308 40.3123 54.1406 39.5615 54.7066 38.9984L57.3816 36.323C59.0676 34.6337 60 32.3902 60 30.0007C60 27.6113 59.0706 25.3678 57.3816 23.6815ZM43.5687 26.5208L25.6956 38.4383C25.1921 38.775 24.6142 38.9388 24.0423 38.9388C23.2738 38.9388 22.5112 38.6409 21.9363 38.0659L15.9786 32.1072C14.8138 30.9422 14.8138 29.0593 15.9786 27.8943C17.1433 26.7294 19.0259 26.7294 20.1906 27.8943L24.4206 32.125L40.2621 21.5632C41.6354 20.6485 43.4823 21.0179 44.3938 22.3885C45.3083 23.759 44.9389 25.6092 43.5687 26.5208Z' fill='#108A00' />
              </g>
              <defs>
                <clipPath id='clip0_91_17526'>
                  <rect width='60' height='60' fill='white' />
                </clipPath>
              </defs>
            </svg>
            {resetLabel}
          </button>
        </li>

        {visibleItems.map((it, i) => {
          const isActive = i === activeIndex;

          return (
            <React.Fragment key={`${it.label}-${i}`}>
              <li aria-hidden className='text-slate-400'>
                <img src='/icons/arrow-right.svg' className='h-4 w-4' alt='' />
              </li>

              <li className='min-w-0 text-lg'>
                <button type='button' title={it.label} aria-current={isActive ? 'page' : undefined} onClick={() => onItemClick(i)} className={`truncate font-[500] transition ${isActive ? `${accentClass} opacity-100` : 'text-slate-700 opacity-80 hover:opacity-100'}`}>
                  {it.label}
                </button>
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}

function HeroCard({ currentStep, className = '' }) {
  const stepContent = [
    {
      title: 'Let the matching begin..',
      subtitle: 'This is where you fill us in on the big picture.',
    },
    {
      title: "Now let's talk budget and timing",
      subtitle: 'This is where you provide us with the full picture.',
    },
    {
      title: 'Ready to review your job?',
      subtitle: 'This is where you start making final decisions.',
    },
  ];

  const { title, subtitle } = stepContent[currentStep] || stepContent[0];

  return (
    <section className={`w-full h-fit p-6 py-12 rounded-2xl shadow-inner border border-slate-200 ${className}`} aria-label='matching-hero'>
      <div className='space-y-6 md:space-y-7'>
        <h1 className='font-extrabold tracking-tight leading-[1.05] text-4xl md:text-[44px] text-black'>{title}</h1>
        <p className='text-gray-700 text-xl md:text-2xl leading-snug'>{subtitle}</p>
      </div>
    </section>
  );
}

function ProjectForm({ register, getValues, control, errors, setValue, trigger, handleFileSelection, watch, setCurrentStep, formValues }) {

  const handleNext = async () => {
    const isValid = await trigger(['title', 'description', 'categoryId', 'skillsRequired', 'attachments']);
    console.log(errors)
    if (isValid) {
      setCurrentStep(1);
    } else {
    }
  };



  return (
    <div className='w-full p-6 rounded-2xl shadow-inner border border-slate-200 flex flex-col'>
      <BecomeFreelancer />

      <h2 className='h2 mt-6 mb-2'>Give your project job a title</h2>

      <div className='mb-4'>
        <Input {...register('title')} cnLabel='!text-[15px]' label={'Keep it short and simple - this will help us match you to the right category.'} placeholder={'Enter project title'} error={errors.title?.message} />
      </div>

      <div className='mb-4'>
        <Textarea cnInput='text-[14px]' {...register('description')} cnLabel={'!text-[15px]'} label='Project Description' placeholder='Describe your project in detail' rows={5} error={errors.description?.message} />
      </div>

      <div className='mb-4'>
        <Controller
          name='categoryId'
          control={control}
          render={({ field }) => (
            <CategorySelect
              type='category'
              label='Category'
              value={formValues?.category}
              onChange={opt => {
                field.onChange(opt.id);
                setValue('category', opt);
                setValue('subcategoryId', null);
                setValue('subcategory', null);
              }}
              error={errors?.categoryId?.message}
              placeholder='Select a category'
            />
          )}
        />
      </div>

      <div className='mb-4'>
        <Controller
          name='subcategoryId'
          control={control}
          render={({ field }) => (
            <CategorySelect
              type='subcategory'
              parentId={watch('categoryId')}
              label='SubCategory'
              value={formValues?.subcategory}
              onChange={opt => {
                field.onChange(opt.id);
                setValue('subcategory', opt);
              }}
              error={errors?.subcategoryId?.message}
              placeholder={watch('categoryId') ? 'Select a subcategory' : 'Select a category first'}
            />
          )}
        />
      </div>

      <div className='mb-4'>
        <InputList label='Skills Required *' value={formValues.skillsRequired || []} getValues={getValues} setValue={setValue} fieldName='skillsRequired' placeholder='Add a skill (e.g., WordPress)' errors={errors} validationMessage='Please provide at least one skill.' maxTags={MAX_SKILLS} />
      </div>

      <div className='mb-4'>
        <Textarea cnInput='text-[14px]' {...register('additionalInfo')} cnLabel={'!text-[15px]'} label='Additional Information (Optional)' placeholder='Any additional details or requirements' rows={4} error={errors.additionalInfo?.message} />

      </div>

      <AttachFilesButton onChange={handleFileSelection} value={formValues.attachments} />
      <FormErrorMessage message={errors.attachments?.message} />

      <div className='flex items-center justify-between gap-4 mt-6'>
        {/* <Button className='!max-w-fit' name={'Back'} onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} color='secondary' /> */}
        <div></div>
        <Button className='!max-w-fit' name={'Next'} onClick={handleNext} color='green' />
      </div>
    </div>
  );
}

function BudgetAndDelivery({ register, control, errors, trigger, budgetTypeOptions, setCurrentStep }) {
  const handleNext = async () => {
    const isValid = await trigger(['budget', 'preferredDeliveryDays', 'budgetType']);
    if (isValid) {
      setCurrentStep(2);
    } else {
    }
  };

  return (
    <div className='w-full p-6 rounded-2xl shadow-inner border border-slate-200 flex flex-col'>
      <BecomeFreelancer />

      <div className='space-y-3 mb-8 mt-6 '>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Input {...register('budget')} cnLabel={'!text-[15px]'} placeholder={'Enter budget'} label={'Budget'} type='number' error={errors.budget?.message} />
            <p className='text-sm text-gray-600'>Enter your budget amount</p>
          </div>

          <div>
            <Controller name='budgetType' control={control} render={({ field }) => <Select {...field} cnLabel={'!text-[15px]'} label='Budget Type' options={budgetTypeOptions} error={errors.budgetType?.message} onChange={value => field.onChange(value.id)} />} />
          </div>
        </div>
      </div>

      <div className='space-y-3 mb-6'>
        <Input {...register('preferredDeliveryDays')} cnLabel={'!text-[15px]'} label='Preferred Delivery (Days)' placeholder='Enter number of days' type='number' error={errors.preferredDeliveryDays?.message} />
        <p className='text-sm text-gray-600'>Estimated delivery time in days</p>
      </div>

      <div className='flex items-center justify-between gap-4 mt-6'>
        <Button className='!max-w-fit' name={'Back'} onClick={() => setCurrentStep(0)} color='secondary' />
        <Button className='!max-w-fit' name={'Next'} onClick={handleNext} color='green' />
      </div>
    </div>
  );
}

function ProjectReview({ data, isPublishing, onPublishToggle, onEditProject, onEditJob, onBack, onSubmit, isSubmitting, errors }) {
  const hasFiles = useMemo(() => (data.attachments || []).length > 0, [data.attachments]);

  return (
    <div className='w-full p-6 rounded-2xl shadow-inner border border-slate-200 flex flex-col'>
      <BecomeFreelancer />

      <section className='pb-8  pt-5'>
        <div className='flex items-start justify-between gap-4  '>
          <div>
            <h2 className='text-[22px] md:text-[24px] font-semibold text-black'>Project Details</h2>
            <p className='text-gray-700 mt-2'>Review your project information</p>
          </div>
          <button type='button' onClick={onEditProject} className='p-2 rounded-md hover:bg-gray-100 transition' aria-label='Edit project section' title='Edit'>
            <Pencil className='w-4 h-4 text-gray-700' />
          </button>
        </div>

        <div className='mt-6 space-y-5'>
          <Item label='Title' value={data.title || '—'} />
          <Item label='Description' value={data.description || '—'} />
          <Item label='Category' value={data.category.name || '—'} />
          {data.subcategoryId && <Item label='Subcategory' value={data.subcategory.name || '—'} />}

          <ItemSkills label='Skills Required' value={data.skillsRequired} />

          {data.additionalInfo && <Item label='Additional Information' value={data.additionalInfo} />}

          <div>
            <div className='flex items-center gap-2'>
              <Paperclip className='w-4 h-4 text-gray-700' />
              <div className='text-[15px] font-semibold text-black'>Attachments</div>
            </div>

            {hasFiles ? <AttachmentList attachments={data.attachments} /> : <div className='mt-2 text-sm text-gray-500'>No files attached</div>}
          </div>
        </div>
      </section>

      <hr className='border-t border-gray-200 my-2' />

      <section className='pt-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h3 className='text-[22px] md:text-[24px] font-semibold text-black'>Budget & Delivery</h3>
            <p className='text-gray-700 mt-2'>Budget and delivery details</p>
          </div>
          <button type='button' onClick={onEditJob} className='p-2 rounded-md hover:bg-gray-100 transition' aria-label='Edit job section' title='Edit'>
            <Pencil className='w-4 h-4 text-gray-700' />
          </button>
        </div>

        <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 gap-8'>
          <Item label='Budget' value={`$${data.budget} (${data.budgetType})`} />
          <Item label='Delivery Days' value={data.preferredDeliveryDays || 'Not specified'} />
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Switcher Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Save as Draft</span>
          <Switcher checked={isPublishing} onChange={onPublishToggle} />
          <span className="text-sm text-gray-600">Publish</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end sm:justify-start">
          <Button
            className="w-full sm:w-auto !max-w-full sm:!max-w-fit"
            name="Back"
            onClick={onBack}
            color="secondary"
          />
          <Button
            className="w-full sm:w-auto !max-w-full sm:!max-w-fit"
            name={isPublishing ? 'Publish Job' : 'Save Draft'}
            onClick={onSubmit}
            color="green"
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </div>

    </div>
  );
}

function Item({ label, value }) {
  return (
    <div className='flex items-center gap-3  '>
      <div className='text-[16px] max-w-[140px] w-full  font-semibold text-black'>{label}</div>
      <div className='text-gray-800 mt-1 leading-relaxed'>{value}</div>
    </div>
  );
}

export function ItemSkills({ label, value, cnLabel }) {
  return (
    <div className='flex items-center gap-4 '>
      <div className={`text-base text-slate-500 font-semibold w-full max-w-[140px] ${cnLabel}`}>{label}</div>
      <div className='flex flex-wrap gap-2'>
        {value?.map((skill, index) => (
          <span key={index} className='gradient text-white px-3 py-1 rounded-full text-sm font-medium flex items-center'>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
