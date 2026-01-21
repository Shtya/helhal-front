// import React, { useState } from 'react';
// import Input from './Input';
// import Button from './Button';
// import { Plus, X } from 'lucide-react';

// const InputList = ({ label, value, setValue , onChange , getValues, fieldName, placeholder, errors, renderItem, onKeyPressHandler, onRemoveItemHandler }) => {
//   const [inputValue, setInputValue] = useState('');

//   const handleAddItem = () => {
//     if (inputValue.trim()) {
//       const currentItems = getValues(fieldName) || [];
//       setValue(fieldName, [...currentItems, inputValue.trim()], { shouldValidate: true });
//       setInputValue('');
// 			onChange?.([...currentItems, inputValue.trim()])
//     }
//   };

//   const handleRemoveItem = index => {
//     const updatedItems = value.filter((_, i) => i !== index);
//     setValue(fieldName, updatedItems, { shouldValidate: true });
//     if (onRemoveItemHandler) onRemoveItemHandler(index);
//   };

//   return (
//     <div className='mb-4'>
//       <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>

//       <div className='flex gap-2 mb-2'>
//         <Input
//           error={errors[fieldName]?.message}
//           value={inputValue}
//           onChange={e => setInputValue(e.target.value)}
//           placeholder={placeholder}
//           onKeyPress={
//             onKeyPressHandler ||
//             (e => {
//               if (e.key === 'Enter') {
//                 e.preventDefault();
//                 handleAddItem();
//               }
//             })
//           }
//         />

//         <Button
//           type='button'
//           onClick={handleAddItem}
//           // name={addItemLabel}
//           color='green'
//           icon={<Plus />}
//           className=' -mt-[2px] !px-3  !h-[45px] !max-w-fit'
//         />
//       </div>

//       <div className='mt-2 flex flex-wrap gap-2'>
//         {value?.map((item, index) => (
//           <span key={index} className='bg-main-100 text-main-800 px-3 py-1 rounded-full text-base cursor-pointer hover:opacity-80 duration-300 flex items-center'>
//             {renderItem ? renderItem(item, index) : item}
//             <button type='button' onClick={() => handleRemoveItem(index)} className='ml-2 text-main-600 hover:text-main-800'>
//               <X size={16} className='cursor-pointer' />
//             </button>
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default InputList;

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import FormErrorMessage from './FormErrorMessage';
import { json } from 'zod';

export default function TagInput({ label, value, fieldName, getValues, setValue, placeholder = 'Type and press Enter…', errors, onChange, onRemoveItemHandler, onValidate, maxTags, minTagLength, maxTagLength, plusDisabled, className }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const tags = useMemo(() => {

    if (Array.isArray(value)) return value;
    const current = getValues(fieldName);

    return Array.isArray(current) ? current : [];
  }, [value, getValues, fieldName]);

  const canAddMore = typeof maxTags === 'number' ? tags.length < maxTags : true;
  const error = errors?.[fieldName];


  const errorMsg = useMemo(() => {
    if (Array.isArray(error)) {
      const firstValid = error.find(item => item?.message);
      return firstValid?.message ?? null;
    }
    return error?.message ?? null;
  }, [error]);

  function splitAndClean(input) {
    if (Array.isArray(input)) return input;

    return input
      .split(/[,\n]/g)       // Split by comma or newline
      .map(s => s.trim())    // Remove surrounding whitespace
      .filter(Boolean);      // Remove empty strings
  }

  const commit = useCallback(
    raw => {
      if (!raw) return;
      const pieces = splitAndClean(raw);

      if (pieces.length === 0) return;

      let next = [...tags];
      for (const p of pieces) {
        if (!p) continue;
        if (next.includes(p)) continue; // de-duplicate
        if (!canAddMore) break;
        next.push(p);
      }

      if (next.length !== tags.length) {
        setValue(fieldName, next, { shouldValidate: true, shouldDirty: true });
        onChange?.(next);
      }
    },
    [tags, setValue, fieldName, onChange, canAddMore],
  );

  // return is valid to add or not 
  function isValid(tag) {
    if (minTagLength && tag?.length < minTagLength) return false;

    if (!onValidate) return true;

    return onValidate(tag);
  }
  const handleAddClick = () => {
    if (!canAddMore) return;
    if (!isValid(inputValue.trim())) return;

    commit(inputValue, tags, maxTags);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRemove = value => {
    const next = tags.filter((val) => val !== value);
    setValue(fieldName, next, { shouldValidate: true, shouldDirty: true });
    onChange?.(next);
    onRemoveItemHandler?.(value);
    inputRef.current?.focus();
  };

  const onKeyDown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddClick();
      return;
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // backspace removes last tag
      e.preventDefault();
      handleRemove(tags[tags.length - 1]);
      return;
    }
  };

  const onPaste = e => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    e.preventDefault();
    // if maxTagLength provided, trim each pasted token to allowed length
    if (typeof maxTagLength === 'number' && maxTagLength > 0) {
      const tokens = splitAndClean(text)
        .map(s => (s.length > maxTagLength ? s.slice(0, maxTagLength) : s))
        .filter(s => isValid(s));
      if (tokens.length) {
        commit(tokens.join(','));
      }
    } else {
      commit(text);
    }
    setInputValue('');
  };

  const handleInputChange = e => {
    const v = e.target.value ?? '';
    if (typeof maxTagLength === 'number' && maxTagLength > 0) {
      // trim to allowed length
      if (v.length > maxTagLength) {
        setInputValue(v.slice(0, maxTagLength));
        return;
      }
    }
    setInputValue(v);
  };

  // Make container focus the input when clicked
  const containerRef = useRef(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = ev => {
      if (ev.target.closest('button[data-chip]')) return;
      inputRef.current?.focus();
    };
    el.addEventListener('mousedown', handler);
    return () => el.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={className || ''}>
      {label && <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>}

      <div ref={containerRef} className={['w-full min-h-[44px] rounded-md border px-2 py-1.5 flex items-center gap-1 flex-wrap', 'bg-white shadow-sm transition-colors', 'focus-within:ring-2 focus-within:ring-main-500 focus-within:border-main-500', errorMsg ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300 hover:border-main-500/60'].join(' ')}>
        {/* tags */}
        {tags.map((t, i) => (
          <span key={`${t}-${i}`} className=' border border-slate-200 group inline-flex items-center gap-1 rounded-xl bg-main-100  text-main-800 px-2.5 py-1 text-sm'>
            <span className='break-all'>{t}</span>
            <button type='button' data-chip onClick={() => handleRemove(t)} title='Remove' className='cursor-pointer  text-main-600 hover:text-main-800 transition'>
              <X size={13} />
            </button>
          </span>
        ))}

        {/* input + inline add button */}
        <div className='relative flex-1 min-w-[120px]'>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => {

              // optionally commit on blur  
              if (inputValue.trim()) {
                if (!isValid(inputValue.trim())) return;
                commit(inputValue);
                setInputValue('');
              }
            }}
            placeholder={tags.length ? '' : placeholder}
            className='w-full border-0 outline-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400 pr-3'
            disabled={!canAddMore}
          />
          <button type='button' onClick={handleAddClick} title='Add' className='gradient cursor-pointer text-white absolute end-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md  disabled:opacity-40' disabled={!canAddMore || !inputValue.trim() || (minTagLength && inputValue?.length < minTagLength)}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {errorMsg && <FormErrorMessage message={errorMsg} />}

      {/* Optional helper / counter */}
      {typeof maxTags === 'number' && (
        <p className='text-xs text-gray-500 mt-1'>
          {tags.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}
