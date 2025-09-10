// src/components/dashboard/ServiceModal.js
import { useState } from 'react';
import Modal from './ui/Modal';

export default function ServiceModal({ service, onClose }) {
  const [activeTab, setActiveTab] = useState('details');
 
  if (!service) return null;

  const basicPackage = service.packages.find(p => p.name === 'Basic');
  const standardPackage = service.packages.find(p => p.name === 'Standard');
  const premiumPackage = service.packages.find(p => p.name === 'Premium');

  return (
    <Modal 
      title="Service Details" 
      onClose={onClose}
      size="lg"
    >
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'packages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Packages
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gallery'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gallery
          </button>
        </nav>
      </div>

      <div className="py-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
              <p className="text-sm text-gray-500">by {service.seller.username}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700">Description</h4>
              <p className="mt-1 text-sm text-gray-600">{service.brief}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Category</h4>
                <p className="mt-1 text-sm text-gray-600">{service.category.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Status</h4>
                <p className="mt-1 text-sm text-gray-600">{service.status}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Orders</h4>
                <p className="mt-1 text-sm text-gray-600">{service.ordersCount}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Rating</h4>
                <p className="mt-1 text-sm text-gray-600">
                  {service.rating ? service.rating.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>

            {service.faq && service.faq.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">FAQ</h4>
                <div className="mt-2 space-y-2">
                  {service.faq.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Q: {item.question}</p>
                      <p className="text-sm text-gray-600 mt-1">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-4">
            {basicPackage && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900">Basic Package</h4>
                <p className="text-2xl font-bold text-blue-600">${basicPackage.price}</p>
                <p className="text-sm text-gray-600 mt-2">{basicPackage.description}</p>
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700">Features:</h5>
                  <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                    {basicPackage.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Delivery:</span>
                    <span className="text-sm text-gray-600 ml-1">{basicPackage.deliveryTime} days</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Revisions:</span>
                    <span className="text-sm text-gray-600 ml-1">{basicPackage.revisions}</span>
                  </div>
                </div>
              </div>
            )}

            {standardPackage && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900">Standard Package</h4>
                <p className="text-2xl font-bold text-blue-600">${standardPackage.price}</p>
                <p className="text-sm text-gray-600 mt-2">{standardPackage.description}</p>
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700">Features:</h5>
                  <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                    {standardPackage.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Delivery:</span>
                    <span className="text-sm text-gray-600 ml-1">{standardPackage.deliveryTime} days</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Revisions:</span>
                    <span className="text-sm text-gray-600 ml-1">{standardPackage.revisions}</span>
                  </div>
                </div>
              </div>
            )}

            {premiumPackage && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900">Premium Package</h4>
                <p className="text-2xl font-bold text-blue-600">${premiumPackage.price}</p>
                <p className="text-sm text-gray-600 mt-2">{premiumPackage.description}</p>
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700">Features:</h5>
                  <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                    {premiumPackage.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Delivery:</span>
                    <span className="text-sm text-gray-600 ml-1">{premiumPackage.deliveryTime} days</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Revisions:</span>
                    <span className="text-sm text-gray-600 ml-1">{premiumPackage.revisions}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div>
            {service.gallery && service.gallery.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {service.gallery.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={item.url} 
                      alt={item.fileName} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2">
                      <p className="text-xs text-gray-600 truncate">{item.fileName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No gallery images available</p>
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