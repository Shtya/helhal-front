// pages/my-gigs.jsx
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tabAnimation } from '../orders/page';
import { apiService } from '@/services/GigServices';
import Button from '@/components/atoms/Button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { baseImg } from '@/lib/axios';
import { Modal } from '@/components/common/Modal';
import toast from 'react-hot-toast';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';

export default function Page() {
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

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab === 'All' ? '' : activeTab,
      };

      const response = await apiService.getServices(params);

      setServices(response.services);

      setPagination(prev => {
        const newPagination = {
          ...prev,
          page: Number(response.pagination.page),
          limit: Number(response.pagination.limit),
          total: response.pagination.total,
          pages: response.pagination.pages,
        };

        // لو القيم ما اتغيرتش رجّع نفس الـ prev
        if (prev.page === newPagination.page && prev.limit === newPagination.limit && prev.total === newPagination.total && prev.pages === newPagination.pages) {
          return prev;
        }

        return newPagination;
      });
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
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
      label: 'Gig',
      type: 'img',
      format: value => (value && value.length > 0 ? baseImg + value[0].url : '/placeholder-image.jpg'),
    },
    {
      key: 'title',
      label: 'Service',
    },
    {
      key: 'clicks',
      label: 'Clicks',
    },
    {
      key: 'impressions',
      label: 'Impressions',
    },
    {
      key: 'ordersCount',
      label: 'Orders Count',
    },
    {
      key: 'cancellations',
      label: 'Cancellations',
    },
    {
      key: 'packages',
      label: 'Starting Price',
      type: 'price',
      format: value => (value && value.length > 0 ? Math.min(...value.map(p => p.price)) : 'N/A'),
    },
    {
      key: 'status',
      label: 'Status',
      status: [
        ['Active', 'text-green-500 bg-green-100 px-2 py-1 rounded'],
        ['Pending', 'text-yellow-500 bg-yellow-100 px-2 py-1 rounded'],
        ['Draft', 'text-gray-500 bg-gray-100 px-2 py-1 rounded'],
        ['Denied', 'text-red-500 bg-red-100 px-2 py-1 rounded'],
        ['Paused', 'text-blue-500 bg-blue-100 px-2 py-1 rounded'],
      ],
    },
    {
      key: 'created_at',
      label: 'Created Date',
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

    return (
      <div className='flex space-x-2 mx-auto w-fit'>
        <button className={`${baseStyle} border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800`} onClick={() => handleView(row)}>
          <Eye className='w-4 h-4' />
        </button>

        <button className={`${baseStyle} border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-800`} onClick={() => handleEdit(row)}>
          <Pencil className='w-4 h-4' />
        </button>

        <button className={`${baseStyle} border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800`} onClick={() => handleDelete(row)}>
          <Trash2 className='w-4 h-4' />
        </button>
      </div>
    );
  };

  const handleView = row => {
    const index = services.findIndex(e => e.id == row.id);
    router.push(`/services/${services[index].category.slug}/${services[index].slug}`);
  };

  const handleEdit = row => {
    const index = services.findIndex(e => e.id == row.id);
    router.push(`/create-gig?gigId=${services[index].id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await apiService.deleteService(deleteTarget.id);
      toast.success('Gig deleted successfully');
      setServices(prev => prev.filter(s => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete gig');
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
    { label: "All", value: "All" },
    { label: "Active", value: "Active" },
    { label: "Pending", value: "Pending" },
    { label: "Draft", value: "Draft" },
    { label: "Denied", value: "Denied" },
    { label: "Paused", value: "Paused" },
  ]
  return (
    <div className='container min-h-screen !py-12 '>
      {/* Header */}
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <h1 className='text-3xl font-bold text-center mb-4'> My Gigs </h1>
      </div>

      {/* Tabs and Create Button */}
      <div className=' bg-gray-50 border border-slate-200 rounded-lg p-4  flex items-center justify-between gap-3 flex-wrap !mb-4 mt-2 '>
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} />
        <Button name={'Create a new Gig'} href={'/create-gig'} className='!w-fit' />
      </div>

      {/* Table */}
      <AnimatePresence exitBeforeEnter>
        <motion.div key={activeTab} {...tabAnimation}>
          {/* <TableData data={formatTableData(services)} columns={columns} actions={renderActions} onPageChange={handlePageChange} onLimitChange={handleLimitChange} loading={loading} pagination={pagination} /> */}
          <Table loading={loading} data={formatTableData(services)} columns={columns} actions={renderActions} />
        </motion.div>
      </AnimatePresence>

      {deleteTarget && (
        <Modal title='Delete Gig' onClose={() => setDeleteTarget(null)}>
          <p className='text-gray-600 mb-6'>
            Are you sure you want to delete this gig <span className='font-semibold text-black'>{deleteTarget.title}</span>? This action cannot be undone.
          </p>
          <div className='flex justify-end gap-3'>
            <Button color='secondary' onClick={() => setDeleteTarget(null)} className='!w-fit' name={'Cancel'} />
            <Button onClick={confirmDelete} disabled={deleting} name={deleting ? 'Deleting...' : 'Delete'} color='red' className='!w-fit' />
          </div>
        </Modal>
      )}
    </div>
  );
}
