// utils/api.js
import api from '@/lib/axios';

// Map UI filters to backend search param
const mapFilterToSearch = (statusFilter) => {
  if (!statusFilter || statusFilter === 'all') return undefined;
  return statusFilter; // your API accepts single status or 'all'
};

/**
 * Get orders for Admin dashboard (server-side sort + filter + pagination + search).
 */
export async function getOrders(
  statusFilter = 'all',
  {
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    search = '', // free text (order number / status)
  } = {}
) {
  const params = new URLSearchParams();
  const mapped = mapFilterToSearch(statusFilter);
  if (search?.trim()) params.set('search', search.trim());
  else if (mapped) params.set('search', mapped);
  else params.set('search', 'all'); // admin: fetch-all by default

  params.set('page', String(page));
  params.set('limit', String(limit));
  params.set('sortBy', sortBy);
  params.set('sortOrder', sortOrder);

  const { data } = await api.get(`/orders/admin?${params.toString()}`);
  // Expect { records, meta } shape; normalize if needed
  return {
    records: data?.records ?? data?.data ?? data?.orders ?? [],
    meta: data?.meta ?? { total: data?.total ?? 0 },
  };
}

export async function updateOrderStatus(orderId, status) {
  return api.put(`/orders/${orderId}/status`, { status });
}
