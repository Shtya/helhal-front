'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Eye, Edit, Trash2, Plus } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api from '@/lib/axios';
import DashboardLayout from '@/components/dashboard/Layout';
import { MetricBadge, Modal, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import ImagePicker from '@/components/atoms/ImagePicker';
import Textarea from '@/components/atoms/Textarea';
import ActionMenuPortal from '@/components/dashboard/Table/ActionMenuPortal';

export default function AdminCategoriesDashboard() {
  const [activeTab, setActiveTab] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [current, setCurrent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'category', label: 'Main Categories' },
    { value: 'subcategory', label: 'Subcategories' },
  ];

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);

      const q = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (debouncedSearch) q.search = debouncedSearch;
      if (activeTab !== 'all') q.type = activeTab; // ✅ send type, not filters

      const res = await api.get('/categories', { params: q });
      const data = res.data;

      // Support both the new paginated shape and a legacy array response
      if (Array.isArray(data)) {
        setRows(data);
        setTotalCount(data.length);
      } else {
        setRows(Array.isArray(data.records) ? data.records : []);
        setTotalCount(Number(data.total ?? 0)); // ✅ use total
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
      setApiError(e?.response?.data?.message || 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

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
    if (id === 'newest') setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'DESC', page: 1 }));
    if (id === 'oldest') setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'ASC', page: 1 }));
    if (id === 'az') setFilters(p => ({ ...p, sortBy: 'name', sortOrder: 'ASC', page: 1 }));
    if (id === 'za') setFilters(p => ({ ...p, sortBy: 'name', sortOrder: 'DESC', page: 1 }));
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

  const openView = async id => {
    try {
      setApiError(null);
      const res = await api.get(`/categories/${id}`);
      setMode('view');
      setCurrent(res.data);
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
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error deleting category (maybe it has related services).');
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
      <button onClick={() => openView(row.id)} className='p-2 text-blue-600 hover:bg-blue-50 rounded-full' title='View'>
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
              <Input iconLeft={<Search size={16} />} className='!w-fit' value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder='Search categories…' />
              <Select
                className='!w-fit'
                onChange={applySortPreset}
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

        <Modal open={modalOpen} title={mode === 'view' ? 'Category Details' : mode === 'edit' ? 'Edit Category' : 'Create Category'} onClose={() => setModalOpen(false)} size='md' hideFooter>
          <CategoryForm mode={mode} value={current} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} submitting={submitting} apiError={apiError} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

function CategoryForm({ mode, value, onChange, onSubmit, onCancel, submitting = false, apiError = null }) {
  const [form, setForm] = useState({
    id: value?.id ?? '',
    name: value?.name ?? '',
    slug: value?.slug ?? '',
    description: value?.description ?? '',
    type: value?.type ?? 'category',
    image: value?.image ?? '',
  });

  useEffect(() => {
    setForm({
      id: value?.id ?? '',
      name: value?.name ?? '',
      slug: value?.slug ?? '',
      description: value?.description ?? '',
      type: value?.type ?? 'category',
      image: value?.image ?? '',
    });
  }, [value]);

  const readOnly = mode === 'view';

  const setField = (k, v) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      onChange?.(next);
      return next;
    });
  };

  const handleNameChange = val => {
    // Auto-update slug only if it was empty or matched the previous auto-slug
    setForm(prev => {
      const shouldAuto = !prev.slug || prev.slug === slugify(prev.name || '');
      const next = {
        ...prev,
        name: val,
        slug: shouldAuto ? slugify(val) : prev.slug,
      };
      onChange?.(next);
      return next;
    });
  };

  const canSubmit = useMemo(() => {
    if (readOnly) return false;
    return form.name.trim().length > 0 && form.slug.trim().length > 0;
  }, [form, readOnly]);

  const submit = async e => {
    e.preventDefault();
    if (!canSubmit || !onSubmit) return; // ✅ correct guard
    await onSubmit(form);
  };

  return (
    <form onSubmit={submit} className='space-y-4'>
      {apiError && <div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{apiError}</div>}

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Type</label>
        <Select
          disabled={readOnly}
          value={form.type}
          onChange={opt => setField('type', opt?.id ?? opt)}
          options={[
            { id: 'category', name: 'Main Category' },
            { id: 'subcategory', name: 'Subcategory' },
          ]}
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Name *</label>
        <Input disabled={readOnly} value={form.name} onChange={e => handleNameChange(e.target?.value)} placeholder='Enter category name' required />
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Slug *</label>
        <Input disabled={readOnly} value={form.slug} onChange={e => setField('slug', e.target?.value)} placeholder='category-slug' required />
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Description</label>
        <Textarea disabled={readOnly} value={form.description} onChange={e => setField('description', e.target.value)} rows={3} />
      </div>

      <ImagePicker value={form.image || ''} onChange={url => setField('image', url)} disabled={readOnly} allowManual />

      {readOnly ? (
        <div className='flex justify-end'>
          <Button color='white' name='Close' onClick={onCancel} className='!w-fit' />
        </div>
      ) : (
        <div className='flex justify-end gap-3'>
          <Button color='secondary' name='Cancel' onClick={onCancel} className='!w-fit' />
          <Button type='submit' color='default' name={submitting ? 'Saving…' : mode === 'edit' ? 'Update Category' : 'Create Category'} disabled={!canSubmit || submitting} className='!w-fit' />
        </div>
      )}
    </form>
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
