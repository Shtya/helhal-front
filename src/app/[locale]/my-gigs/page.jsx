// pages/my-gigs.jsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tabAnimation } from '../my-orders/page';
import { apiService } from '@/services/GigServices';
import Button from '@/components/atoms/Button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { baseImg } from '@/lib/axios';
import { Modal } from '@/components/common/Modal';
import toast from 'react-hot-toast';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import { useTranslations } from 'next-intl';
import { isErrorAbort } from '@/utils/helper';

export default function Page() {
  const t = useTranslations('MyGigs');
  const [activeTab, setActiveTab] = useState('All');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState(null); // store gig to delete
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const controllerRef = useRef();
  const fetchServices = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab === 'All' ? '' : activeTab,
      };

      const response = await apiService.getMyServices(params, { signal: controller.signal });

      setServices(response.services);

      setPagination(prev => {
        const newPagination = {
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages,
        };

        return newPagination;
      });
    } catch (error) {
      if (!isErrorAbort(error))
        console.error('Error fetching services:', error);
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [activeTab, pagination.page, pagination.limit]);

  const handlePageChange = updater => {
    setPagination(prev => {
      const nextPage = typeof updater === 'function' ? updater(prev.page) : updater;
      return { ...prev, page: nextPage };
    });
  };

  const handleLimitChange = limit => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleTabChange = tab => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Define columns based on your data structure
  const columns = [
    {
      key: 'gallery',
      label: t('columns.gig'),
      type: 'img',
      format: value => (value && value.length > 0 ? baseImg + value[0].url : '/placeholder-image.jpg'),
    },
    {
      key: 'title',
      label: t('columns.service'),
    },
    {
      key: 'clicks',
      label: t('columns.clicks'),
    },
    {
      key: 'ordersCount',
      label: t('columns.ordersCount'),
    },
    {
      key: 'packages',
      label: t('columns.startingPrice'),
      type: 'price',
      format: value => (value && value.length > 0 ? Math.min(...value.map(p => p.price)) : 'N/A'),
    },
    {
      key: 'status',
      label: t('columns.status'),
      status: [
        [t('status.active'), 'text-main-500 bg-main-100 px-2 py-1 rounded'],
        [t('status.pending'), 'text-yellow-500 bg-yellow-100 px-2 py-1 rounded'],
        [t('status.draft'), 'text-gray-500 bg-gray-100 px-2 py-1 rounded'],
        [t('status.denied'), 'text-red-500 bg-red-100 px-2 py-1 rounded'],
        [t('status.paused'), 'text-blue-500 bg-blue-100 px-2 py-1 rounded'],
      ],
    },
    {
      key: 'created_at',
      label: t('columns.createdDate'),
      format: value => new Date(value).toLocaleDateString(),
    },
  ];

  // Format data for the table
  const formatTableData = services => {
    return services.map(service => {
      const row = {
        id: service.id,
        slug: service.slug,
      };
      columns.forEach(column => {
        if (column.format) {
          row[column.key] = column.format(service[column.key]);
        } else {
          row[column.key] = service[column.key];
        }
      });
      return row;
    });
  };

  const renderActions = row => {
    const baseStyle = 'w-8 h-8 flex items-center justify-center rounded-md border transition cursor-pointer';

    const index = services.findIndex(e => e.id == row.id);
    return (
      <div className='flex space-x-2 mx-auto w-fit'>
        <Link href={`/services/${services[index].category.slug}/${services[index].slug}`} className={`${baseStyle} border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800`} >
          <Eye className='w-4 h-4' />
        </Link>
        {/* 
        <Link href={`/create-gig?slug=${services[index].slug}`} className={`${baseStyle} border-main-200 bg-main-50 text-main-600 hover:bg-main-100 hover:text-main-800`} >
          <Pencil className='w-4 h-4' />
        </Link> */}

        <button className={`${baseStyle} border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800`} onClick={() => handleDelete(row)}>
          <Trash2 className='w-4 h-4' />
        </button>
      </div>
    );
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    let toastId;
    try {
      setDeleting(true);

      // show loading toast and keep its id
      toastId = toast.loading(
        t('toast.deleting', { title: deleteTarget.title })
      );

      await apiService.deleteService(deleteTarget.id);

      // update toast to success
      toast.success(
        t('toast.deleted', { title: deleteTarget.title }),
        { id: toastId }
      );

      // update local state
      setServices(prev => prev.filter(s => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message ||
        t('toast.failed', { title: deleteTarget.title }),
        { id: toastId }
      );
      console.error('Delete failed', err);
    } finally {
      setDeleting(false);
    }
  };


  const handleDelete = row => {
    const index = services.findIndex(e => e.id == row.id);
    const gig = services[index];
    setDeleteTarget(gig);
  };

  const tabs = [
    { label: t('tabs.all'), value: "All" },
    { label: t('tabs.active'), value: "Active" },
    { label: t('tabs.pending'), value: "Pending" },
    { label: t('tabs.draft'), value: "Draft" },
    { label: t('tabs.denied'), value: "Denied" },
    { label: t('tabs.paused'), value: "Paused" },
  ]
  return (
    <div className='container min-h-screen !py-12 '>
      {/* Header */}
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <h1 className='text-3xl font-bold text-center mb-4'>{t('title')}</h1>
      </div>

      {/* Tabs and Create Button */}
      <div className=' bg-gray-50 border border-slate-200 rounded-lg p-4  flex items-center justify-between gap-3 flex-wrap !mb-4 mt-2 '>
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
        <Button name={t('createNewGig')} href={'/create-gig'} className='!w-fit' />
      </div>

      {/* Table */}
      <AnimatePresence exitBeforeEnter>
        <motion.div key={activeTab} {...tabAnimation}>
          <Table loading={loading} data={formatTableData(services)} columns={columns} actions={renderActions} onPageChange={handlePageChange} page={pagination.page} rowsPerPage={pagination.limit} totalCount={pagination.total} />
        </motion.div>
      </AnimatePresence>

      {deleteTarget && (
        <Modal title={t('delete.title')} onClose={() => setDeleteTarget(null)}>
          <p className='text-gray-600 mb-6' >
            {t.rich('delete.confirm', {
              title: deleteTarget.title,
              strong: (chunk) => <strong>{chunk}</strong>
            })}
          </p>
          <div className='flex justify-end gap-3'>
            <Button color='secondary' onClick={() => setDeleteTarget(null)} className='!w-fit' name={t('delete.cancel')} />
            <Button onClick={confirmDelete} disabled={deleting} name={deleting ? t('delete.deleting') : t('delete.delete')} color='red' className='!w-fit' />
          </div>
        </Modal>
      )}
    </div>
  );
}
