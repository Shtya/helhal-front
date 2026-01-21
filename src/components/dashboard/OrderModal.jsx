// src/components/dashboard/OrderModal.js
import { useState } from 'react';
import Modal from './ui/Modal';

export default function OrderModal({ order, onClose }) {
  const [activeTab, setActiveTab] = useState('details');

  if (!order) return null;

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Accepted: 'bg-blue-100 text-blue-800',
    Delivered: 'bg-purple-100 text-purple-800',
    Completed: 'bg-main-100 text-main-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <Modal
      title={`Order #${order.id}`}
      onClose={onClose}
      size="lg"
    >
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requirements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Requirements
          </button>
        </nav>
      </div>

      <div className="py-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Buyer</h4>
                <p className="mt-1 text-sm text-gray-900">{order.buyer.username}</p>
                <p className="text-sm text-gray-600">{order.buyer.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Seller</h4>
                <p className="mt-1 text-sm text-gray-900">{order.seller.username}</p>
                <p className="text-sm text-gray-600">{order.seller.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Service</h4>
                <p className="mt-1 text-sm text-gray-900">{order.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Package</h4>
                <p className="mt-1 text-sm text-gray-900">{order.packageType}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Order Date</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(order.orderDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Due Date</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Quantity</h4>
                <p className="mt-1 text-sm text-gray-900">{order.quantity}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Total Amount</h4>
                <p className="mt-1 text-sm text-gray-900">${order.totalAmount}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700">Status</h4>
              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                {order.status}
              </span>
            </div>

            {order.deliveredAt && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Delivered At</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(order.deliveredAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {order.completedAt && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Completed At</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(order.completedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {order.timeline && order.timeline.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>

                {order.timeline.map((event, index) => (
                  <div key={index} className="relative pl-12 pb-6">
                    {/* Timeline dot */}
                    <div className="absolute left-3.5 top-1 h-2 w-2 rounded-full bg-blue-500"></div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 capitalize">{event.status}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No timeline events available</p>
            )}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="space-y-4">
            {order.requirementsAnswers && order.requirementsAnswers.length > 0 ? (
              order.requirementsAnswers.map((qa, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Q: {qa.question}</p>
                  <p className="text-sm text-gray-600 mt-1">A: {qa.answer}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No requirements answers available</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}