import api from '@/lib/axios';

class ApiService {
  constructor() {
    this.client = api;
  }
  normalizeParams(params = {}) {
    const out = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) out[k] = v.join(',');
      else if (typeof v === 'object' && v?.id !== undefined) out[k] = v.id;
      else out[k] = v;
    });
    return out;
  }
  async request(cfg = {}) {
    try {
      const res = await this.client.request(cfg);
      return res.data;
    } catch (err) {

      const isAxiosCancel = err?.code === 'ERR_CANCELED';
      const isAbortError = err?.name === 'AbortError';
      const isCanceledToken = !!err?.__CANCEL__;

      // If it's a cancellation/abort, rethrow the original error so callers can handle it
      if (isAxiosCancel || isAbortError || isCanceledToken) {
        throw err;
      }
      const message = err?.response?.data?.message || err?.message || 'API request failed';
      console.error('API Error:', err);
      throw new Error(message);
    }
  }

  // ========== Categories ==========
  getCategories(type = null, extra = {}) {
    return this.request({
      method: 'GET',
      url: '/categories',
      params: type ? { type } : undefined,
      ...extra,
    });
  }

  getCategory(id, extra = {}) {
    return this.request({
      method: 'GET',
      url: `/categories/${id}`,
      ...extra,
    });
  }

  getCategoryServices(id, page = 1, extra = {}) {
    return this.request({
      method: 'GET',
      url: `/categories/${id}/services`,
      params: { page },
      ...extra,
    });
  }

  getCategoryServicesFilter(category, queryParams, extra = {}) {
    const processedParams = { ...queryParams };

    if (Array.isArray(processedParams.sellerLevel)) processedParams.sellerLevel = processedParams.sellerLevel.join(',');
    if (Array.isArray(processedParams.sellerAvailability)) processedParams.sellerAvailability = processedParams.sellerAvailability.join(',');
    if (Array.isArray(processedParams.sellerSpeaks)) processedParams.sellerSpeaks = processedParams.sellerSpeaks.join(',');
    if (Array.isArray(processedParams.sellerCountries)) processedParams.sellerCountries = processedParams.sellerCountries.join(',');
    const queryString = new URLSearchParams(processedParams).toString();

    return this.request({
      method: 'GET',
      url: `/services/category/${category}?${queryString}`,
      extra
    });
  }

  getServicesPublic(query = {}, extra = {}) {
    const params = this.normalizeParams(query);
    return this.request({
      method: 'GET',
      url: '/services/all',
      params,
      ...extra,
    });
  }

  getServices(category, query = {}, extra = {}) {
    return category === 'all' ? this.getServicesPublic(query, extra) : this.getCategoryServicesFilter(category, query, extra)
  }

  getServicesFilterOptions(category) {
    return this.request({
      method: 'GET',
      url: `/services/category/${category}/filter-options`,
    });
  }

  getAllFilterOptions() {
    return this.request({
      method: 'GET',
      url: `/services/filter-options`,
    });
  }


  getFilterOptions(category = 'all') {
    return category === 'all' ? this.getAllFilterOptions() : this.getServicesFilterOptions(category);
  }
  // ========== Services ==========
  getMyServices(query = {}, extra = {}) {
    return this.request({
      method: 'GET',
      url: '/services/me',
      params: query,
      ...extra,
    });
  }

  getTopServices(query = {}, extra = {}) {
    return this.request({
      method: 'GET',
      url: '/services/top',
      params: query,
      ...extra,
    });
  }

  getService(id, extra = {}) {
    return this.request({
      method: 'GET',
      url: `/services/${id}`,
      ...extra,
    });
  }

  createService(serviceData, extra = {}) {
    return this.request({
      method: 'POST',
      url: '/services',
      data: serviceData, // axios بيحوّل JSON تلقائيًا
      ...extra,
    });
  }

  updateService(id, serviceData, extra = {}) {
    return this.request({
      method: 'PUT',
      url: `/services/${id}`,
      data: serviceData,
      ...extra,
    });
  }

  deleteService(id, extra = {}) {
    return this.request({
      method: 'DELETE',
      url: `/services/${id}`,
      ...extra,
    });
  }

  searchServices(query = {}, extra = {}) {
    return this.request({
      method: 'GET',
      url: '/services/search',
      params: query,
      ...extra,
    });
  }

  getServicesAdmin(query = {}, extra = {}) {
    const params = this.normalizeParams(query);
    return this.request({
      method: 'GET',
      url: '/services/admin',
      params,
      ...extra,
    });
  }


  getMyServices(query = {}, extra = {}) {
    const params = this.normalizeParams(query);
    return this.request({
      method: 'GET',
      url: '/services/me',
      params,
      ...extra,
    });
  }

  // ========== Assets ==========
  uploadAsset(file, metadata = {}, extra = {}) {
    const formData = new FormData();
    formData.append('file', file);

    Object.entries(metadata).forEach(([key, val]) => {
      if (val !== undefined && val !== null) formData.append(key, val);
    });

    // لا تضبط Content-Type يدويًا؛ axios يحدد boundary تلقائيًا مع FormData
    return this.request({
      method: 'POST',
      url: '/assets',
      data: formData,
      ...extra,
    });
  }

  uploadMultipleAssets(files = [], metadata = {}, extra = {}) {
    const formData = new FormData();

    files.forEach(f => formData.append('files', f));
    Object.entries(metadata).forEach(([key, val]) => {
      if (val !== undefined && val !== null) formData.append(key, val);
    });

    return this.request({
      method: 'POST',
      url: '/assets/bulk',
      data: formData,
      ...extra,
    });
  }

  getUserAssets(query = {}, extra = {}) {
    return this.request({
      method: 'GET',
      url: '/assets',
      params: query,
      ...extra,
    });
  }

  deleteAsset(id, extra = {}) {
    return this.request({
      method: 'DELETE',
      url: `/assets/${id}`,
      ...extra,
    });
  }
}

export const apiService = new ApiService();
