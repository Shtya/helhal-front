import ReactDOM from 'react-dom';
import { FiUpload, FiX } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { File, FileText, ImageIcon, Music, Video } from 'lucide-react';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Star, Pin, Search, Send, Paperclip, Smile, Archive, LifeBuoy } from 'lucide-react';
import api, { baseImg } from '@/lib/axios';
import { showNotification } from '@/utils/notifications';
import { useTranslations } from 'next-intl';


/** Get file icon based on type */
export const getFileIcon = mimeType => {
  if (mimeType?.startsWith('image')) {
    return <ImageIcon className='w-18 h-full text-blue-500' />;
  } else if (mimeType?.startsWith('video')) {
    return <Video className='w-18 h-full text-purple-500' />;
  } else if (mimeType?.startsWith('audio')) {
    return <Music className='w-18 h-full text-green-500' />;
  } else if (mimeType === 'application/pdf' || mimeType === 'document') {
    return <FileText className='w-18 h-full text-red-500' />;
  } else {
    return <File className='w-18 h-full text-gray-400' />;
  }
};

export function AttachFilesButton({ hiddenFiles, className, onChange }) {
  const t = useTranslations('Chat.toast');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedCount = selectedFiles.length;

  useEffect(() => {
    if (isModalOpen) fetchUserAssets();
  }, [isModalOpen]);

  const fetchUserAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets');
      setAttachments(response.data.records || response.data || []);
    } catch {
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = () => setIsModalOpen(v => !v);

  const handleFileChange = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('category', 'general');
      const res = await api.post('/assets/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newFiles = res.data.assets || res.data || [];
      setAttachments(prev => [...newFiles, ...prev]); // newest first
      showNotification(t('filesUploadedSuccessfully'), 'success');
    } catch (err) {
      console.error(err);
      showNotification(t('failedToUploadFiles'), 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFileSelect = file => {
    setSelectedFiles(prev => (prev.some(f => f.id === file.id) ? prev.filter(f => f.id !== file.id) : [...prev, file]));
  };

  const handleOkClick = () => {
    onChange?.(selectedFiles);
    setSelectedFiles([]);
    toggleModal();
  };

  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/assets/${fileId}`);
      setAttachments(prev => prev.filter(f => f.id !== fileId));
      setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
      showNotification(t('fileDeletedSuccessfully'), 'success');
    } catch (err) {
      console.error(err);
      showNotification(t('failedToDeleteFile'), 'error');
    }
  };

  const tChat = useTranslations('Chat');
  const Trigger = (
    <button type='button' onClick={toggleModal} aria-label={tChat('attachFiles')} className={[' border-slate-200 text-slate-700 ', ' text-[13px] font-medium transition-colors', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60', className || ''].join(' ')}>
      <span className='grid h-8 w-8 place-items-center rounded-full bg-slate-100'>
        <Paperclip size={14} />
      </span>
      {selectedCount > 0 && <span className='ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-semibold text-white'>{selectedCount}</span>}
    </button>
  );

  const modalContent = (
    <div className='fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center' onClick={e => e.target === e.currentTarget && toggleModal()}>
      <div className='w-full max-w-[720px] sm:rounded-xl sm:my-6 bg-white shadow-xl'>
        {/* header */}
        <div className='flex items-center justify-between px-4 py-3 border-b'>
          <h3 className='text-sm font-semibold'>{tChat('yourFiles')}</h3>
          <label className='relative inline-flex items-center gap-2 text-[13px] font-medium cursor-pointer'>
            <input type='file' className='sr-only' multiple onChange={handleFileChange} disabled={uploading || loading} />
            <span className='grid h-8 w-8 place-items-center rounded-md border border-slate-200 hover:bg-slate-50 transition'>{uploading || loading ? <FaSpinner className='animate-spin h-4 w-4' /> : <FiUpload className='h-4 w-4' />}</span>
            <span>{tChat('upload')}</span>
          </label>
        </div>

        {/* body */}
        <div className='max-h-[65vh] overflow-auto p-3 sm:p-4'>
          <div className='grid grid-cols-3 sm:grid-cols-4 gap-3'>
            {attachments.map(asset => {
              const isSelected = selectedFiles.some(f => f.id === asset.id);
              const absolute = asset.url ? (asset.url.startsWith('http') ? asset.url : baseImg + asset.url) : '';
              const isImage = asset.mimeType?.startsWith?.('image/');
              return (
                <div key={asset.id} onClick={() => handleFileSelect(asset)} className={['relative group cursor-pointer rounded-lg border p-2', 'border-slate-200 hover:border-emerald-400 transition', isSelected ? 'ring-2 ring-emerald-500/60 border-emerald-300 bg-emerald-50/40' : 'bg-white'].join(' ')}>
                  <button onClick={e => handleDeleteFile(asset.id, e)} aria-label='Delete file' className='absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <span className='grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white'>
                      <FiX className='h-3 w-3' />
                    </span>
                  </button>

                  {isImage ? <img src={absolute} alt={asset.filename} className='mx-auto aspect-square w-[88px] object-contain rounded' loading='lazy' /> : <div className='mx-auto aspect-square w-[88px] grid place-items-center rounded bg-slate-50'>{getFileIcon(asset.mimeType)}</div>}
                  <p className='mt-1.5 text-[11px] text-slate-600 text-center truncate' title={asset.filename}>
                    {asset.filename}
                  </p>
                </div>
              );
            })}
            {/* Empty state */}
            {!loading && !attachments.length && <div className='col-span-full text-center text-sm text-slate-500 py-6'>{tChat('noFilesYet')}</div>}
          </div>
        </div>

        {/* footer */}
        <div className='flex items-center justify-between gap-2 px-4 py-3 border-t'>
          <button type='button' onClick={toggleModal} className='text-[13px] px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50'>
            {tChat('close')}
          </button>
          <button onClick={handleOkClick} disabled={!selectedCount} className={['text-[13px] px-3 py-1.5 rounded-md transition', selectedCount ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'].join(' ')}>
            {tChat('useFiles', { count: selectedCount || 0 })}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className || ''}`}>
      <div className='flex items-center gap-2'>
        {Trigger}

        {!hiddenFiles && selectedFiles.length > 0 && (
          <ul className='flex flex-wrap items-center gap-1.5'>
            {selectedFiles.map(f => (
              <li key={f.id} className='flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full text-[12px]'>
                <span className='truncate max-w-[120px]' title={f.filename}>
                  {f.filename}
                </span>
                <button onClick={() => setSelectedFiles(prev => prev.filter(x => x.id !== f.id))} className='text-slate-500 hover:text-red-600' aria-label={`Remove ${f.filename}`}>
                  <FiX className='w-3 h-3' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
}
