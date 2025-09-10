'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Logs, Trash2, X } from 'lucide-react';
import ProgressBar from '@/components/pages/gig/ProgressBar';
import InputList from '@/components/atoms/InputList';
import Textarea from '@/components/atoms/Textarea';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import { Switcher } from '@/components/atoms/Switcher';
import AttachFilesButton, { getFileIcon } from '@/components/atoms/AttachFilesButton';
import { apiService } from '@/services/GigServices';
import { useEffect, useState } from 'react';
import { AnimatedCheckbox } from '@/components/atoms/CheckboxAnimation';
import FAQSection from '@/components/common/Faqs';
import { baseImg } from '@/lib/axios';
import toast from 'react-hot-toast';
import { getUserInfo } from '@/hooks/useUser';
import { Plus, HelpCircle } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';

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
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
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
    fetchCategories();
  }, []);

  const loadSavedData = () => {
    if (typeof window === 'undefined') return;

    const savedData = sessionStorage.getItem('gigCreationData');
    const savedStep = sessionStorage.getItem('gigCreationStep');

    if (savedData) setFormData(JSON.parse(savedData));
    if (savedStep) setStep(parseInt(savedStep));
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (error) {
      setError('Failed to load categories');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async categoryId => {
    try {
      const data = await apiService.getCategories('subcategory');
      const categorySubcategories = data.filter(cat => cat.parentId === categoryId || cat.type === 'subcategory');
      setSubcategories(categorySubcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem('gigCreationData', JSON.stringify(formData));
    sessionStorage.setItem('gigCreationStep', step.toString());
  }, [formData, step]);

  useEffect(() => {
    if (formData.category?.id) {
      fetchSubcategories(formData.category.id);
    } else {
      setSubcategories([]);
    }
  }, [formData.category]);

  const nextStep = () => step < 6 && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  const handleSubmit = async () => {
    const gigId = searchParams.get('gigId');

    try {
      setLoadingServices(true);

      const serviceData = {
        title: formData.packages[0]?.title,
        brief: formData.brief,
        searchTags: formData.tags,
        categoryId: formData.category?.id,
        subcategoryId: formData.subcategory?.id,
        status: 'Pending',
        faq: formData.faqs,
        packages: formData.packages,
        gallery: [...formData.images.map(img => ({ type: 'image', url: img.url, assetId: img.id })), ...formData.video.map(vid => ({ type: 'video', url: vid.url, assetId: vid.id })), ...formData.documents.map(doc => ({ type: 'document', url: doc.url, assetId: doc.id }))],
        requirements: formData.questions,
        fastDelivery: formData.extraFastDelivery,
        additionalRevision: formData.additionalRevision,
      };

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
			toast.error('Failed to create gig. Please try again.')
     } finally {
      setLoadingServices(false);
    }
  };

  return {
    step,
    setStep,
    formData,
    setFormData,
    categories,
    subcategories,
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
        title: yup.string().required('Package title is required'),
        description: yup.string().required('Package description is required'),
        deliveryTime: yup.number().required('Delivery time is required').min(1, 'Delivery time must be at least 1 day'),
        revisions: yup.number().required('Revisions is required').min(0, 'Revisions cannot be negative'),
        price: yup.number().required('Price is required').min(0, 'Price cannot be negative'),
        test: yup.boolean().required('Test field is required'), // Add validation for the "test" field
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
  const { step, formData, loadingServices, setFormData, categories, subcategories, loading, error, nextStep, prevStep, handleSubmit } = useGigCreation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const renderStep = () => {
    if (loading) return <SkeletonLoading />;
    if (error) return <div className='text-red-500 text-center py-12'>{error}</div>;

    switch (step) {
      case 1:
        return <Step1 categories={categories} subcategories={subcategories} formData={formData} setFormData={setFormData} nextStep={nextStep} />;
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
        return <Step1 categories={categories} subcategories={subcategories} formData={formData} setFormData={setFormData} nextStep={nextStep} />;
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
function Step1({ categories, subcategories, formData, setFormData, nextStep }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
    trigger,
    reset,
  } = useForm({
    resolver: yupResolver(step1Schema),
    defaultValues: {
      title: formData.title,
      brief: formData.brief,
      category: formData.category,
      subcategory: formData.subcategory,
      tags: formData.tags,
    },
  });

  // 👇 reinitialize when formData changes
  useEffect(() => {
    reset({
      title: formData.title,
      brief: formData.brief,
      category: formData.category,
      subcategory: formData.subcategory,
    });
  }, [formData, reset]);

  const onSubmit = async data => {
    const isValid = await trigger();
    if (isValid) {
      setFormData({ ...formData, ...data });
      nextStep();
    }
  };

  const handleInputListChange = value => {
    setValue('tags', [...formData?.tags, ...value]);
    setFormData({ ...formData, tags: [...formData?.tags, ...value] });
  };

  const handleCategoryChange = value => {
    setValue('category', value);
    setFormData({ ...formData, category: value });
  };

  const handleSubcategoryChange = value => {
    setValue('subcategory', value);
    setFormData({ ...formData, subcategory: value });
  };

  const handleRemoveInputList = index => {
    setFormData(prev => {
      const updatedTags = prev.tags.filter((_, i) => i !== index);
      return { ...prev, tags: updatedTags };
    });
  };

  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-6 border border-slate-200 rounded-xl py-16 px-4 '>
      <div className='max-w-[1000px] w-full mx-auto'>
        <LabelWithInput title='Gig title' desc='Create a clear, catchy title for your gig. Use relevant keywords to attract buyers and describe your service accurately.'>
          <Textarea placeholder='Gig title' {...register('title')} error={errors?.title?.message} className='mb-4' rows={3} />
        </LabelWithInput>

        <LabelWithInput className='mt-5 border-t border-t-slate-200 pt-5' title='Gig brief' desc='Provide a short overview of your gig. Highlight key details and what makes your service unique.'>
          <Textarea placeholder='Gig brief' {...register('brief')} error={errors?.brief?.message} className='mb-4' rows={3} />
        </LabelWithInput>

        <LabelWithInput className='mt-5 border-t border-t-slate-200 pt-5' title='Category' desc='Choose the category and sub-category most suitable for your Gig.'>
          <div className='flex flex-col gap-4 w-full'>
            <Select label='Category' options={categories} value={formData.category?.id} onChange={handleCategoryChange} error={errors.category?.message} required />

            <Select label='Subcategory' options={subcategories} value={formData.subcategory?.id} onChange={handleSubcategoryChange} error={errors.subcategory?.message} disabled={!watch('category')} />
          </div>
        </LabelWithInput>

        <LabelWithInput className='mt-5 border-t border-t-slate-200 pt-5' title='Search tag' desc='Tag your Gig with buzz words that are relevant to the services you offer. Use all 5 tags to get found.'>
          <div className='mb-6 w-full'>
            <InputList onChange={handleInputListChange} onRemoveItemHandler={handleRemoveInputList} label='Enter tags' value={formData.tags} setValue={setValue} getValues={getValues} fieldName='tags' placeholder='Add a tag' errors={errors} validationMessage={errors.tags?.message} />
            <p className='text-sm text-gray-500 mt-2'>5 tags maximum. Use letters and numbers only.</p>
          </div>
        </LabelWithInput>
      </div>

      <div className='flex justify-end'>
        <Button onClick={handleSubmit(onSubmit)} name='Continue' color='green' className='!w-fit !px-8 ' />
      </div>
    </form>
  );
}

function Step2({ formData, setFormData, nextStep, prevStep }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    getValues,
  } = useForm({
    resolver: yupResolver(step2Schema),
    defaultValues: {
      packages: formData.packages,
      extraFastDelivery: formData.extraFastDelivery,
      additionalRevision: formData.additionalRevision,
    },
  });

  const onSubmit = async data => {
    const isValid = await trigger();
    if (isValid) {
      setFormData({ ...formData, ...data });
      nextStep();
    }
  };

  // Function to handle checkbox state change
  const handleCheckboxChange = (index, field, value) => {
    setFormData(prev => {
      const updatedPackages = [...prev.packages];
      updatedPackages[index][field] = !value;
      return { ...prev, packages: updatedPackages };
    });
  };

  const PackageWatch = watch('packages');
  useEffect(() => {
    setFormData(prev => ({ ...prev, packages: PackageWatch }));
  }, [JSON.stringify(PackageWatch)]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, additionalRevision: getValues('additionalRevision'), extraFastDelivery: getValues('extraFastDelivery') }));
  }, [watch('additionalRevision'), watch('extraFastDelivery')]);

  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-6  overflow-x-auto'>
      <div className='border border-slate-200 rounded-xl '>
        <h3 className='px-4 py-4 text-2xl font-[600]  '>Packages</h3>
        <div className='grid grid-cols-4 border-y-slate-200 border-y py-4 px-4 '>
          <span className='text-xl font-[700]'>#</span>
          <span className=' text-xl font-[700]'>Basic</span>
          <span className=' text-xl font-[700]'>Standard</span>
          <span className=' text-xl font-[700]'>Premium</span>
        </div>

        <div className=' px-4 py-4 grid  grid-cols-4 gap-6 mb-8'>
          <div className='flex flex-col gap-4 '>
            <span className='flex items-center h-[40px]'>Title</span>
            <span className='flex items-center h-[90px]'>Description</span>
            <span className='flex items-center h-[40px]'>Delivery Time (days)</span>
            <span className='flex items-center h-[40px]'>Revisions</span>
            <span className='flex items-center h-[40px]'>Price</span>
            <span className='flex items-center h-[40px]'>Test</span>
          </div>
          {formData.packages.map((_, index) => (
            <div key={index} className='flex flex-col gap-4 '>
              <Input placeholder='Title' {...register(`packages.${index}.title`)} error={errors.packages?.[index]?.title?.message} />
              <Textarea placeholder='Description' {...register(`packages.${index}.description`)} error={errors.packages?.[index]?.description?.message} rows={3} />
              <Input placeholder='Delivery Time (days)' type='number' {...register(`packages.${index}.deliveryTime`, { valueAsNumber: true })} error={errors.packages?.[index]?.deliveryTime?.message} />
              <Input placeholder='Revisions' type='number' {...register(`packages.${index}.revisions`, { valueAsNumber: true })} error={errors.packages?.[index]?.revisions?.message} />
              <Input placeholder='Price ($)' type='number' {...register(`packages.${index}.price`, { valueAsNumber: true })} error={errors.packages?.[index]?.price?.message} />
              <AnimatedCheckbox checked={formData.packages[index]?.test || false} onChange={() => handleCheckboxChange(index, 'test', formData.packages[index]?.test)} />{' '}
            </div>
          ))}
        </div>
      </div>

      <div className='bg-gray-50 p-6 rounded-xl'>
        <h3 className='text-lg font-semibold mb-4'>Extra Services</h3>

        <div className='flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0'>
          <div>
            <h4 className='font-medium text-gray-900'>Extra Fast Delivery</h4>
            <p className='text-sm text-gray-600'>Complete orders faster for an additional fee</p>
          </div>
          <Switcher checked={watch('extraFastDelivery')} onChange={checked => setValue('extraFastDelivery', checked)} />
        </div>

        <div className='flex items-center justify-between py-3'>
          <div>
            <h4 className='font-medium text-gray-900'>Additional Revision</h4>
            <p className='text-sm text-gray-600'>Offer extra revisions for an additional fee</p>
          </div>
          <Switcher checked={watch('additionalRevision')} onChange={checked => setValue('additionalRevision', checked)} />
        </div>
      </div>

      <div className='flex justify-end gap-2 pt-6'>
        <Button icon={<ChevronLeft />} type='button' name='Back' color='outline' onClick={prevStep} className='!w-fit !pr-8 ' />
        <Button onClick={handleSubmit(onSubmit)} name='Continue' color='green' className='!w-fit !px-8 ' />
      </div>
    </form>
  );
}

