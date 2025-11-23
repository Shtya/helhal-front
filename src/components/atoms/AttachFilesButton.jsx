'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { FiUpload, FiX } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { File, FileText, ImageIcon, Music, Video, Check, Search } from 'lucide-react';
import api, { baseImg } from '@/lib/axios';

// Icon by mime
export const getFileIcon = mimeType => {
  if (mimeType?.startsWith('image')) return <ImageIcon className='w-10 h-10 text-blue-500' />;
  if (mimeType?.startsWith('video')) return <Video className='w-10 h-10 text-purple-500' />;
  if (mimeType?.startsWith('audio')) return <Music className='w-10 h-10 text-green-500' />;
  if (mimeType === 'application/pdf' || mimeType === 'document') return <FileText className='w-10 h-10 text-red-500' />;
  return <File className='w-10 h-10 text-gray-400' />;
};


export default function AttachFilesButton({ iconOnly, hiddenFiles, className, onChange, value, cnBtn, maxSelection = undefined, cnModel }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  // selection by ID (no duplicates)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedMap, setSelectedMap] = useState(new Map());

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Derived selected array for chips outside modal
  const selectedFiles = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  // sync incoming `value` prop into internal selected state
  useEffect(() => {
    if (!Array.isArray(value)) return;
    const ids = new Set();
    const map = new Map();
    value.forEach(v => {
      if (!v) return;
      if (typeof v === 'object' && v.id != null) {
        ids.add(v.id);
        map.set(v.id, v);
      } else {
        const id = String(v);
        ids.add(id);

        map.set(id, { id });
      }
    });
    setSelectedIds(ids);
    setSelectedMap(map);
  }, [value]);

  // Open/close helpers
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Fetch assets (cached after first successful load)
  const fetchUserAssets = useCallback(async () => {
    if (loadedOnce) return; // cache
    setLoading(true);
    try {
      const res = await api.get('/assets');
      const list = Array.isArray(res?.data?.records) ? res.data.records : res.data;
      setAttachments(list || []);
      setLoadedOnce(true);
    } catch {
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [loadedOnce]);

  // Load on open (first time)
  useEffect(() => {
    if (isModalOpen) {
      fetchUserAssets();
    }
  }, [isModalOpen, fetchUserAssets]);

  // Close on ESC
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = e => e.key === 'Escape' && closeModal();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  const toggleSelect = file => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(file.id)) {
        next.delete(file.id);
        setSelectedMap(m => {
          const mm = new Map(m);
          mm.delete(file.id);
          return mm;
        });
      } else {

        if (maxSelection && next.size >= maxSelection) {
          const oldestId = next.values().next().value;
          next.delete(oldestId);
          setSelectedMap(m => {
            const mm = new Map(m);
            mm.delete(oldestId);
            return mm;
          });
        }

        next.add(file.id);
        setSelectedMap(m => {
          const mm = new Map(m);
          mm.set(file.id, file);
          return mm;
        });
      }
      return next;
    });
  };

  const handleOkClick = () => {
    onChange?.(Array.from(selectedMap.values()));
    closeModal();
  };

  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/assets/${fileId}`);
      setAttachments(prev => prev.filter(f => f.id !== fileId));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      setSelectedMap(prev => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
    } catch {
      // keep silent or toast here
    }
  };

  const handleFileChange = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('category', 'general');

      const response = await api.post('/assets/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newFiles = response?.data?.assets || response?.data || [];
      setAttachments(prev => [...prev, ...newFiles]);
      // auto-select newly uploaded
      setSelectedIds(prev => {
        const next = new Set(prev);
        const mapNext = new Map(selectedMap);

        // calculate remaining slots
        const remaining =
          typeof maxSelection === "number" ? Math.max(0, maxSelection - next.size) : Infinity;

        // only take up to remaining slots
        const filesToAdd = newFiles.slice(0, remaining);

        filesToAdd.forEach(f => {
          next.add(f.id);
          mapNext.set(f.id, f);
        });

        setSelectedMap(mapNext);
        return next;
      });

    } catch {
      // toast error if you want
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attachments;
    return attachments.filter(a => (a.filename || '').toLowerCase().includes(q));
  }, [attachments, query]);

  // Modal content
  const modalContent = (
    <div
      className={`fixed inset-0 z-[101] bg-black/40 backdrop-blur-sm flex items-center justify-center ${cnModel} `}
      onClick={e => {
        if (e.target === e.currentTarget) closeModal();
      }}>
      <div className='bg-white w-[95vw] max-w-[600px] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col'>
        {/* Header */}
        <div className='px-5 py-4 border-b border-slate-200 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <span className='text-lg font-semibold text-slate-800'>Your Library</span>
            {selectedIds.size > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedIds.size}
                {typeof maxSelection === "number" && ` / ${maxSelection}`} selected
              </span>
            )}
          </div>
          <button onClick={closeModal} className='p-2 rounded-md hover:bg-slate-100'>
            <FiX className='w-5 h-5 text-slate-500' />
          </button>
        </div>

        {/* Body */}
        <div className='p-5 overflow-auto'>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4'>
            {/* Upload card (secondary) */}
            <label className='group relative border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl flex items-center justify-center h-[140px] bg-slate-50 hover:bg-emerald-50/40 transition cursor-pointer'>
              <input type='file' className='sr-only' onChange={handleFileChange} multiple disabled={uploading || loading} />
              {!uploading ? (
                <div className='flex flex-col items-center text-slate-600'>
                  <FiUpload className='w-6 h-6' />
                  <span className='mt-1 text-xs'>Upload</span>
                </div>
              ) : (
                <FaSpinner className='animate-spin h-5 w-5 text-emerald-600' />
              )}
            </label>

            {/* Files */}
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className='h-[140px] rounded-xl border border-slate-200 bg-slate-50 animate-pulse' />)
            ) : filtered.length === 0 ? (
              <div className='col-span-full text-center text-sm text-slate-500 py-8'>No files found</div>
            ) : (
              filtered.map(asset => {
                const isSelected = selectedIds.has(asset.id);
                return (
                  <button key={asset.id} onClick={() => toggleSelect(asset)} className={['group relative h-[140px] rounded-xl border transition text-left', isSelected ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 hover:border-emerald-400 bg-white'].join(' ')}>
                    {/* delete button */}
                    <div onClick={e => handleDeleteFile(asset.id, e)} className='cursor-pointer absolute top-2 right-2 p-1 rounded-full bg-white/90 border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition' title='Delete'>
                      <FiX className='w-4 h-4 text-red-600' />
                    </div>

                    {/* check mark */}
                    {isSelected && (
                      <span className='absolute left-2 top-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shadow'>
                        <Check className='w-4 h-4' />
                      </span>
                    )}

                    {/* content */}
                    <div className='p-3 h-full flex flex-col items-center justify-center'>
                      {asset.mimeType?.startsWith('image/') ? <img src={baseImg + asset.url} alt={asset.filename} className='w-20 h-[70px] object-contain rounded' /> : <div className='w-20 h-20 flex items-center justify-center'>{getFileIcon(asset.mimeType)}</div>}

                      <div className=' text-center mt-2 w-full text-xs text-slate-700 truncate' title={asset.filename}>
                        {asset.filename}
                      </div>
                      <div className='text-[11px] text-slate-400'>{asset.size ? `${Math.round(asset.size / 1024)} KB` : ''}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between'>
          <div className='text-sm text-slate-600'>{selectedIds.size > 0 ? `${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''} selected` : 'No files selected'}</div>
          <div className='flex items-center gap-2'>
            <button onClick={closeModal} className='  px-4 py-2 text-slate-700 hover:bg-white border border-slate-300 rounded-md'>
              Cancel
            </button>
            <button onClick={handleOkClick} disabled={selectedIds.size === 0} className='gradient px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700'>
              Use {selectedIds.size} file{selectedIds.size > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className || ''}>
      {/* Trigger + selected chips */}
      <div className='flex flex-col md:flex-row  md:items-center gap-4 mt-6 mb-6'>
        <button onClick={openModal} className={[iconOnly ? '!w-fit !px-2 !rounded-md' : 'px-10', 'flex-none flex items-center gap-2 py-2 rounded-lg border border-emerald-500 text-emerald-500 cursor-pointer hover:bg-emerald-50', cnBtn].join(' ')}>
          <img src='/icons/attachment-green.svg' alt='' className='w-5 h-5' />
          <span className={iconOnly ? 'hidden' : 'font-medium'}>Attach Files</span>
        </button>

        {!hiddenFiles && (
          <ul className='flex flex-wrap items-center gap-2 w-full'>
            {selectedFiles.map(file => (
              <li key={file.id} className='flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-sm' title={file.filename || file.name}>
                <span className='truncate max-w-[160px]'>{file.filename || file.name}</span>
                <button
                  onClick={() => {
                    setSelectedIds(prev => {
                      const next = new Set(prev);
                      next.delete(file.id);
                      return next;
                    });
                    setSelectedMap(prev => {
                      const next = new Map(prev);
                      next.delete(file.id);
                      return next;
                    });
                  }}
                  className='text-slate-500 hover:text-red-600'>
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
