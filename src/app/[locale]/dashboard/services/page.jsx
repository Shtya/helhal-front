'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Eye, Trash2, Plus, Folder, Star, ImageIcon, RefreshCw } from 'lucide-react';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/dashboard/Table/Table';
import api from '@/lib/axios';
import { MetricBadge, Modal, KPIGrid, GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Img from '@/components/atoms/Img';
import ImagePicker from '@/components/atoms/ImagePicker';
import Textarea from '@/components/atoms/Textarea';
import toast from 'react-hot-toast';
import { Link } from '@/i18n/navigation';
import SearchBox from '@/components/common/Filters/SearchBox';
import { resolveUrl } from '@/utils/helper';

export default function AdminServicesDashboard() {
  const [activeTab, setActiveTab] = useState('all');


  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    status: 'all',
    valueSort: 'newest',
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
    { value: 'all', label: 'All Services' },
    { value: 'Active', label: 'Active' },
    { value: 'Draft', label: 'Drafts' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Paused', label: 'Paused' },
  ];

  const controllerRef = useRef();
  const fetchServices = useCallback(async () => {

    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setApiError(null);

      // Build query
      const q = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        valueSort: filters.valueSort,
        sortOrder: filters.sortOrder,
        status: activeTab === 'all' ? '' : activeTab,
        search: debouncedSearch,
      };

      const res = await api.get('/services/admin', { params: q, signal: controller.signal });

      const data = res.data || {};
      setRows(Array.isArray(data.records) ? data.records : []);
      setTotalCount(Number(data.total_records || 0));
    } catch (e) {
      if (!isErrorAbort(e)) {

        console.error('Error fetching services:', e);
        setApiError(e?.response?.data?.message || 'Failed to fetch services.');
      }
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  }, [activeTab, debouncedSearch, filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleTabChange = tab => {
    const v = typeof tab === 'string' ? tab : tab?.value;
    setActiveTab(v);
    setFilters(p => ({ ...p, page: 1 }));
  };

  const applySortPreset = opt => {
    const id = opt?.id ?? opt?.target?.value ?? opt;
    if (id === 'newest') setFilters(p => ({ ...p, valueSort: opt.id, sortBy: 'created_at', sortOrder: 'DESC', page: 1 }));
    if (id === 'oldest') setFilters(p => ({ ...p, valueSort: opt.id, sortBy: 'created_at', sortOrder: 'ASC', page: 1 }));
    if (id === 'az') setFilters(p => ({ ...p, valueSort: opt.id, sortBy: 'title', sortOrder: 'ASC', page: 1 }));
    if (id === 'za') setFilters(p => ({ ...p, valueSort: opt.id, sortBy: 'title', sortOrder: 'DESC', page: 1 }));
    if (id === 'mostOrdered') setFilters(p => ({ ...p, valueSort: opt.id, sortBy: 'ordersCount', sortOrder: 'DESC', page: 1 }));
    if (id === 'popular') setFilters(p => ({ ...p, valueSort: opt.id, sortBy: 'popular', sortOrder: 'DESC', page: 1 }));
  };

  const onSubmit = async payload => {
    try {
      setSubmitting(true);
      setApiError(null);

      if (mode === 'edit' && current?.id) {
        await api.put(`/services/${current.id}`, payload);
      } else {
        await api.post('/services', payload);
      }

      setModalOpen(false);
      await fetchServices();
    } catch (e) {
      setApiError(e?.response?.data?.message || 'Could not save service.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    const toastId = toast.loading('Updating service status...');

    try {
      await api.put(`/services/${id}/status`, { status: status.id });
      await fetchServices();

      toast.success('Service status updated successfully!', { id: toastId });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error updating service status.', { id: toastId });
    }
  };

  function openPopularModel(popularMode, current) {
    setModalOpen(true)
    setMode(popularMode)
    setCurrent(current)
  }

  async function handelSavePopular() {
    await fetchServices();
    setModalOpen(false);
  }

  // Columns
  const columns = [
    {
      key: 'gallery',
      label: 'Image',
      render: v =>
        v.gallery && v.gallery.length > 0 ? (
          <Img src={v.gallery[0].url} alt='Service' className='w-10 h-10 rounded-md object-cover' />
        ) : (
          <div className='w-10 h-10 rounded-md bg-slate-200 flex items-center justify-center'>
            <Folder size={16} className='text-slate-400' />
          </div>
        ),
    },
    {
      key: 'title',
      label: 'Title',
      render: v => (
        <span
          className="max-w-[200px] truncate block"
          title={v.title}
        >
          {v.title}
        </span>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: v => (
        <span
          className="max-w-[200px] truncate block"
          title={v.slug}
        >
          {v.slug}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: v => {
        const statusColors = {
          Active: 'success',
          Draft: 'neutral',
          Pending: 'warning',
          Paused: 'secondary',
          Denied: 'danger',
        };
        return <MetricBadge tone={statusColors[v.status] || 'neutral'}>{v.status}</MetricBadge>;
      },
    },
    {
      key: 'seller',
      label: 'Seller',
      render: v => v.seller?.username || 'N/A',
    },
    {
      key: 'performance',
      label: 'Performance',
      render: v => (
        <div className='flex gap-2'>
          <span className='text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full' title='Clicks'>
            {v.clicks || 0} clicks
          </span>
          <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full' title='Orders'>
            {v.ordersCount || 0} orders
          </span>
        </div>
      ),
    },
    { key: 'created_at', label: 'Created', type: 'date' },
  ];


  const Actions = ({ row }) => {
    const isPopular = row.popular;

    return (<div className='flex items-center gap-2'>
      <Link href={`/services/category/${row.slug}`} className='p-2 text-blue-600 hover:bg-blue-50 rounded-full' title='View'>
        <Eye size={16} />
      </Link>
      <Select
        value={row.status}
        onChange={e => {
          if (row.status !== e.id)
            updateStatus(row.id, e)
        }
        }
        options={[
          { id: 'Pending', name: 'Pending' },
          { id: 'Active', name: 'Activate' },
          { id: 'Paused', name: 'Pause' },
          { id: 'Draft', name: 'Set to Draft' },
        ]}
        className='!w-32 !text-xs'
        variant='minimal'
      />
      <button
        onClick={() => openPopularModel(isPopular ? 'edit-popular' : 'mark-popular', row)}
        className={`p-2 rounded-full ${isPopular
          ? 'text-yellow-600 hover:bg-yellow-50'
          : 'text-slate-500 hover:bg-slate-100'
          }`}
        title={isPopular ? 'Unmark as Popular' : 'Mark as Popular'}
      >
        <Star size={16} fill={isPopular ? 'currentColor' : 'none'} />
      </button>
    </div>)
  }

  return (
    <div>
      <div className='p-6'>
        <GlassCard gradient='from-indigo-400 via-purple-400 to-pink-400' className='mb-6 !overflow-visible'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
            <div className='flex  items-center gap-3'>
              <SearchBox placeholder='Search services…' onSearch={(val) => {
                setDebouncedSearch(val)
                setFilters(p => ({ ...p, page: 1 }))
              }} />

              <Select
                className='!w-fit'
                onChange={applySortPreset}
                placeholder='Order by'
                value={filters.valueSort}
                options={[
                  { id: 'newest', name: 'Newest' },
                  { id: 'oldest', name: 'Oldest' },
                  { id: 'az', name: 'A–Z' },
                  { id: 'za', name: 'Z–A' },
                  { id: 'mostOrdered', name: 'Most Ordered' },
                  { id: 'popular', name: 'Most Popular' },
                ]}
              />
            </div>
          </div>
        </GlassCard>

        {apiError && <div className='mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'>{apiError}</div>}

        <div className='bg-white border border-slate-200 card-glow rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden'>
          <Table data={rows} columns={columns} Actions={Actions} loading={loading} rowsPerPage={filters.limit} page={filters.page} totalCount={totalCount} onPageChange={p => setFilters(prev => ({ ...prev, page: p }))} />
        </div>

        <Modal open={modalOpen && (mode === 'view' || mode === 'edit' || mode === 'create')} title={mode === 'view' ? 'Service Details' : mode === 'edit' ? 'Edit Service' : 'Create Service'} onClose={() => setModalOpen(false)} size='lg' hideFooter>
          <ServiceForm mode={mode} value={current} onSubmit={onSubmit} onCancel={() => setModalOpen(false)} submitting={submitting} apiError={apiError} />
        </Modal>

        <Modal
          open={modalOpen && (mode === "edit-popular" || mode === "mark-popular")}
          title={mode === "edit-popular" ? "Edit Popular Icon" : "Mark as Popular"}
          onClose={() => setModalOpen(false)}
          size="md"
          hideFooter
        >
          <PopularForm
            mode={mode}
            service={current}
            onCancel={() => setModalOpen(false)}
            onSaved={handelSavePopular}
          />
        </Modal>

      </div>
    </div>
  );
}



function ServiceForm({ mode, value, onChange, onSubmit, onCancel, submitting = false, apiError = null }) {
  const [form, setForm] = useState({
    id: value?.id,
    title: value?.title || '',
    slug: value?.slug || '',
    brief: value?.brief || '',
    description: value?.description || '',
    categoryId: value?.categoryId || '',
    subcategoryId: value?.subcategoryId || '',
    status: value?.status || 'Draft',
    packages: value?.packages || [
      {
        type: 'Basic',
        title: 'Basic Package',
        price: 0,
        description: '',
        revisions: 1,
        deliveryTime: 3,
        features: [],
      },
    ],
    searchTags: value?.searchTags || [],
    gallery: value?.gallery || [],
    faq: value?.faq || [],
    fastDelivery: value?.fastDelivery || false,
    additionalRevision: value?.additionalRevision || false,
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    setForm({
      id: value?.id,
      title: value?.title || '',
      slug: value?.slug || '',
      brief: value?.brief || '',
      description: value?.description || '',
      categoryId: value?.categoryId || '',
      subcategoryId: value?.subcategoryId || '',
      status: value?.status || 'Draft',
      packages: value?.packages || [
        {
          type: 'Basic',
          title: 'Basic Package',
          price: 0,
          description: '',
          revisions: 1,
          deliveryTime: 3,
          features: [],
        },
      ],
      searchTags: value?.searchTags || [],
      gallery: value?.gallery || [],
      faq: value?.faq || [],
      fastDelivery: value?.fastDelivery || false,
      additionalRevision: value?.additionalRevision || false,
    });

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories', { params: { type: 'category' } });
        setCategories(res.data.records || []);
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
    };

    fetchCategories();
  }, [value]);

  useEffect(() => {
    // Fetch subcategories when category changes
    const fetchSubcategories = async () => {
      if (form.categoryId) {
        try {
          const res = await api.get('/categories', {
            params: { type: 'subcategory', parentId: form.categoryId },
          });
          setSubcategories(res.data.records || []);
        } catch (e) {
          console.error('Error fetching subcategories:', e);
        }
      } else {
        setSubcategories([]);
      }
    };

    fetchSubcategories();
  }, [form.categoryId]);

  const readOnly = mode === 'view';

  const setField = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    onChange?.(next);
  };

  const handleTitleChange = val => {
    setField('title', val);
    if (!value?.slug || value?.slug === '' || value?.slug === slugify(value?.title || '')) {
      setField('slug', slugify(val));
    }
  };

  const addPackage = () => {
    const newPackages = [
      ...form.packages,
      {
        type: 'Custom',
        title: 'Custom Package',
        price: 0,
        description: '',
        revisions: 1,
        deliveryTime: 3,
        features: [],
      },
    ];
    setField('packages', newPackages);
  };

  const updatePackage = (index, field, value) => {
    const newPackages = [...form.packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setField('packages', newPackages);
  };

  const removePackage = index => {
    if (form.packages.length <= 1) return;
    const newPackages = form.packages.filter((_, i) => i !== index);
    setField('packages', newPackages);
  };

  const addGalleryImage = url => {
    const newGallery = [...form.gallery, url];
    setField('gallery', newGallery);
  };

  const removeGalleryImage = index => {
    const newGallery = form.gallery.filter((_, i) => i !== index);
    setField('gallery', newGallery);
  };

  const addTag = tag => {
    const newTags = [...form.searchTags, tag];
    setField('searchTags', newTags);
  };

  const removeTag = index => {
    const newTags = form.searchTags.filter((_, i) => i !== index);
    setField('searchTags', newTags);
  };

  const addFaq = () => {
    const newFaq = [...form.faq, { question: '', answer: '' }];
    setField('faq', newFaq);
  };

  const updateFaq = (index, field, value) => {
    const newFaq = [...form.faq];
    newFaq[index] = { ...newFaq[index], [field]: value };
    setField('faq', newFaq);
  };

  const removeFaq = index => {
    const newFaq = form.faq.filter((_, i) => i !== index);
    setField('faq', newFaq);
  };

  const canSubmit = useMemo(() => {
    if (readOnly) return false;
    return form.title.trim() && form.slug.trim() && form.categoryId;
  }, [form, readOnly]);

  const submit = async e => {
    e.preventDefault();
    if (!canSubmit || !onSubmit) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={submit} className='space-y-6 max-h-[80vh] overflow-y-auto pr-2'>
      {apiError && <div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>{apiError}</div>}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Title *</label>
          <Input disabled={readOnly} value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder='Service title' required />
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Slug *</label>
          <Input disabled={readOnly} value={form.slug} onChange={e => setField('slug', e.target.value)} placeholder='service-slug' required />
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Brief Description</label>
        <Input disabled={readOnly} value={form.brief} onChange={e => setField('brief', e.target.value)} placeholder='Short description' />
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Full Description</label>
        <Textarea disabled={readOnly} value={form.description} onChange={e => setField('description', e.target.value)} rows={4} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Category *</label>
          <Select disabled={readOnly} value={form.categoryId} onChange={e => setField('categoryId', e.target.value)} options={categories.map(c => ({ id: c.id, name: c.name }))} placeholder='Select category' required />
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>Subcategory</label>
          <Select disabled={readOnly || !form.categoryId} value={form.subcategoryId} onChange={e => setField('subcategoryId', e.target.value)} options={subcategories.map(c => ({ id: c.id, name: c.name }))} placeholder={form.categoryId ? 'Select subcategory' : 'Select category first'} />
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-slate-700 mb-1'>Status</label>
        <Select
          disabled={readOnly}
          value={form.status}
          onChange={e => setField('status', e.target.value)}
          options={[
            { id: 'Draft', name: 'Draft' },
            { id: 'Active', name: 'Active' },
            { id: 'Pending', name: 'Pending' },
            { id: 'Paused', name: 'Paused' },
          ]}
        />
      </div>

      <div className='border-t pt-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-slate-800'>Packages</h3>
          {!readOnly && (
            <Button type='button' size='sm' onClick={addPackage} className='!w-fit'>
              <Plus size={16} className='mr-1' /> Add Package
            </Button>
          )}
        </div>

        {form.packages.map((pkg, index) => (
          <div key={index} className='border rounded-lg p-4 mb-4 bg-slate-50'>
            <div className='flex justify-between items-center mb-3'>
              <h4 className='font-medium'>Package {index + 1}</h4>
              {!readOnly && form.packages.length > 1 && (
                <Button type='button' size='sm' color='danger' onClick={() => removePackage(index)} className='!w-fit'>
                  Remove
                </Button>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Package Type</label>
                <Input disabled={readOnly} value={pkg.type} onChange={e => updatePackage(index, 'type', e.target.value)} placeholder='Basic, Standard, Premium' />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Title</label>
                <Input disabled={readOnly} value={pkg.title} onChange={e => updatePackage(index, 'title', e.target.value)} placeholder='Package title' />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Price ($)</label>
                <Input disabled={readOnly} type='number' value={pkg.price} onChange={e => updatePackage(index, 'price', parseFloat(e.target.value) || 0)} placeholder='0.00' />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Delivery Time (days)</label>
                <Input disabled={readOnly} type='number' value={pkg.deliveryTime} onChange={e => updatePackage(index, 'deliveryTime', parseInt(e.target.value) || 1)} placeholder='3' />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Revisions</label>
                <Input disabled={readOnly} type='number' value={pkg.revisions} onChange={e => updatePackage(index, 'revisions', parseInt(e.target.value) || 1)} placeholder='1' />
              </div>
            </div>

            <div className='mt-3'>
              <label className='block text-sm font-medium text-slate-700 mb-1'>Description</label>
              <Textarea disabled={readOnly} value={pkg.description} onChange={e => updatePackage(index, 'description', e.target.value)} rows={2} />
            </div>
          </div>
        ))}
      </div>

      <div className='border-t pt-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-medium text-slate-800'>Gallery Images</h3>
          {!readOnly && <ImagePicker onSelect={addGalleryImage} multiple={true} />}
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {form.gallery.map((img, index) => (
            <div key={index} className='relative group'>
              <Img src={img} alt={`Gallery ${index + 1}`} className='w-full h-24 object-cover rounded-md' />
              {!readOnly && (
                <button type='button' onClick={() => removeGalleryImage(index)} className='absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className='border-t pt-4'>
        <h3 className='text-lg font-medium text-slate-800 mb-4'>Additional Options</h3>
        <div className='flex items-center gap-4'>
          <label className='flex items-center gap-2'>
            <input type='checkbox' disabled={readOnly} checked={form.fastDelivery} onChange={e => setField('fastDelivery', e.target.checked)} className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500' />
            <span className='text-sm font-medium text-slate-700'>Fast Delivery Available</span>
          </label>

          <label className='flex items-center gap-2'>
            <input type='checkbox' disabled={readOnly} checked={form.additionalRevision} onChange={e => setField('additionalRevision', e.target.checked)} className='rounded border-slate-300 text-indigo-600 focus:ring-indigo-500' />
            <span className='text-sm font-medium text-slate-700'>Additional Revision Available</span>
          </label>
        </div>
      </div>

      {readOnly ? (
        <div className='flex justify-end'>
          <Button color='white' name='Close' onClick={onCancel} className='!w-fit'>
            Close
          </Button>
        </div>
      ) : (
        <div className='flex justify-end gap-3 border-t pt-4'>
          <Button type='button' color='secondary' name='Cancel' onClick={onCancel} className='!w-fit'>
            Cancel
          </Button>
          <Button type='submit' color='default' name={submitting ? 'Saving…' : mode === 'edit' ? 'Update Service' : 'Create Service'} disabled={!canSubmit || submitting} className='!w-fit'>
            {submitting ? 'Saving…' : mode === 'edit' ? 'Update Service' : 'Create Service'}
          </Button>
        </div>
      )}
    </form>
  );
}

function slugify(v) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}


function PopularForm({ service, onCancel, onSaved }) {
  const [file, setFile] = useState(null);
  const [iconUrl, setIconUrl] = useState(service?.iconUrl || "");
  const [saving, setSaving] = useState(false);
  const [unpopularing, setUnpopularing] = useState(false);

  const serviceId = service.id;
  const popular = service.popular;

  const handleFileChange = f => {
    if (!f) return;
    setFile(f);
    // Show preview from local file
    const preview = URL.createObjectURL(f);
    setIconUrl(preview);
  };

  const saveIcon = async () => {
    if (!file) return;

    try {
      setSaving(true);

      const fd = new FormData();

      // If user selected a file → send it
      if (file) {
        fd.append("icon", file);
      }

      const apiUrl = popular
        ? `/services/${serviceId}/popular/icon`
        : `/services/${serviceId}/popular`;

      const res = await api.post(apiUrl, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res?.data?.iconUrl;
      toast.success("Popular icon updated");

      onSaved?.(url);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to update icon"
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };


  const removePopular = async () => {
    try {
      setUnpopularing(true);
      await api.delete(`/services/${serviceId}/unpopular`);
      toast.success("Service removed from popular");
      onSaved?.(null); // clear icon
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to remove popular status"
      toast.error(msg);
    } finally {
      setUnpopularing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Upload Button + Preview */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center justify-center h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={e => handleFileChange(e.target.files?.[0])}
          />

          <span className="inline-flex items-center">
            <ImageIcon size={16} className="mr-2" /> Choose Icon
          </span>
        </label>

        {iconUrl ? (
          <img
            src={iconUrl.startsWith("blob:") ? iconUrl : resolveUrl(iconUrl)}
            alt="Popular icon"
            className="h-10 w-10 rounded-lg border border-slate-200 object-contain"
          />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-dashed border-slate-300 text-slate-400">
            <ImageIcon size={16} />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Choose a file then click Save to update the popular icon.
      </p>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button
          type="button"
          color="secondary"
          name="Cancel"
          onClick={onCancel}
          className="!w-fit"
        >
          Cancel
        </Button>

        <Button
          type="button"
          color="green"
          onClick={saveIcon}
          name={saving ? "Saving…" : "Save Icon"}
          disabled={saving || !file}
          className="!w-fit"
        >
          {saving ? "Saving…" : "Save Icon"}
        </Button>

        {popular && (
          <Button
            type="button"
            color="red"
            onClick={removePopular}
            name={unpopularing ? "Removing…" : "Unmark Popular"}
            disabled={unpopularing}
            className="!w-fit"
          >
            {unpopularing ? "Removing…" : "Unmark Popular"}
          </Button>
        )}
      </div>
    </div>
  );
}