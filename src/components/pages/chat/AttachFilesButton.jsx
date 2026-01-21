import ReactDOM from 'react-dom';
import { FiUpload, FiX } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { File, FileText, ImageIcon, Music, Video } from 'lucide-react';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Star, Pin, Search, Send, Paperclip, Smile, Archive, LifeBuoy } from 'lucide-react';
import api, { baseImg } from '@/lib/axios';
import { showNotification } from '@/utils/notifications';
import { useTranslations } from 'next-intl';
import TabsPagination from '@/components/common/TabsPagination';
import { useDebounce } from '@/hooks/useDebounce';
import { isErrorAbort } from '@/utils/helper';
import toast from 'react-hot-toast';


/** Get file icon based on type */
export const getFileIcon = mimeType => {
  if (mimeType?.startsWith('image')) {
    return <ImageIcon className='w-18 h-full text-blue-500' />;
  } else if (mimeType?.startsWith('video')) {
    return <Video className='w-18 h-full text-purple-500' />;
  } else if (mimeType?.startsWith('audio')) {
    return <Music className='w-18 h-full text-main-500' />;
  } else if (mimeType === 'application/pdf' || mimeType === 'document') {
    return <FileText className='w-18 h-full text-red-500' />;
  } else {
    return <File className='w-18 h-full text-gray-400' />;
  }
};

export function AttachFilesButton({ hiddenFiles, className, onChange }) {
  const t = useTranslations('toast');
  const attachFilesT = useTranslations('AttachFiles');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedCount = selectedFiles.length;

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);

  // search
  const [query, setQuery] = useState('');
  const { debouncedValue: debouncedQuery } = useDebounce({ value: query, onDebounce: () => setPage(1) });
  const controllerRef = useRef();


  useEffect(() => {
    const fetchUserAssets = async () => {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoading(true);

      try {
        const response = await api.get('/assets', {
          params: {
            page,
            limit,
            search: debouncedQuery.trim(),
          },
        });

        const data = response.data.records || response.data?.data || [];
        setAttachments(data);
        setPages(Math.ceil(response.data.total_records / response.data.per_page));
      } catch (err) {

        if (!isErrorAbort(err)) {
          setAttachments([]);
        }
      } finally {
        if (controllerRef.current === controller)
          setLoading(false);
      }
    };

    if (isModalOpen) fetchUserAssets();
  }, [isModalOpen, page, limit, debouncedQuery.trim()]);


  const toggleModal = () => setIsModalOpen(v => !v);

  const MAX_SIZES = {
    image: 10 * 1024 * 1024,   // 10 MB
    video: 200 * 1024 * 1024,  // 200 MB
    other: 25 * 1024 * 1024    // 25 MB
  };


  const handleFileChange = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // validate sizes before upload
    for (const f of files) {
      const type = f?.type || "";
      let maxSize;

      if (type.startsWith("image/")) {
        maxSize = MAX_SIZES.image;
      } else if (type.startsWith("video/")) {
        maxSize = MAX_SIZES.video;
      } else {
        maxSize = MAX_SIZES.other;
      }

      if (f.size > maxSize) {
        toast.error(
          attachFilesT("fileTooLarge", {
            name: f.name,
            max: `${Math.round(maxSize / (1024 * 1024))} MB`
          })
        );
        e.target.value = ""; // reset input
        return; // stop upload
      }
    }

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


  //disable file delete for now because of poor FK constraints in backend for assets urls
  // const handleDeleteFile = async (fileId, e) => {
  //   e.stopPropagation();
  //   try {
  //     await api.delete(`/assets/${fileId}`);
  //     setAttachments(prev => prev.filter(f => f.id !== fileId));
  //     setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  //     showNotification(t('fileDeletedSuccessfully'), 'success');
  //   } catch (err) {
  //     console.error(err);
  //     showNotification(t('failedToDeleteFile'), 'error');
  //   }
  // };


  const onSearch = value => {
    setQuery(value);
    setPage(1);
  };


  const tChat = useTranslations('Chat');
  const Trigger = (
    <button type='button' onClick={toggleModal} aria-label={tChat('attachFiles')} className={[' border-slate-200 text-slate-700 ', ' text-[13px] font-medium transition-colors', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500/60', className || ''].join(' ')}>
      <span className='grid h-8 w-8 place-items-center rounded-full bg-slate-100'>
        <Paperclip size={14} />
      </span>
      {selectedCount > 0 && <span className='ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-main-500 px-1 text-[11px] font-semibold text-white'>{selectedCount}</span>}
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

        {/* SEARCH BAR */}
        <div className='p-3 border-b'>
          <input
            value={query}
            onChange={e => onSearch(e.target.value)}
            className='w-full bg-slate-100 text-sm p-2 rounded-md'
            placeholder={tChat('fileSearch')}
          />
        </div>

        {/* body */}
        <div className='max-h-[65vh] overflow-auto p-3 sm:p-4'>
          <div className='grid grid-cols-3 sm:grid-cols-4 gap-3'>
            {attachments.map(asset => {
              const isSelected = selectedFiles.some(f => f.id === asset.id);
              const absolute = asset.url ? (asset.url.startsWith('http') ? asset.url : baseImg + asset.url) : '';
              const isImage = asset.mimeType?.startsWith?.('image/');
              return (
                <div key={asset.id} onClick={() => handleFileSelect(asset)} className={['relative group cursor-pointer rounded-lg border p-2', 'border-slate-200 hover:border-main-400 transition', isSelected ? 'ring-2 ring-main-500/60 border-main-300 bg-main-50/40' : 'bg-white'].join(' ')}>
                  {/* <button onClick={e => handleDeleteFile(asset.id, e)} aria-label='Delete file' className='absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <span className='grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white'>
                      <FiX className='h-3 w-3' />
                    </span>
                  </button> */}

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

        {/* PAGINATION */}
        <div className='p-4 border-t'>
          <TabsPagination
            loading={loading}
            currentPage={page}
            recordsCount={attachments.length}
            totalPages={pages}
            onPageChange={p => setPage(p)}
            itemsPerPage={limit}
            onItemsPerPageChange={sz => {
              setLimit(sz);
              setPage(1);
            }}
          />
        </div>
        {/* footer */}
        <div className='flex items-center justify-between gap-2 px-4 py-3 border-t'>
          <button type='button' onClick={toggleModal} className='text-[13px] px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50'>
            {tChat('close')}
          </button>
          <button onClick={handleOkClick} disabled={!selectedCount} className={['text-[13px] px-3 py-1.5 rounded-md transition', selectedCount ? 'bg-main-600 text-white hover:bg-main-700' : 'bg-slate-200 text-slate-500 cursor-not-allowed'].join(' ')}>
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
