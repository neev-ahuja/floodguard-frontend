import type { SupabaseCitizen, EmergencyMessage, AuditLog } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  
  // Set default credentials and headers
  const defaultOptions: RequestInit = {
    ...options,
    credentials: 'include', // Important for session cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
    adminLogin(username: string, password: string) {
      return request<{ success: boolean; username: string; warning: string | null }>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    },
    
    adminLogout() {
      return request<{ success: boolean }>('/api/auth/admin/logout', {
        method: 'POST',
      });
    },
    
    validateCitizen(token: string) {
      return request<{ success: boolean; citizen: { id: number; name: string } }>('/api/auth/citizen/validate', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },
    
    citizenLogout() {
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
