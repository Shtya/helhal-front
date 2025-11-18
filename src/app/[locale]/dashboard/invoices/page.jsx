"use client"
import { useState, useEffect, useRef } from 'react';
import DataTable from '@/components/dashboard/ui/DataTable';
import { getInvoices } from '@/utils/api';
import { isErrorAbort } from '@/utils/helper';
import OrderDetailsModal from '@/components/pages/my-orders/OrderDetailsModal';
import TruncatedText from '@/components/dashboard/TruncatedText';

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [filters, setFilters] = useState({ status: 'all', page: 1, limit: 10 });
  const statusFilter = filters.status;
  const [total, setTotal] = useState(0);

  function onSearch(val) {
    setDebouncedSearch(val)
    setFilters(p => ({ ...p, page: 1 }))
  }

  function onTabChange(tab) {
    setFilters(p => ({ ...p, page: 1, status: tab }))
  }

  function onLimitChange(val) {
    setFilters(p => ({ ...p, page: 1, limit: val }))
  }

  function onPageChange(val) {
    setFilters(p => ({ ...p, page: val }))
  }
  const controllerRef = useRef();
  useEffect(() => {
    const fetchInvoices = async () => {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {

        setLoading(true);
        const q = {
          page: filters.page,
          limit: filters.limit,
          status: filters.status === 'all' ? '' : filters.status,
          search: debouncedSearch
        }
        // This would be implemented in api.js
        const data = await getInvoices(q, { signal: controller.signal });

        setInvoices(data?.records || []);
        setTotal(data?.total_records ?? 0);
        setFilters(prev => ({
          ...prev,
          page: data?.current_page ?? prev.page,
          limit: data?.per_page ?? prev.limit,
        }))
      } catch (error) {
        if (!isErrorAbort(e)) {
          console.error('Error fetching invoices:', error);
        }
      } finally {
        if (controllerRef.current === controller)
          setLoading(false);
      }
    };

    fetchInvoices();
  }, [filters.status, filters.page, filters.limit, debouncedSearch]);


  const columns = [
    { key: 'invoiceNumber', title: 'Invoice Number' },
    {
      key: 'order',
      title: 'Order',
      render: (value) => <TruncatedText text={value?.title} />
    },
    {
      key: 'buyer',
      title: 'Buyer',
      render: (value) => value.username
    },
    {
      key: 'subtotal',
      title: 'Subtotal',
      render: (value) => `$${value}`
    },
    {
      key: 'serviceFee',
      title: 'Service Fee',
      render: (value) => `$${value}`
    },
    {
      key: 'totalAmount',
      title: 'Total Amount',
      render: (value) => `$${value}`
    },
    {
      key: 'platformPercent',
      title: 'Platform %',
      render: (value) => `${value}%`
    },
    {
      key: 'paymentStatus',
      title: 'Payment Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value === 'paid' ? 'bg-green-100 text-green-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
          {value}
        </span>
      )
    },
    {
      key: 'issuedAt',
      title: 'Issued Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'paymentMethod',
      title: 'Payment Method',
      render: (value) => value || 'N/A'
    },
  ];


  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const openView = async invoice => {
    setCurrent(invoice?.order);
    setModalOpen(true);

  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div className="text-nowrap inline-flex p-1 max-w-full overflow-x-auto space-x-2">
          <button
            onClick={() => onTabChange('all')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
              }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => onTabChange('paid')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'paid'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
              }`}
          >
            Paid
          </button>
          <button
            onClick={() => onTabChange('pending')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => onTabChange('failed')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'failed'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
              }`}
          >
            Failed
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        page={filters.page}
        limit={filters.limit}
        search={debouncedSearch}
        totalCount={total}
        onView={openView}
        onLimitChange={onLimitChange}
        onPageChange={onPageChange}
        onSearch={onSearch}
      />

      <OrderDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orderId={current?.id}
      />
    </div>
  );
}
