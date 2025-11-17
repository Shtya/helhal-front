import React, { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Modal } from './Modal';
import { baseImg } from '@/lib/axios';
import Img from '../atoms/Img';

const formatBytes = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const isImageFile = file => {
  const name = file?.name || file?.filename || '';
  const ext = name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
};

//variant 'lits' | 'grid'
const AttachmentList = ({ attachments = [], className = '', cnAttachment = '', variant = 'grid' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleAttachmentClick = file => {
    setSelectedFile(file);
    setIsModalOpen(true);
    setIsImageLoading(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setIsImageLoading(false);
  };

  const handleOpenInNewTab = file => {
    window.open(file?.startsWith('http') ? file?.url : baseImg + (file?.url || file?.path || ''), '_blank');
  };

  // Helper to get extension label
  const extLabel = (file = {}) => {
    const name = file?.name || file?.filename || '';
    const ext = (name.split('.').pop() || '').toUpperCase();
    return ext || 'FILE';
  };

  // Theme color for labels/icons (use site theme color)
  const themeBg = 'bg-emerald-500';
  const themeText = 'text-emerald-600';

  return (
    <>
      {variant === 'list' ? (
        // Old/list view (default)
        <div className={`mt-2 ${className}`}>
          <ul className="space-y-3">
            {attachments?.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                {/* File extension label */}
                <div className="flex-shrink-0">
                  <bdi className={`label label-ext-file inline-flex items-center justify-center rounded px-2 py-1 text-xs font-semibold text-white ${themeBg}`}>
                    {extLabel(f)}
                  </bdi>
                </div>

                {/* File name and size */}
                <div className="min-w-0 flex-1">
                  <bdi className="block min-w-0">
                    <a
                      href={baseImg + (f?.url || f?.path || '')}
                      title={f?.name || f?.filename}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => {
                        e.preventDefault();
                        handleAttachmentClick(f);
                      }}
                      className="block w-full truncate text-sm font-medium text-slate-900 hover:underline"
                      data-file-type={(f?.name || f?.filename || '').split('.').pop()?.toLowerCase()}
                    >
                      {((f?.name || f?.filename) || '').length > 40
                        ? `${(f?.name || f?.filename).slice(0, 36).trim()}…`
                        : (f?.name || f?.filename)}
                    </a>
                  </bdi>
                  <small className="text-xs text-slate-500">
                    {typeof f?.size === 'number' ? `(${formatBytes(f.size)})` : ''}
                  </small>
                </div>

                {/* Preview button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAttachmentClick(f)}
                    className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800"
                    title="Preview"
                    aria-label="Preview"
                  >
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

      ) : (
        // New/grid/card view (existing style, single color icon)
        <div className={`mt-3 flex flex-wrap gap-3 ${className}`}>
          {attachments?.length > 0 &&
            attachments.map((f, i) => (
              <div
                key={i}
                onClick={() => handleAttachmentClick(f)}
                className={`flex items-center gap-3 w-full sm:w-[calc(50%-0.375rem)]  bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-md transition ${cnAttachment}`}
                title={f?.name || f?.filename}
              >
                <div className="flex-shrink-0 h-12 w-16 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                  {isImageFile(f) ? (
                    <Img
                      src={f?.startsWith('http') ? f?.url : baseImg + (f?.url || f?.path || '')}
                      alt={f?.name || f?.filename || 'attachment'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className={`h-10 w-10 rounded ${themeBg} flex items-center justify-center`}>
                      <Paperclip className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{f?.name || f?.filename}</div>
                  <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                    <span className="truncate">{f?.type || f?.mimeType || 'file'}</span>
                    {typeof f?.size === 'number' && <span>• {formatBytes(f.size)}</span>}
                  </div>
                </div>

                <div className="ml-auto text-xs text-slate-400">Preview</div>
              </div>
            ))}
        </div>
      )}

      {isModalOpen && selectedFile && (
        <Modal title={'Preview File'} onClose={handleCloseModal}>
          {isImageFile(selectedFile) ? (
            <div>
              {isImageLoading && <div className="animate-pulse bg-gray-200 rounded-md w-full" style={{ height: '464px' }} />}
              <Img
                src={selectedFile?.startsWith('http') ? selectedFile?.url : baseImg + (selectedFile?.url || selectedFile?.path || '')}
                alt={selectedFile?.name || selectedFile?.filename}
                className="w-full rounded"
                onLoad={() => setIsImageLoading(false)}
              />
            </div>
          ) : (
            <div className="text-center pt-4">
              <p className="text-gray-600 mb-4">This file cannot be previewed directly.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => handleOpenInNewTab(selectedFile)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                  Open in New Tab
                </button>
                <a
                  href={selectedFile?.startsWith('http') ? selectedFile?.url : baseImg + (selectedFile?.url || selectedFile?.path || '')}
                  target="_blank"
                  rel="noreferrer"
                  download={selectedFile?.name || selectedFile?.filename}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Download
                </a>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
};
export default AttachmentList;