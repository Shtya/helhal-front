'use client';
import AttachFilesButton from './AttachFilesButton';
import Input from '@/components/atoms/Input';
import { baseImg } from '@/lib/axios';

export default function ImagePicker({ value = '', onChange, disabled, allowManual = true, label = 'Image' }) {
  return (
    <div className='' >
      <label className={`block text-sm font-medium text-slate-700 ${!disabled ? "-mb-3" : 'mb-3'}`}>{label}</label>

      <div className='flex items-center gap-2'>
        {allowManual && <Input disabled={disabled} type='url' value={value} onChange={e => onChange(e.target?.value ?? e)} placeholder='https://example.com/image.jpg' className='flex-1' />}

        {!disabled && (
          <AttachFilesButton
            hiddenFiles
            iconOnly
            className={""}
            onChange={files => {
              if (!files?.length) return;
              const img = files.find(f => String(f.mimeType || '').startsWith('image/')) || files[0];
              if (!String(img?.mimeType || '').startsWith('image/')) {
                alert('Please select an image file.');
                return;
              }
              onChange(baseImg + img.url);
            }}
          />
        )}
      </div>

    </div>
  );
}
