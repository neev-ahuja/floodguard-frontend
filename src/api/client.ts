import type { SupabaseCitizen, EmergencyMessage, AuditLog } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://floodguard-backend-2cri.onrender.com';

export const setStoredAuthToken = (token: string | null, role: 'citizen' | 'admin') => {
  if (token) {
    localStorage.setItem(`floodguard_token_${role}`, token);
    localStorage.setItem('floodguard_role', role);
  } else {
    localStorage.removeItem(`floodguard_token_${role}`);
    localStorage.removeItem('floodguard_role');
  }
};

export const getStoredAuthToken = (): { token: string | null; role: string | null } => {
  const role = localStorage.getItem('floodguard_role');
  const token = role ? localStorage.getItem(`floodguard_token_${role}`) : null;
  return { token, role };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { token, role } = getStoredAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    if (role === 'citizen') headers['X-Citizen-Token'] = token;
    if (role === 'admin') headers['X-Admin-Token'] = token;
  }

  const defaultOptions: RequestInit = {
    ...options,
    credentials: 'include', // Important for session cookies
    headers,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error: any) {
    console.error(`[API Client Error] ${path}:`, error);
    throw error;
  }
}

export const api = {
  // Authentication
  auth: {
    async adminLogin(username: string, password: string) {
      const res = await request<{ success: boolean; username: string; token?: string; warning: string | null }>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (res.success) {
        setStoredAuthToken(res.token || 'admin-authenticated-token', 'admin');
      }
      return res;
    },
    
    async adminLogout() {
      setStoredAuthToken(null, 'admin');
      return request<{ success: boolean }>('/api/auth/admin/logout', {
        method: 'POST',
      });
    },
    
    async validateCitizen(token: string) {
      const res = await request<{ success: boolean; token?: string; citizen: { id: number; name: string } }>('/api/auth/citizen/validate', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      if (res.success) {
        setStoredAuthToken(res.token || token, 'citizen');
      }
      return res;
    },
    
    async citizenLogout() {
      setStoredAuthToken(null, 'citizen');
      return request<{ success: boolean }>('/api/auth/citizen/logout', {
        method: 'POST',
      });
    },
    
    getSession() {
      return request<{
        role: 'admin' | 'citizen' | null;
        username?: string;
        citizen?: { id: number; name: string };
      }>('/api/auth/session');
    },
  },

  // Citizen Portal
  citizen: {
    getProfile() {
      return request<{ citizen: SupabaseCitizen }>('/api/citizen/profile');
    },
    
    getMessages() {
      return request<{ messages: EmergencyMessage[] }>('/api/citizen/messages');
    },
    
    sendMessage(message: string) {
      return request<{ message: EmergencyMessage }>('/api/citizen/messages', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    
    updateStatus(action: 'SAFE' | 'HELP' | 'MEDICAL' | 'EVACUATION', notes?: string) {
      return request<{ success: boolean; status: string; category?: string }>('/api/citizen/status', {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      });
    },
  },

  // Admin Portal
  admin: {
    getCitizens() {
      return request<{ citizens: SupabaseCitizen[] }>('/api/admin/citizens');
    },
    
    getCitizenMessages(citizenId: number) {
      return request<{ messages: EmergencyMessage[] }>(`/api/admin/citizens/${citizenId}/messages`);
    },
    
    sendAdminMessage(citizenId: number, message: string) {
      return request<{ message: EmergencyMessage }>(`/api/admin/citizens/${citizenId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    
    updateCitizenStatus(citizenId: number, status: 'SAFE' | 'ALERTED' | 'URGENT' | 'RESOLVED') {
      return request<{ success: boolean; status: string }>(`/api/admin/citizens/${citizenId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    
    getDashboard() {
      return request<{
        stats: {
          total: number;
          safe: number;
          alerted: number;
          urgent: number;
          resolved: number;
          highRisk: number;
          mobilityIssues: number;
          withChildren: number;
          withElderly: number;
          unreadMessages: number;
          activeConversations: number;
        };
      }>('/api/admin/dashboard');
    },
    
    getAuditLogs(limit?: number) {
      const query = limit ? `?limit=${limit}` : '';
      return request<{ logs: AuditLog[] }>(`/api/admin/audit-logs${query}`);
    },
  },
};
