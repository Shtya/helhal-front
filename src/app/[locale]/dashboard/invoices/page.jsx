"use client"
import { useState, useEffect } from 'react';
import DataTable from '@/components/dashboard/ui/DataTable';
import { getInvoices } from '@/utils/api';

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // This would be implemented in api.js
      const data = await getInvoices(statusFilter);
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'invoiceNumber', title: 'Invoice Number' },
    {
      key: 'order',
      title: 'Order ID',
      render: (value) => value.id
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

  const filteredInvoices = statusFilter === 'all'
    ? invoices
    : invoices.filter(invoice => invoice.paymentStatus === statusFilter);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
              }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'paid'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
              }`}
          >
            Paid
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg ${statusFilter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
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
        data={filteredInvoices}
        loading={loading}
        actions={false}
      />
    </div>
  );
}