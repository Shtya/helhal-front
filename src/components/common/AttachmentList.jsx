import React, { useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Modal } from './Modal';
import { baseImg } from '@/lib/axios';
import Img from '../atoms/Img';

const AttachmentList = ({ attachments, className, cnAttachment }) => {
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

  const isImage = file => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  };

  const handleOpenInNewTab = file => {
    window.open(baseImg + file?.url, '_blank');
  };


  return (
    <div className={`mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 xl:gap-4 ${className}`}>
      {attachments?.length > 0 &&
        attachments.map((f, i) => (
          <div key={i} className={`flex items-center  w-full  gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer hover:bg-gray-100 ${cnAttachment}`} onClick={() => handleAttachmentClick(f)}>
            <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-yellow-500 flex items-center justify-center">
              <Paperclip className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-900 max-w-[160px] sm:max-w-none">{f.name}</div>
              <div className="text-xs text-gray-500 truncate">{f.type}</div>
            </div>
          </div>
        ))}


      {isModalOpen && selectedFile && (
        <Modal title={'Preview File'} onClose={handleCloseModal}>
          {isImage(selectedFile) ? (
            <div>
              {isImageLoading && (
                <div className="animate-pulse bg-gray-200 rounded-md w-full" style={{ height: '464px' }} />
              )}
              <Img src={selectedFile?.url} alt={selectedFile?.name} className='w-full' onLoad={() => setIsImageLoading(false)} />
            </div>
          ) : (
            // Provide option to open in a new tab for non-image files (e.g., PDFs, Word docs)
            <div className='text-center'>
              <p className='text-gray-600'>This file cannot be previewed directly.</p>
              <button onClick={() => handleOpenInNewTab(selectedFile)} className='mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300'>
                Open in New Tab
              </button>
              <a href={baseImg + selectedFile?.url} target='_blank' download={selectedFile?.name} className='mt-4 ml-2 inline-block px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-300'>
                Download
              </a>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default AttachmentList;
