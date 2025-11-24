'use client';

import { useEffect, useRef, useState, forwardRef, useMemo } from 'react';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import FormErrorMessage from './FormErrorMessage';

const CategorySelect = forwardRef(({ type = 'category', excludes = [], parentId, value, onChange, allowCreate = true, placeholder, loadingText, label, cnLabel, className, cnPlaceholder, cnSelect, name, required = false, error = null, onBlur, disabled }, ref) => {
  const t = useTranslations('CategorySelect');
  const defaultPlaceholder = placeholder || t('selectOption');
  const defaultLoadingText = loadingText || t('loading');
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);


  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]); // raw API list
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // track which (type,parentId) combos were fetched already
  const fetchedKeysRef = useRef(new Set());

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // merge forwarded ref
  const mergedButtonRef = node => {
    buttonRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const scopeKey = useMemo(() => `${type}:${parentId || 'root'}`, [type, parentId]);

  const selected = useMemo(() => {
    if (!value) return null;
    if (typeof value === 'string') return items.find(o => String(o.id) === value) || null;
    return value;
  }, [value, items]);

  const getBorderClass = () => {
    if (error) return 'border-red-500 ring-2 ring-red-500/20';
    if (selected || open) return 'border-emerald-600';
    return 'border-gray-300';
  };

  // Fetch once per scopeKey (limit=100). No server-side search.
  const fetchCategories = async () => {
    if (type === 'subcategory' && !parentId) {
      setItems([]);
      return;
    }
    if (fetchedKeysRef.current.has(scopeKey)) return; // already fetched for this scope

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('filters[type]', type);
      params.append('limit', '100');
      if (parentId) params.append('filters[parentId]', parentId);

      const res = await api.get(`/categories?${params.toString()}`);
      const records = Array.isArray(res?.data?.records) ? res.data.records : [];
      setItems(records);
      fetchedKeysRef.current.add(scopeKey);
    } catch (e) {
      setItems([]);
      toast.error(e?.response?.data?.message || t('errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Load on first open for that scope
  useEffect(() => {
    if (!open && !value) return;
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value, scopeKey]);

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;

    const onDocClick = e => {
      const t = e.target;
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
      if (!touched) {
        setTouched(true);
        onBlur?.();
      }
    };

    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, touched, onBlur]);

  // Client-side filtered list
  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const excludeIds = new Set(excludes); // assuming excludes is an array of ids

    if (!q && excludeIds.size === 0) return items;

    return items.filter(i => {
      const matchesQuery = !q || (i.name || '').toLowerCase().includes(q);
      const notExcluded = !excludeIds.has(i.id);
      return matchesQuery && notExcluded;
    });
  }, [items, query, excludes]);

  const createIfNotExists = async () => {
    const name = (query || '').trim();
    if (!name) return;
    if (items.some(i => (i.name || '').toLowerCase() === name.toLowerCase())) {
      toast(t('alreadyExists'));
      return;
    }
    setCreating(true);
    try {
      const payload = { name, type };
      if (type === 'subcategory' && parentId) payload.parentId = parentId;

      const res = await api.post('/categories', payload);
      const created = res?.data?.record || res?.data;
      if (!created?.id) throw new Error('Invalid create response');

      setItems(prev => [created, ...prev]);
      onChange?.(created);
      setOpen(false);
      toast.success(t('created', { name: created.name }));
    } catch (e) {
      toast.error(e?.response?.data?.message || t('errors.failedToCreate'));
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = option => {
    onChange?.(option);
    setOpen(false);
    if (!touched) {
      setTouched(true);
      onBlur?.();
    }
  };

  const handleButtonClick = () => {
    setOpen(v => !v);
    if (!touched) {
      setTouched(true);
      onBlur?.();
    }
  };

  const canCreate = allowCreate && query.trim().length > 0 && !items.some(i => (i.name || '').trim().toLowerCase() === query.trim().toLowerCase());

  return (
    <div className={`${className || ''} w-full relative`} ref={rootRef}>
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
          disabled={disabled}
          className={`${cnSelect || ''} ${getBorderClass()} h-[40px] cursor-pointer w-full flex items-center justify-between rounded-md border px-4 py-2 text-sm transition
                bg-white text-gray-700 
                hover:bg-gray-50 hover:border-emerald-600/70 
                focus:outline-none focus:ring-2 focus:ring-emerald-600/50`}
          aria-haspopup='listbox'
          aria-expanded={open}
          name={name}>
          <span className={`truncate ${cnPlaceholder || ''} ${selected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{loading ? defaultLoadingText : selected?.name || defaultPlaceholder}</span>
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`} />
        </button>

        {open && (
          <div ref={menuRef} className='absolute mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg z-50'>
            {/* Search / Create */}
            <div className='p-2 border-b border-gray-200'>
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={t('search', { type })} className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500' />
              {canCreate && filtered?.length === 0 && (
                <button onClick={createIfNotExists} disabled={creating || (type === 'subcategory' && !parentId)} className='mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-60'>
                  {creating ? <Loader2 className='w-4 h-4 animate-spin' /> : <Plus className='w-4 h-4' />}
                  {t('create', { name: query.trim() })}
                </button>
              )}
            </div>

            {/* Options */}
            <div className='max-h-[300px] overflow-auto'>
              {loading ? (
                <div className='p-3 space-y-2'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className='h-4 bg-slate-200 rounded animate-pulse w-3/4' />
                  ))}
                </div>
              ) : filtered?.length === 0 ? (
                <div className='p-3 text-sm text-gray-500'>{t('noFound', { type })}</div>
              ) : (
                <ul className='divide-y divide-gray-100'>
                  {filtered?.map(opt => (
                    <li key={opt.id}>
                      <button onClick={() => handleSelect(opt)} className={`w-full text-left px-4 py-2 text-sm transition ${selected?.id === opt.id ? 'gradient !text-white' : 'hover:bg-gradient-to-r  from-emerald-500 to-emerald-400 hover:text-white'}`}>
                        {opt.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <FormErrorMessage message={error} />}
    </div>
  );
});

CategorySelect.displayName = 'CategorySelect';
export default CategorySelect;
