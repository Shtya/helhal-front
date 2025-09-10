"use client"
import { useState, useEffect } from 'react';
import Layout from '@/components/dashboard/Layout';
import DataTable from '@/components/dashboard/ui/DataTable';
import Modal from '@/components/dashboard/ui/Modal';
import { getGuides, createGuide, updateGuide, deleteGuide } from '@/utils/api';

export default function Guides() {
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: '' });

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      setIsLoading(true);
      const response = await getGuides();
      setGuides(response);
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGuide) {
        await updateGuide(editingGuide.id, formData);
      } else {
        await createGuide(formData);
      }
      setIsModalOpen(false);
      setEditingGuide(null);
      setFormData({ title: '', content: '', category: '' });
      fetchGuides();
    } catch (error) {
      console.error('Error saving guide:', error);
    }
  };

  const handleEdit = (guide) => {
    setEditingGuide(guide);
    setFormData({
      title: guide.title,
      content: guide.content,
      category: guide.category
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (guide) => {
    if (confirm('Are you sure you want to delete this guide?')) {
      try {
        await deleteGuide(guide.id);
        fetchGuides();
      } catch (error) {
        console.error('Error deleting guide:', error);
      }
    }
  };

  const columns = [
    { key: 'title', title: 'Title', sortable: true },
    { key: 'category', title: 'Category', sortable: true },
    { key: 'created_at', title: 'Created', sortable: true, render: (value) => new Date(value).toLocaleDateString() },
  ];

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Guides Management</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add New Guide
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <DataTable
              columns={columns}
              data={guides}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      <Modal show={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setEditingGuide(null);
        setFormData({ title: '', content: '', category: '' });
      }}>
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {editingGuide ? 'Edit Guide' : 'Add New Guide'}
          </h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="content"
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingGuide(null);
                  setFormData({ title: '', content: '', category: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {editingGuide ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </Layout>
  );
}