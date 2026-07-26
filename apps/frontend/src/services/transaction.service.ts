import { Transaction, Dispute, TransactionStats } from '../types/transaction.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Error en la solicitud');
  }
  return data.data;
};

// === Transactions ===

export const createTransaction = async (payload: {
  propertyId: number;
  amount: number;
  currency: string;
  notes?: string;
}): Promise<{ transaction: Transaction }> => {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const getMyTransactions = async (filters?: {
  status?: string;
  propertyId?: number;
}): Promise<{ transactions: Transaction[] }> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.propertyId) params.set('propertyId', String(filters.propertyId));
  const qs = params.toString();

  const response = await fetch(`${API_BASE_URL}/transactions/my${qs ? `?${qs}` : ''}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getTransactionDetails = async (id: number): Promise<{ transaction: Transaction }> => {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const approveTransaction = async (id: number): Promise<{ transaction: Transaction }> => {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const rejectTransaction = async (id: number, reason: string): Promise<{ transaction: Transaction }> => {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handleResponse(response);
};

export const submitPayment = async (
  id: number,
  data: {
    paymentMethod: string;
    paymentReference: string;
    paymentDate: string;
    paymentProof: File[];
  }
): Promise<{ transaction: Transaction }> => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('paymentMethod', data.paymentMethod);
  formData.append('paymentReference', data.paymentReference);
  formData.append('paymentDate', data.paymentDate);

  data.paymentProof.forEach((file) => {
    formData.append('paymentProof', file);
  });

  const response = await fetch(`${API_BASE_URL}/transactions/${id}/submit-payment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(response);
};

export const confirmPayment = async (id: number): Promise<{ transaction: Transaction }> => {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}/confirm-payment`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const cancelTransaction = async (id: number, reason: string): Promise<{ transaction: Transaction }> => {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handleResponse(response);
};

export const getTransactionByRentalRequest = async (rentalRequestId: number): Promise<{ transaction: Transaction }> => {
  const response = await fetch(`${API_BASE_URL}/transactions/by-rental-request/${rentalRequestId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getTransactionStats = async (): Promise<{ stats: TransactionStats }> => {
  const response = await fetch(`${API_BASE_URL}/transactions/stats`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getAllTransactions = async (filters?: {
  status?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}): Promise<{ transactions: Transaction[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
  const qs = params.toString();

  const response = await fetch(`${API_BASE_URL}/transactions${qs ? `?${qs}` : ''}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const refundTransaction = async (id: number, reason: string): Promise<{ transaction: Transaction }> => {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}/refund`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handleResponse(response);
};

// === Disputes ===

export const createDispute = async (
  data: {
    transactionId: number;
    reason: string;
    description: string;
    evidence: File[];
  }
): Promise<{ dispute: Dispute }> => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('transactionId', String(data.transactionId));
  formData.append('reason', data.reason);
  formData.append('description', data.description);

  data.evidence.forEach((file) => {
    formData.append('evidence', file);
  });

  const response = await fetch(`${API_BASE_URL}/disputes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(response);
};

export const getMyDisputes = async (): Promise<{ disputes: Dispute[] }> => {
  const response = await fetch(`${API_BASE_URL}/disputes/my`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getPendingDisputes = async (): Promise<{ disputes: Dispute[] }> => {
  const response = await fetch(`${API_BASE_URL}/disputes/pending`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const getDisputeDetails = async (id: number): Promise<{ dispute: Dispute }> => {
  const response = await fetch(`${API_BASE_URL}/disputes/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const resolveDispute = async (
  id: number,
  data: { decision: 'refund' | 'release' | 'cancel'; notes: string }
): Promise<{ dispute: Dispute }> => {
  const response = await fetch(`${API_BASE_URL}/disputes/${id}/resolve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const markDisputeUnderReview = async (id: number): Promise<{ dispute: Dispute }> => {
  const response = await fetch(`${API_BASE_URL}/disputes/${id}/review`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};
