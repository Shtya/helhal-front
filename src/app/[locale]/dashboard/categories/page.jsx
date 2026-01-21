'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Eye, Edit, Trash2, Plus, ImageIcon, Star } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api from '@/lib/axios';
import { Modal, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import ImagePicker from '@/components/atoms/ImagePicker';
import Textarea from '@/components/atoms/Textarea';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CategorySelect from '@/components/atoms/CategorySelect';
import toast from 'react-hot-toast';
import { isErrorAbort, resolveUrl } from '@/utils/helper';
import SearchBox from '@/components/common/Filters/SearchBox';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { Permissions } from '@/constants/permissions';
import { has } from '@/utils/permissions';
import { FiStar } from 'react-icons/fi';

export default function AdminCategoriesDashboard() {
  const t = useTranslations('Dashboard.categories');
  const [activeTab, setActiveTab] = useState('all');


  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const currentPermissions = currentUser?.permissions;

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [current, setCurrent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = value => {
    setDebouncedSearch(value);
    setFilters(p => ({ ...p, page: 1 }));
  };

  const tabs = [
    { value: 'all', label: t('tabs.all') },
    { value: 'category', label: t('tabs.category') },
    { value: 'subcategory', label: t('tabs.subcategory') },
  ];

  const controllerRef = useRef();
  const fetchCategories = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      setLoading(true);
      setApiError(null);

      const q = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (debouncedSearch?.trim()) q.search = debouncedSearch?.trim();
      if (activeTab !== 'all') q.type = activeTab; // ✅ send type, not filters

      const res = await api.get('/categories', { params: q, signal: controller.signal });
      const data = res.data;

      // Support both the new paginated shape and a legacy array response
      if (Array.isArray(data)) {
        setRows(data);
        setTotalCount(data.length);
      } else {
        setRows(Array.isArray(data.records) ? data.records : []);
        setTotalCount(Number(data.total_records ?? 0)); // ✅ use total
      }
    } catch (e) {
      if (!isErrorAbort(e)) {
        console.error('Error fetching categories:', e);
        setApiError(e?.response?.data?.message || t('error'));
      }
    } finally {
      // Only clear loading if THIS request is still the active one
      if (controllerRef.current === controller)
        setLoading(false);
    }
  }, [activeTab, debouncedSearch?.trim(), filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleTabChange = tab => {
    const v = typeof tab === 'string' ? tab : tab?.value;
    setActiveTab(v);
    setFilters(p => ({ ...p, page: 1 }));
  };

  const applySortPreset = opt => {
    const id = opt?.id ?? opt?.target?.value ?? opt;
    if (id === 'newest') { setSort(id); setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'DESC', page: 1 })) }
    else if (id === 'oldest') { setSort(id); setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'ASC', page: 1 })) }
    else if (id === 'az') { setSort(id); setFilters(p => ({ ...p, sortBy: 'name', sortOrder: 'ASC', page: 1 })) }
    else if (id === 'za') { setSort(id); setFilters(p => ({ ...p, sortBy: 'name', sortOrder: 'DESC', page: 1 })) }
    else if (id === 'top') { setSort(id); setFilters(p => ({ ...p, sortBy: 'top', sortOrder: 'DESC', page: 1 })) }
    else if (id === 'freelanceTop') { setSort(id); setFilters(p => ({ ...p, sortBy: 'freelanceTop', sortOrder: 'DESC', page: 1 })) }
    else return;
  };

  const openCreate = () => {
    setMode('create');
    setCurrent({
      name: '',
      slug: '',
      description: '',
      type: activeTab === 'all' ? 'category' : activeTab,
      image: '',
    });
    setModalOpen(true);
  };

  const openView = async row => {
    try {
      setApiError(null);
      // const res = await api.get(`/categories/${id}`);
      setMode('view');
      setCurrent(row);
      setModalOpen(true);
    } catch (e) {
      setApiError(e?.response?.data?.message || t('error'));
    }
  };

  const openEdit = row => {
    setMode('edit');
    setCurrent(row);
    setModalOpen(true);
  };

  const onSubmit = async payload => {
    try {
      setSubmitting(true);
      setApiError(null);

      if (mode === 'edit' && current?.id) {
        await api.put(`/categories/${current.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }

      setModalOpen(false);
      await fetchCategories();
    } catch (e) {
      setApiError(e?.response?.data?.message || t('error'));
    } finally {
      setSubmitting(false);
    }
  };
  function openPopularModel(popularMode, current) {
    setModalOpen(true)
    setMode(popularMode)
    setCurrent(current)
  }


  async function handleSaveTop() {
    await fetchCategories();
    setModalOpen(false);
  }

  const onDelete = async id => {
    if (!confirm(t('deleteConfirm'))) return;

    const toastId = toast.loading(t('deleting'));

    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();

      toast.success(t('deleted'), { id: toastId });
    } catch (e) {
      toast.error(e?.response?.data?.message || t('deleteError'), {
        id: toastId,
      });
      console.error('Delete error:', e);
    }
  };

  // Columns: use table’s native types instead of render functions
  const columns = [
    { key: 'image', label: 'Image', type: 'img' },
    { key: 'name_en', label: 'Name (English)' },
    { key: 'name_ar', label: 'Name (Arabic)' },
    { key: 'slug', label: 'Slug' },
    {
      key: 'type',
      label: 'Type',
      status: [
        ['category', 'inline-flex items-center gap-1 text-sky-700 bg-sky-100 px-2 py-1 rounded-full text-xs'],
        ['subcategory', 'inline-flex items-center gap-1 text-violet-700 bg-violet-100 px-2 py-1 rounded-full text-xs'],
      ],
    },
    { key: 'created_at', label: 'Created', type: 'date' },
  ];
  const Actions = ({ row }) => {
    const isTop = row.top;
    const isFreelanceTop = row.freelanceTop;


    const canEdit = isAdmin || has(currentPermissions?.['categories'], Permissions.Categories.Edit)
    const canDelete = isAdmin || has(currentPermissions?.['categories'], Permissions.Categories.Delete)
    const canToggleTop = isAdmin || has(currentPermissions?.['categories'], Permissions.Categories.TopToggle)

    return (
      <div className='flex items-center gap-2'>
        <button onClick={() => openView(row)} className='p-2 text-blue-600 hover:bg-blue-50 rounded-full' title={t('actions.view')}>
          <Eye size={16} />
        </button>
        {canEdit && <button onClick={() => openEdit(row)} className='p-2 text-main-600 hover:bg-main-50 rounded-full' title={t('actions.edit')}>
          <Edit size={16} />
        </button>}
        {canDelete && <button onClick={() => onDelete(row.id)} className='p-2 text-red-600 hover:bg-red-50 rounded-full' title={t('actions.delete')}>
          <Trash2 size={16} />
        </button>}
        {canToggleTop && <button
          onClick={() => openPopularModel(isTop ? 'edit-top' : 'mark-top', row)}
          className={`p-2 rounded-full ${isTop ? 'text-yellow-600 hover:bg-yellow-50' : 'text-slate-500 hover:bg-slate-100'}`}
          title={isTop ? t('actions.unmarkTop') : t('actions.markTop')}
        >
          <Star size={16} fill={isTop ? 'currentColor' : 'none'} />
        </button>}
        {/* Top خاص بالـFreelance */}
        {/* {canToggleTop && (
          <button
            onClick={() => openPopularModel(isFreelanceTop ? 'edit-freelance-top' : 'mark-freelance-top', row)}
            className={`p-2 rounded-full ${isFreelanceTop ? 'text-teal-600 hover:bg-teal-50' : 'text-slate-500 hover:bg-slate-100'}`}
            title={isFreelanceTop ? t('actions.unmarkFreelanceTop') : t('actions.markFreelanceTop')}
          >
            <FiStar size={16} />
          </button>
        )} */}
      </div>
    );
  };

  const canAdd = isAdmin || has(currentPermissions?.['categories'], Permissions.Categories.Add)
  return (
    <div>
      <div className='p-6'>
        <GlassCard gradient='from-sky-400 via-blue-400 to-indigo-400' className='mb-6 !overflow-visible'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
            <div className='flex flex-wrap items-center gap-3'>
              {/* Make Input accept ReactNode OR pass URL here */}
              <SearchBox placeholder={t('searchPlaceholder')} onSearch={handleSearch} />
              <Select
                className='!w-fit'
                onChange={applySortPreset}
                value={sort}
                placeholder={t('orderBy')}
                options={[
                  { id: 'newest', name: t('sortOptions.newest') },
                  { id: 'oldest', name: t('sortOptions.oldest') },
                  { id: 'az', name: t('sortOptions.az') },
                  { id: 'za', name: t('sortOptions.za') },
                  { id: 'top', name: t('sortOptions.top') },
                  { id: 'freelanceTop', name: t('sortOptions.freelanceTop') }
                ]}
              />
              {canAdd && <Button name={t('addCategory')} onClick={openCreate} className='!w-fit' leftIcon={<Plus size={16} />} />}
            </div>
          </div>
        </GlassCard>

        {apiError && <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'>{apiError}</div>}

        <div className='bg-white border border-slate-200 card-glow rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden'>
          <Table data={rows} columns={columns} Actions={Actions} loading={loading} rowsPerPage={filters.limit} page={filters.page} totalCount={totalCount} onPageChange={p => setFilters(prev => ({ ...prev, page: p }))} />
        </div>

        <Modal
          open={modalOpen && (mode === 'view' || mode === 'edit' || mode === 'create')}
          title={mode === 'view' ? t('modal.viewTitle') : mode === 'edit' ? t('modal.editTitle', { name: current?.name }) : t('modal.createTitle')}
          onClose={() => setModalOpen(false)}
          size='md'
          hideFooter
        >
          <CategoryForm
            mode={mode}
            value={current}
            onSubmit={onSubmit}
            onCancel={() => setModalOpen(false)}
            submitting={submitting}
            apiError={apiError}
          />
        </Modal>

        <Modal
          open={modalOpen && (mode === 'edit-top' || mode === 'mark-top' || mode === 'edit-freelance-top' || mode === 'mark-freelance-top')}
          title={
            mode === 'edit-top' ? t('modal.editTopTitle') :
              mode === 'mark-top' ? t('modal.markTopTitle') :
                mode === 'edit-freelance-top' ? t('modal.editFreelanceTopTitle') :
                  t('modal.markFreelanceTopTitle')
          }
          onClose={() => setModalOpen(false)}
          size='md'
          hideFooter
        >
          <TopCategoryForm
            mode={mode}
            category={current}
            onCancel={() => setModalOpen(false)}
            onSaved={handleSaveTop}
          />
        </Modal>


      </div>
    </div>
  );
}

const getSchema = (t) => z.object({
  name_ar: z
    .string()
    .min(1, t('validation.nameRequired'))
    .max(70, t('validation.nameMax')),
  name_en: z
    .string()
    .min(1, t('validation.nameRequired'))
    .max(70, t('validation.nameMax')),

  slug: z
    .string()
    .min(1, t('validation.slugRequired'))
    .max(70, t('validation.slugMax'))
    .regex(/^[a-zA-Z0-9-_]+$/, t('validation.slugInvalid')),

  description: z
    .string()
    .max(300, t('validation.descriptionMax'))
    .optional(),

  type: z.enum(['category', 'subcategory']),
  parentId: z.string().optional(),

  image: z
    .url(t('validation.imageInvalid'))
    .or(z.literal(''))
    .optional(),
}).refine(data => data.type === 'category' || !!data.parentId, {
  message: t('validation.parentRequired'),
  path: ['parentId'],
});;


function CategoryForm({ mode, value, onChange, onSubmit, onCancel, submitting = false, apiError = null }) {
  const t = useTranslations('Dashboard.categories');
  const readOnly = mode === 'view';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(getSchema(t)),
    defaultValues: {
      name_en: value?.name_en ?? '',
      name_ar: value?.name_ar ?? '',
      slug: value?.slug ?? '',
      description: value?.description ?? '',
      type: value?.type ?? 'category',
      image: value?.image ?? '',
      parentId: value?.parentId ?? '',
    },
  });

  const name_en = watch('name_en');
  const slug = watch('slug');
  const type = watch('type');

  // Auto-update slug when name changes
  useEffect(() => {
    const autoSlug = slugify(name_en || '');
    if (!slug || slug === slugify(value?.name_en || '')) {
      setValue('slug', autoSlug);
    }
  }, [name_en]);

  const submit = data => {
    if (readOnly || submitting) return;
    onSubmit?.(data);
  };


  return (
    <div className="space-y-4">
      {apiError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {apiError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('modal.type')}</label>
        <Select
          disabled={readOnly}
          value={watch('type')}
          onChange={opt => setValue('type', opt?.id ?? 'category')}
          options={[
            { id: 'category', name: t('modal.mainCategory') },
            { id: 'subcategory', name: t('modal.subcategory') },
          ]}
          error={errors.type?.message}
        />
      </div>

      {type === 'subcategory' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('modal.parentCategory')}</label>
          <CategorySelect
            value={watch('parentId')}
            excludes={[value?.id]}
            disabled={readOnly}
            onChange={cat => { setValue('parentId', cat?.id) }}
            error={errors.parentId?.message}
          />
        </div>
      )}


      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('modal.nameEn')}</label>
        <Input
          disabled={readOnly}
          placeholder={t('modal.nameEnPlaceholder')}
          {...register('name_en')}
          error={errors.name_en?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('modal.nameAr')}</label>
        <Input
          disabled={readOnly}
          placeholder={t('modal.nameArPlaceholder')}
          {...register('name_ar')}
          error={errors.name_ar?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('modal.slug')}</label>
        <Input
          disabled={readOnly}
          placeholder={t('modal.slugPlaceholder')}
          {...register('slug')}
          error={errors.slug?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('modal.description')}</label>
        <Textarea
          disabled={readOnly}
          placeholder={t('modal.desPlaceholder')}
          rows={3}
          {...register('description')}
          error={errors.description?.message}
        />
      </div>

      <div className={`${!readOnly && "!mb-0"}`}>

        <ImagePicker
          value={watch('image')}
          onChange={url => setValue('image', url)}
          disabled={readOnly}
          allowManual
        />
      </div>

      {readOnly ? (
        <div className="flex justify-end">
          <Button color="white" name={t('modal.close')} onClick={onCancel} className="!w-fit" />
        </div>
      ) : (
        <div className="flex justify-end gap-3">
          <Button color="secondary" name={t('modal.cancel')} onClick={onCancel} className="!w-fit" />
          <Button
            type="button"
            color="green"
            onClick={handleSubmit(submit)}
            name={submitting ? t('modal.saving') : mode === 'edit' ? t('modal.updateCategory') : t('modal.createCategory')}
            disabled={submitting}
            className="!w-fit"
          />
        </div>
      )}
    </div>
  );
}

function slugify(v) {
  return (v || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}


function TopCategoryForm({ mode, category, onCancel, onSaved }) {
  const t = useTranslations('Dashboard.categories');
  const [file, setFile] = useState(null);
  const [iconUrl, setIconUrl] = useState(mode?.includes('freelance') ? category?.freelanceTopIconUrl || '' : category?.topIconUrl || '');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const categoryId = category.id;
  const top = mode?.includes('freelance') ? category.freelanceTop : category.top;
  const apiUrl = mode?.includes('freelance')
    ? top
      ? `/categories/${categoryId}/freelance-top/icon`
      : `/categories/${categoryId}/freelance-top`
    : top
      ? `/categories/${categoryId}/top/icon`
      : `/categories/${categoryId}/top`;

  const removeUrl = mode?.includes('freelance')
    ? `/categories/${categoryId}/freelance-untop`
    : `/categories/${categoryId}/untop`;

  const handleFileChange = f => {
    if (!f) return;
    setFile(f);
    setIconUrl(URL.createObjectURL(f));
  };

  const saveIcon = async () => {
    if (!file) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('icon', file);

      const res = await api.post(apiUrl, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = res?.data?.topIconUrl;
      toast.success(t('toast.iconUpdated'));
      onSaved?.(url);
    } catch (e) {
      const msg = e?.response?.data?.message || t('toast.iconUpdateFailed');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeTop = async () => {
    try {
      setRemoving(true);
      await api.delete(removeUrl);
      toast.success(t('toast.removedFromTop'));
      onSaved?.(null);
    } catch (e) {
      const msg = e?.response?.data?.message || t('toast.removeTopFailed');
      toast.error(msg);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-3'>
        <label className='relative inline-flex items-center justify-center h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 cursor-pointer'>
          <input
            type='file'
            accept='image/*'
            className='absolute inset-0 opacity-0 cursor-pointer'
            onChange={e => handleFileChange(e.target.files?.[0])}
          />
          <span className='inline-flex items-center'>
            <ImageIcon size={16} className='mr-2' /> {t('modal.chooseIcon')}
          </span>
        </label>

        {iconUrl ? (
          <img
            src={iconUrl.startsWith('blob:') ? iconUrl : resolveUrl(iconUrl)}
            alt='Top icon'
            className='h-10 w-10 rounded-lg border border-slate-200 object-contain'
          />
        ) : (
          <div className='grid h-10 w-10 place-items-center rounded-lg border border-dashed border-slate-300 text-slate-400'>
            <ImageIcon size={16} />
          </div>
        )}
      </div>

      <p className='text-xs text-slate-500'>{t('modal.chooseFileHint')}</p>

      <div className='flex justify-end gap-3 border-t pt-4'>
        <Button name={t('modal.cancel')} type='button' color='secondary' onClick={onCancel} className='!w-fit'>
          {t('modal.cancel')}
        </Button>

        <Button name={saving ? t('modal.saving') : t('modal.saveIcon')} type='button' color='green' onClick={saveIcon} disabled={saving || !file} className='!w-fit'>
          {saving ? t('modal.saving') : t('modal.saveIcon')}
        </Button>

        {top && (
          <Button name={removing ? t('modal.removing') : t('modal.unmarkTop')} type='button' color='red' onClick={removeTop} disabled={removing} className='!w-fit'>
            {removing ? t('modal.removing') : t('modal.unmarkTop')}
          </Button>
        )}
      </div>
    </div>
  );
}
