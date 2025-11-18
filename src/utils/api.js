import api from '@/lib/axios';

// Generic API call function
async function apiCall(endpoint, { method = 'GET', data = null, params = null } = {}) {
  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
      params,
    });
    return response.data;
  } catch (error) {
    console.error('API call error:', error);
    throw error?.response?.data || error;
  }
}

// ------------------------------
// Dashboard stats
export async function getDashboardStats() {
  return apiCall('/stats');
}

// ------------------------------
// Users management
export async function getUsers(filter = 'all') {
  return apiCall('/auth/users', { params: { filter } });
}

export async function getUser(id) {
  return apiCall(`/users/users/${id}`);
}

export async function updateUser(id, userData) {
  return apiCall(`/users/users/${id}`, { method: 'PUT', data: userData });
}

export async function deleteUser(id) {
  return apiCall(`/users/users/${id}`, { method: 'DELETE' });
}

export async function updateUserStatus(userId, status) {
  return apiCall(`/users/${userId}/status`, {
    method: 'PUT',
    data: { status },
  });
}

// ------------------------------
// Categories management
export async function getCategories(type = 'all') {
  return apiCall('/categories', { params: { type } });
}

export async function createCategory(categoryData) {
  return apiCall('/categories', { method: 'POST', data: categoryData });
}

export async function updateCategory(id, categoryData) {
  return apiCall(`/categories/${id}`, { method: 'PUT', data: categoryData });
}

export async function deleteCategory(id) {
  return apiCall(`/categories/${id}`, { method: 'DELETE' });
}

// ------------------------------
// Services management
export async function getServices(status = 'all') {
  return apiCall('/services/admin', { params: { status } });
}

export async function updateServiceStatus(id, status) {
  return apiCall(`/services/${id}/status`, { method: 'PUT', data: { status } });
}

// ------------------------------
// Orders management
export async function getOrders(status = 'all') {
  return apiCall('/orders/admin', { params: { status } });
}

export async function updateOrderStatus(id, status) {
  return apiCall(`/orders/${id}/status`, { method: 'PUT', data: { status } });
}

// ------------------------------
// Withdrawals management
export async function getWithdrawals(status = 'pending') {
  return apiCall('/withdrawals', { params: { status } });
}

export async function processWithdrawal(id, action) {
  return apiCall(`/withdrawals/${id}`, { method: 'PUT', data: { action } });
}

// ------------------------------
// Invoices management
export async function getInvoices(params, extra = {}) {
  return apiCall('/invoices', { params, ...extra });
}

// ------------------------------
// Level Up API
export async function getLevelUpRequests(page = 1, limit = 10) {
  return apiCall(`/levelup/requests`, { params: { page, limit } });
}

export async function updateLevelUpStatus(requestId, status) {
  return apiCall(`/levelup/requests/${requestId}/status`, {
    method: 'PUT',
    data: { status },
  });
}

// ------------------------------
// Withdraw API (alternative implementation)
export async function getWithdrawRequests(page = 1, limit = 10, status = null) {
  const params = { page, limit };
  if (status) params.status = status;
  return apiCall(`/withdraw/requests`, { params });
}

export async function updateWithdrawStatus(requestId, status) {
  return apiCall(`/withdraw/requests/${requestId}/status`, {
    method: 'PUT',
    data: { status },
  });
}

// ------------------------------
// FAQs API
export async function getFAQs() {
  return apiCall('/faqs');
}

export async function createFAQ(faqData) {
  return apiCall('/faqs', { method: 'POST', data: faqData });
}

export async function updateFAQ(faqId, faqData) {
  return apiCall(`/faqs/${faqId}`, { method: 'PUT', data: faqData });
}

export async function deleteFAQ(faqId) {
  return apiCall(`/faqs/${faqId}`, { method: 'DELETE' });
}

// ------------------------------
// Guides API
export async function getGuides() {
  return apiCall('/guides');
}

export async function createGuide(guideData) {
  return apiCall('/guides', { method: 'POST', data: guideData });
}

export async function updateGuide(guideId, guideData) {
  return apiCall(`/guides/${guideId}`, { method: 'PUT', data: guideData });
}

export async function deleteGuide(guideId) {
  return apiCall(`/guides/${guideId}`, { method: 'DELETE' });
}

// ------------------------------
// Terms & Policies API
export async function getTermsAndPolicies() {
  return apiCall('/settings/terms-policies');
}

export async function updateTermsAndPolicies(data) {
  return apiCall('/settings/terms-policies', {
    method: 'PUT',
    data,
  });
}

// ------------------------------
// Settings API
export async function getSettings() {
  return apiCall('/settings');
}

export async function updateSettings(settings) {
  return apiCall('/settings', {
    method: 'PUT',
    data: settings,
  });
}



export function getUserIdFromAccessToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return payload.id || null;
  } catch (error) {
    console.error('Failed to decode accessToken:', error);
    return null;
  }
}

