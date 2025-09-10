import { useState } from 'react';
import BecomeFreelancer from './BecomeFreelancer';
import Textarea from '@/components/atoms/Textarea';
import AttachFilesButton from '@/components/atoms/AttachFilesButton';
import Button from '@/components/atoms/Button';
const { default: Input } = require('@/components/atoms/Input');
const { default: Select } = require('@/components/atoms/Select');

export default function ProjectForm({ t, defaultData, onSubmit, dataAos, setCurrentStep }) {
  const [formData, setFormData] = useState(defaultData);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelection = files => {
    setSelectedFiles(files);
    setFormData({ ...formData, attachments: files });
  };

  const categories = [
    { id: 1, name: 'Design' },
    { id: 2, name: 'Development' },
    { id: 3, name: 'Writing & Translation' },
    { id: 4, name: 'Marketing' },
  ];

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='w-full p-6 rounded-2xl shadow-inner border border-slate-200 flex flex-col  ' data-aos={dataAos}>
      <BecomeFreelancer />

      <h2 className='h2  mt-6 mb-2 '>Give your project job a title</h2>
      <Input cnLabel='p' label={'Keep it short and simple - this will help us match you to the right category.'} placeholder={t('step1.titlePh')} value={formData.title} onChange={val => setFormData({ ...formData, title: val })} />

      <Textarea cnLabel={'p mt-6 '} label='Project Description' placeholder='Describe your project in detail' onChange={e => setFormData({ ...formData, description: e.target.value })} value={formData.description} rows={4} />

      <AttachFilesButton onChange={handleFileSelection} />

      <Select label={t('step1.catLbl')} placeholder={t('step1.catPh')} options={categories} value={formData.category} onChange={opt => setFormData({ ...formData, category: opt })} />

      <div className='flex items-center justify-between gap-4 mt-4 '>
        <Button className='!max-w-fit' name={t('common.back')} onClick={()=> setCurrentStep(prev => prev - 1) } color='secondary' />
        <Button className='!max-w-fit' name={t('step1.submit')} onClick={()=> setCurrentStep(prev => prev + 1) } color='green' />
      </div>
    </form>
  );
}
