import { CreatePurchaseInvoiceInput, PurchaseInvoice, PurchaseInvoiceFilters, PurchaseInvoiceStatus } from '../types';

// Helper function to get headers with authorization
// Token should be passed from the thunk to avoid circular dependency
const getHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const buildQueryString = (params?: Partial<PurchaseInvoiceFilters> & { search?: string }) => {
  if (!params) return '';
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') {
    query.append('status', params.status);
  }
  if (params.supplierId) {
    query.append('supplierId', params.supplierId.toString());
  }
  if (params.search) {
    query.append('q', params.search);
  }
  return query.toString() ? `?${query.toString()}` : '';
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let message = 'فشل الاتصال بالخادم';
    try {
      const error = await response.json();
      message = error.error || error.message || message;
    } catch (err) {
      // ignore
    }
    throw new Error(message);
  }
  return response.json();
};

const purchasingService = {
  async fetchInvoices(filters?: Partial<PurchaseInvoiceFilters>, token?: string | null) {
    const query = buildQueryString(filters);
    const response = await fetch(`/api/purchasing/invoices${query}`, {
      method: 'GET',
      headers: getHeaders(token),
      cache: 'no-store',
    });
    return handleResponse(response) as Promise<{ invoices: PurchaseInvoice[] }>;
  },

  async createInvoice(payload: CreatePurchaseInvoiceInput, token?: string | null) {
    const response = await fetch('/api/purchasing/invoices', {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    return handleResponse(response) as Promise<PurchaseInvoice>;
  },

  async updateInvoiceStatus(invoiceId: string, status: PurchaseInvoiceStatus, token?: string | null) {
    const response = await fetch(`/api/purchasing/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response) as Promise<PurchaseInvoice>;
  },
};

export default purchasingService;


