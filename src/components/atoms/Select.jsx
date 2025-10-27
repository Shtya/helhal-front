'use client';

import { useEffect, useLayoutEffect, useRef, useState, forwardRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { List } from "react-virtualized";
import InputSearch from './InputSearch';

//options = [{ id: '1', name: 'Option 1' }, { id: '2', name: 'Option 2' }]
const Select = forwardRef(({ isVirtualized, VirtualizeWidth = 300, cnVirtualize, showSearch = false, customSearch, formatSelected, cnMenu, isLoading, options = [], placeholder = 'Select an option', label, cnLabel, onChange, onBlur, className, cnPlaceholder, cnSelect, error = null, required = false, name, value, ...props }, ref) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [touched, setTouched] = useState(false);
  const [internalOptions, setOptions] = useState(options);

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // allow parent to pass ref to button if needed
  const mergedButtonRef = node => {
    buttonRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  // Sync selected label from `value`
  useEffect(() => {
    if (value == null) {
      setSelected(null);
      return;
    }
    const found = options.find(o => String(o.id) === String(value));

    setSelected(found ? found : null);
  }, [value, options]);

  // Close on outside click / ESC, and mark touched once
  useEffect(() => {
    const onDocClick = e => {
      if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) {
        return;
      }
      if (open) {
        setOptions(options);
        setOpen(false)
      };
      if (!touched) {
        setTouched(true);
        onBlur?.();
      }
    };
    const onKey = e => {
      if (e.key === 'Escape') {
        setOptions(options);
        setOpen(false)
      };
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, touched, onBlur]);

  const handleSelect = option => {
    setSelected(option);
    setOpen(false);
    setOptions(options);
    setTouched(true);
    onChange?.(option);
    onBlur?.();
  };

  const handleButtonClick = () => {
    setOpen(v => !v);
    if (!touched) {
      setTouched(true);
      onBlur?.();
    }
  };

  const getBorderClass = () => {
    if (error) return 'border-red-500 ring-2 ring-red-500/20';
    if (selected || open) return 'border-emerald-600';
    return 'border-gray-300';
  };

  // --- Portal positioning state ---
  const [menuStyle, setMenuStyle] = useState({
    top: 0,
    left: 0,
    minWidth: 0,
    transformOrigin: 'top left',
    maxHeight: 303,
  });

  // Compute and clamp position to viewport; flip above if not enough space
  const computePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 8; // gap between button & menu
    // const menuHeight = menurect. 303; // matches Tailwind max-h
    const rawMenuHeight = menuRef?.current?.getBoundingClientRect()?.height;
    const menuHeight = rawMenuHeight ? rawMenuHeight + 10 : 303;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + margin;
    let transformOrigin = 'top left';

    // If not enough space below, open upward
    if (rect.bottom + margin + menuHeight > vh && rect.top - margin - menuHeight > 0) {
      top = rect.top - margin - menuHeight;
      transformOrigin = 'bottom left';
    }

    // Keep within viewport horizontally
    let left = rect.left;
    const minWidth = rect.width;
    const rightOverflow = left + minWidth > vw ? left + minWidth - vw + 8 : 0;
    if (rightOverflow > 0) left = Math.max(8, left - rightOverflow);

    setMenuStyle({
      top: Math.max(8, top) + window.scrollY,
      left: Math.max(8, left) + window.scrollX,
      minWidth,
      transformOrigin,
      // maxHeight: Math.min(menuHeight, vh - 24), // prevent giant menu off-screen
    });
  };



  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const onScrollOrResize = () => computePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, internalOptions?.length]);

  const rowRenderer = ({ index, key, style }) => {
    const opt = internalOptions[index];
    return (
      <li style={style} key={opt.id} onClick={() => handleSelect(opt)} className={`cursor-pointer px-4 py-2 text-sm transition ${selected?.id === opt.id ? 'gradient !text-white' : 'hover:bg-gradient-to-r from-emerald-500 to-emerald-400  hover:text-white'}`}>
        {opt.name}
      </li>
    )
  };


  function onFilter(term) {
    if (!term) {
      setOptions(options);
      return
    }

    const filtered = customSearch ? customSearch(term) : options.filter(opt => opt.name.toLowerCase().includes(term.toLowerCase()));

    setOptions(filtered);


  }
  // The dropdown menu rendered in a portal to escape overflow clipping
  const menu = open
    ? createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'absolute',
          top: menuStyle.top,
          left: menuStyle.left,
          minWidth: menuStyle.minWidth,
          zIndex: 9999,
        }}>
        {showSearch && <InputSearch showAction={false} className='menu-search' onChange={onFilter} />}
        <div
          className={`${cnMenu || ''} overflow-auto ${showSearch ? 'rounded-b-md' : 'rounded-md'} border border-gray-200 bg-white shadow-lg transition-all duration-150 ease-out origin-top-left max-h-[350px]`}
          style={{
            transformOrigin: menuStyle.transformOrigin,
            maxHeight: menuStyle.maxHeight,
          }}>
          {isLoading ? (
            <div className='p-3 space-y-2'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='h-4 bg-slate-200 rounded animate-pulse w-3/4' />
              ))}
            </div>)
            : internalOptions.length === 0 ? (
              <div className='p-4 text-sm text-gray-500 text-center'>
                No options available.
              </div>
            )
              : isVirtualized ? (

                <List
                  width={VirtualizeWidth || 300}
                  className={cnVirtualize || ''}
                  height={Math.min(internalOptions.length * 37, 303)}
                  rowCount={internalOptions.length}
                  rowHeight={37}
                  rowRenderer={rowRenderer}
                />

              )
                : (
                  <ul className='divide-y divide-gray-100'>
                    {internalOptions.map(opt => (
                      <li key={opt.id} onClick={() => handleSelect(opt)} className={`cursor-pointer px-4 py-2 text-sm transition ${selected?.id === opt.id ? 'gradient !text-white' : 'hover:bg-gradient-to-r from-emerald-500 to-emerald-400  hover:text-white'}`}>
                        {opt.name}
                      </li>
                    ))}
                  </ul>)}
        </div>
      </div>,
      document.body,
    )
    : null;

  const formated = useMemo(() => formatSelected && selected ? formatSelected(selected) : selected?.name, [selected, formatSelected]);

  return (
    <div className={`${className || ''} w-full`} ref={rootRef}>
      {label && (
        <label className={`${cnLabel || ''} mb-1 block text-sm font-medium text-gray-600`}>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </label>
      )}

      <div className='relative w-full'>
        <button
          type='button'
          ref={mergedButtonRef}
          onClick={handleButtonClick}
          className={`${cnSelect || ''} ${getBorderClass()} h-[40px] cursor-pointer w-full flex items-center justify-between rounded-md border px-4 py-2 text-sm transition
              bg-white text-gray-700 
              hover:bg-gray-50 hover:border-emerald-600/70 
              focus:outline-none focus:ring-2 focus:ring-emerald-600/50`}
          aria-haspopup='listbox'
          aria-expanded={open}
          name={name}
          {...props}>
          <span className={`truncate ${cnPlaceholder || ''} ${selected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{formated || placeholder}</span>
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`} />
        </button>
      </div>

      {error && <p className='text-red-500 text-sm mt-1'>{error}</p>}

      {menu}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
