import api from './api';

// Types
export interface AdminUser {
  _id: string;
  email: string;
  role: 'admin';
  createdAt: string;
}

export interface VerificationRequest {
  _id: string;
  freelancerId: string;
  fullName: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalJobs: number;
  totalTransactions: number;
  pendingVerifications: number;
  revenue: number;
}

export const adminService = {
  // Authentication
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/admin/login', { email, password });
    
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  },

  // Verifications
  getPendingVerifications: async (): Promise<VerificationRequest[]> => {
    const response = await api.get('/admin/verifications/pending');
    return response.data.data;
  },

  approveFreelancer: async (profileId: string, freelancerId: string) => {
    const response = await api.post(`/admin/verifications/${profileId}/approve`, { freelancerId });
    return response.data;
  },

  rejectFreelancer: async (profileId: string, rejectionReason: string) => {
    const response = await api.post(`/admin/verifications/${profileId}/reject`, { rejectionReason });
    return response.data;
  },

  // Statistics
  getStats: async (): Promise<PlatformStats> => {
    const response = await api.get('/admin/stats');
    return response.data.data;
  },

  getDashboardData: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  // User Management
  getUsers: async (role?: string) => {
    const params = role ? { role } : {};
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  },

  getUserDetails: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data.data;
  },

  // Job Management
  getJobs: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/jobs', { params });
    return response.data.data;
  },

  getJobDetails: async (jobId: string) => {
    const response = await api.get(`/admin/jobs/${jobId}`);
    return response.data.data;
  },

  // Transaction Management
  getTransactions: async () => {
    const response = await api.get('/admin/transactions');
    return response.data.data;
  },

  processWithdrawal: async (transactionId: string, action: string) => {
    const response = await api.post(`/admin/transactions/${transactionId}/process-withdrawal`, { action });
    return response.data;
  },

  // Platform Management
  getPlatformStats: async () => {
    const response = await api.get('/admin/platform-stats');
    return response.data.data;
  },

  getRevenueData: async () => {
    const response = await api.get('/admin/revenue');
    return response.data.data;
  }
};
