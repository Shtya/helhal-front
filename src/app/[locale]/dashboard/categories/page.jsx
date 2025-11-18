'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Eye, Edit, Trash2, Plus } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api from '@/lib/axios';
import DashboardLayout from '@/components/dashboard/Layout';
import { Modal, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import ImagePicker from '@/components/atoms/ImagePicker';
import Textarea from '@/components/atoms/Textarea';
import { useDebounce } from '@/hooks/useDebounce';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CategorySelect from '@/components/atoms/CategorySelect';
import toast from 'react-hot-toast';
import { isErrorAbort } from '@/utils/helper';
import SearchBox from '@/components/common/Filters/SearchBox';

export default function AdminCategoriesDashboard() {
  const [activeTab, setActiveTab] = useState('all');


  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('newest');

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
    { value: 'all', label: 'All' },
    { value: 'category', label: 'Main Categories' },
    { value: 'subcategory', label: 'Subcategories' },
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
        setApiError(e?.response?.data?.message || 'Failed to fetch categories.');
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
      setApiError(e?.response?.data?.message || 'Failed to load category.');
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
      setApiError(e?.response?.data?.message || 'Could not save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async id => {
    if (!confirm('Delete this category? This cannot be undone.')) return;

    const toastId = toast.loading('Deleting category…');

    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();

      toast.success('Category deleted successfully.', { id: toastId });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error deleting category (maybe it has related services).', {
        id: toastId,
      });
      console.error('Delete error:', e);
    }
  };

  // Columns: use table’s native types instead of render functions
  const columns = [
    { key: 'image', label: 'Image', type: 'img' },
    { key: 'name', label: 'Name' },
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

  const Actions = ({ row }) => (
    <div className='flex items-center gap-2'>
      <button onClick={() => openView(row)} className='p-2 text-blue-600 hover:bg-blue-50 rounded-full' title='View'>
        <Eye size={16} />
      </button>
      <button onClick={() => openEdit(row)} className='p-2 text-emerald-600 hover:bg-emerald-50 rounded-full' title='Edit'>
        <Edit size={16} />
      </button>
      <button onClick={() => onDelete(row.id)} className='p-2 text-red-600 hover:bg-red-50 rounded-full' title='Delete'>
        <Trash2 size={16} />
      </button>
    </div>

  );

  return (
    <DashboardLayout className='min-h-screen bg-gradient-to-b from-white via-slate-50 to-white'>
      <div className='p-6'>
        <GlassCard gradient='from-sky-400 via-blue-400 to-indigo-400' className='mb-6 !overflow-visible'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
            <div className='flex flex-wrap items-center gap-3'>
              {/* Make Input accept ReactNode OR pass URL here */}
              <SearchBox placeholder='Search categories…' onSearch={handleSearch} />
              <Select
                className='!w-fit'
                onChange={applySortPreset}
                value={sort}
                placeholder='Order by'
                options={[
                  { id: 'newest', name: 'Newest' },
                  { id: 'oldest', name: 'Oldest' },
                  { id: 'az', name: 'A–Z' },
                  { id: 'za', name: 'Z–A' },
                ]}
              />
              <Button name='Add Category' onClick={openCreate} className='!w-fit' leftIcon={<Plus size={16} />} />
            </div>
          </div>
        </GlassCard>

        {apiError && <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'>{apiError}</div>}

        <div className='bg-white border border-slate-200 card-glow rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden'>
          <Table data={rows} columns={columns} Actions={Actions} loading={loading} rowsPerPage={filters.limit} page={filters.page} totalCount={totalCount} onPageChange={p => setFilters(prev => ({ ...prev, page: p }))} />
        </div>

        <Modal open={modalOpen} title={mode === 'view' ? 'Category Details' : mode === 'edit' ? `Edit Category (${current?.name})` : 'Create Category'} onClose={() => setModalOpen(false)} size='md' hideFooter>
          <CategoryForm mode={mode} value={current} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} submitting={submitting} apiError={apiError} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

const schema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(70, 'Name must be at most 70 characters'),

  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(70, 'Slug must be at most 70 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores'),

  description: z
    .string()
    .max(300, 'Description must be at most 300 characters')
    .optional(),

  type: z.enum(['category', 'subcategory']),
  parentId: z.string().optional(),

  image: z
    .url('Invalid URL')
    .or(z.literal(''))
    .optional(),

  iconUrl: z
    .url('Invalid URL')
    .or(z.literal(''))
    .optional(),
}).refine(data => data.type === 'category' || !!data.parentId, {
  message: 'Parent category is required for subcategories',
  path: ['parentId'],
});;


function CategoryForm({ mode, value, onChange, onSubmit, onCancel, submitting = false, apiError = null }) {
  const readOnly = mode === 'view';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: value?.name ?? '',
      slug: value?.slug ?? '',
      description: value?.description ?? '',
      type: value?.type ?? 'category',
      image: value?.image ?? '',
      iconUrl: value?.iconUrl ?? '',
      parentId: value?.parentId ?? '',
    },
  });

  const name = watch('name');
  const slug = watch('slug');
  const type = watch('type');

  // Auto-update slug when name changes
  useEffect(() => {
    const autoSlug = slugify(name || '');
    if (!slug || slug === slugify(value?.name || '')) {
      setValue('slug', autoSlug);
    }
  }, [name]);

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
        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
        <Select
          disabled={readOnly}
          value={watch('type')}
          onChange={opt => setValue('type', opt?.id ?? 'category')}
          options={[
            { id: 'category', name: 'Main Category' },
            { id: 'subcategory', name: 'Subcategory' },
          ]}
          error={errors.type?.message}
        />
      </div>

      {type === 'subcategory' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category *</label>
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
        <Input
          disabled={readOnly}
          placeholder="Enter category name"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Slug *</label>
        <Input
          disabled={readOnly}
          placeholder="category-slug"
          {...register('slug')}
          error={errors.slug?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <Textarea
          disabled={readOnly}
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

      <ImagePicker
        value={watch('iconUrl')}
        label="Icon"
        onChange={url => setValue('iconUrl', url)}
        disabled={readOnly}
        allowManual
      />

      {readOnly ? (
        <div className="flex justify-end">
          <Button color="white" name="Close" onClick={onCancel} className="!w-fit" />
        </div>
      ) : (
        <div className="flex justify-end gap-3">
          <Button color="secondary" name="Cancel" onClick={onCancel} className="!w-fit" />
          <Button
            type="button"
            color="green"
            onClick={handleSubmit(submit)}
            name={submitting ? 'Saving…' : mode === 'edit' ? 'Update Category' : 'Create Category'}
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
