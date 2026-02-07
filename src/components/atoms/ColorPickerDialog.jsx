import React, { useRef, useEffect } from 'react';
import Sketch from '@uiw/react-color-sketch';
import { MdFormatClear, MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';

// interface ColorPickerDialogProps {
//     isOpen: boolean;
//     onClose: () => void;
//     color: string;
//     onChange: (hex: string) => void;
//     onReset: () => void;
//     title: string;
// }

const ColorPickerDialog = ({ isOpen, onClose, color, onChange, onReset, title }) => {
    const wrapperRef = useRef(null);
    const t = useTranslations('common');
    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={wrapperRef}
            className="absolute z-50 mt-2 p-3 bg-white border border-gray-200 shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200"
            style={{ left: 0 }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MdClose size={16} />
                </button>
            </div>

            {/* Sketch Picker */}
            <Sketch
                style={{ boxShadow: 'none', border: 'none', padding: 0 }}
                color={color}
                disableAlpha
                onChange={(color) => onChange(color.hex)}
            />

            {/* Footer / Reset Button */}
            <div className="mt-3 pt-2 border-t border-gray-100">
                <button
                    onClick={() => {
                        onReset();
                        onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <MdFormatClear size={14} />
                    {t('reset_default')}
                </button>
            </div>
        </div>
    );
};

export default ColorPickerDialog;