function Step3({ formData, setFormData, nextStep, prevStep }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(step3Schema),
    defaultValues: {
      description: formData.description,
      faqs: formData.faqs,
    },
  });

  const onSubmit = async data => {
    const isValid = await trigger();
    if (isValid) {
      setFormData({ ...formData, ...data });
      nextStep();
    }
  };

  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  const addFaq = () => {
    if (newFaq.question && newFaq.answer) {
      const currentFaqs = watch('faqs') || [];
      setValue('faqs', [...currentFaqs, newFaq], { shouldValidate: true });
      setNewFaq({ question: '', answer: '' });
    }
  };

  const removeFaq = index => {
    const currentFaqs = watch('faqs') || [];
    setValue(
      'faqs',
      currentFaqs.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  };

  return (
    <form onSubmit={e => e.preventDefault()} className='space-y-6 '>
      {/* FAQ List */}
      <FAQSection className={' !my-0 !px-0 max-w-full'} removeFaq={removeFaq} showTitle={false} faqs={watch('faqs')} />

      {/* Add FAQ Section */}
      <div className='bg-white p-6 rounded-lg shadow-inner border border-slate-200 mt-6'>
        <h4 className='font-medium text-lg mb-4 text-gray-900'>Add New FAQ</h4>
        <div className='space-y-4'>
          <Input label='Question' value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} className='w-full' />
          <Textarea label='Answer' value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} rows={4} className='w-full' />
        </div>
        <div className='flex justify-end'>
          <Button type='button' name='Add FAQ' color='green' onClick={addFaq} disabled={!newFaq.question || !newFaq.answer} className=' !w-fit !mx-auto !px-8 mt-4' />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className='flex justify-end gap-2 pt-6'>
        <Button icon={<ChevronLeft />} type='button' name='Back' color='outline' onClick={prevStep} className='!w-fit !px-6 py-2 text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-colors' />
        <Button onClick={handleSubmit(onSubmit)} name='Continue' color='green' className='!w-fit !px-8 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors' />
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
