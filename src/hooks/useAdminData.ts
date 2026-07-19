import { useState, useEffect, useCallback, useRef } from 'react';
import type { SupabaseCitizen, EmergencyMessage, AuditLog } from '../types';
import { api } from '../api/client';
import { supabasePublic } from '../supabase';

export function useAdminData() {
  const [citizens, setCitizens] = useState<SupabaseCitizen[]>([]);
  const [selectedCitizenId, setSelectedCitizenId] = useState<number | null>(null);
  const [messages, setMessages] = useState<EmergencyMessage[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'realtime' | 'polling' | 'connecting'>('connecting');

  const selectedCitizenIdRef = useRef<number | null>(null);
  selectedCitizenIdRef.current = selectedCitizenId;

  // Fetch initial global admin dashboard states
  const fetchGlobalData = useCallback(async () => {
    try {
      setError(null);
      const [citizensRes, statsRes, logsRes] = await Promise.all([
        api.admin.getCitizens(),
        api.admin.getDashboard(),
        api.admin.getAuditLogs(30),
      ]);
      setCitizens(citizensRes.citizens);
      setDashboardStats(statsRes.stats);
      setAuditLogs(logsRes.logs);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch messages for selected citizen
  const fetchCitizenMessages = useCallback(async (id: number) => {
    setMessagesLoading(true);
    try {
      const res = await api.admin.getCitizenMessages(id);
      setMessages(res.messages);
    } catch (err: any) {
      console.error('Failed to load messages for citizen:', id, err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Fetch global data on mount
  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  // Fetch messages when selected citizen changes
  useEffect(() => {
    if (selectedCitizenId !== null) {
      fetchCitizenMessages(selectedCitizenId);
    } else {
      setMessages([]);
    }
  }, [selectedCitizenId, fetchCitizenMessages]);

  // Set up Realtime or Polling
  useEffect(() => {
    if (loading) return;

    let citizensChannel: any = null;
    let messagesChannel: any = null;
    let logsChannel: any = null;
    let pollInterval: any = null;

    if (supabasePublic) {
      setConnectionStatus('realtime');

      // Subscribe to all updates on citizens table
      citizensChannel = supabasePublic
        .channel('admin-citizens-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'citizens' },
          async (payload) => {
            // Hot update citizens list
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as SupabaseCitizen;
              setCitizens((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              );
            } else if (payload.eventType === 'INSERT') {
              const inserted = payload.new as SupabaseCitizen;
              setCitizens((prev) => [inserted, ...prev]);
            }
            // Recalculate dashboard aggregates
            const statsRes = await api.admin.getDashboard();
            setDashboardStats(statsRes.stats);
          }
        )
        .subscribe();

      // Subscribe to new emergency messages
      messagesChannel = supabasePublic
        .channel('admin-messages-updates')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'emergency_messages' },
          async (payload) => {
            const newMessage = payload.new as EmergencyMessage;
            
            // If message is for currently viewed citizen, append it
            if (selectedCitizenIdRef.current === newMessage.citizen_id) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });
            }
            
            // Re-fetch dashboard stats to update unread counts
            const statsRes = await api.admin.getDashboard();
            setDashboardStats(statsRes.stats);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'emergency_messages' },
          (payload) => {
            const updatedMessage = payload.new as EmergencyMessage;
            if (selectedCitizenIdRef.current === updatedMessage.citizen_id) {
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
              );
            }
          }
        )
        .subscribe();

      // Subscribe to new audit logs
      logsChannel = supabasePublic
        .channel('admin-audit-updates')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'audit_logs' },
          (payload) => {
            const newLog = payload.new as AuditLog;
            setAuditLogs((prev) => [newLog, ...prev.slice(0, 29)]);
          }
        )
        .subscribe();

    } else {
      setConnectionStatus('polling');
      pollInterval = setInterval(async () => {
        try {
          const [citizensRes, statsRes, logsRes] = await Promise.all([
            api.admin.getCitizens(),
            api.admin.getDashboard(),
            api.admin.getAuditLogs(30),
          ]);
          setCitizens(citizensRes.citizens);
          setDashboardStats(statsRes.stats);
          setAuditLogs(logsRes.logs);

          // Poll messages for active citizen
          if (selectedCitizenIdRef.current !== null) {
            const messagesRes = await api.admin.getCitizenMessages(selectedCitizenIdRef.current);
            setMessages(messagesRes.messages);
          }
        } catch (err) {
          console.warn('[Admin Polling] Failed to fetch updates:', err);
        }
      }, 4000);
    }

    return () => {
      if (citizensChannel) supabasePublic?.removeChannel(citizensChannel);
      if (messagesChannel) supabasePublic?.removeChannel(messagesChannel);
      if (logsChannel) supabasePublic?.removeChannel(logsChannel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [loading]);

  // Reply to citizen
  const sendReply = useCallback(async (text: string) => {
    const activeId = selectedCitizenIdRef.current;
    if (activeId === null) return;
    
    try {
      const res = await api.admin.sendAdminMessage(activeId, text);
      setMessages((prev) => [...prev, res.message]);
      return res.message;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send reply.');
    }
  }, []);

  // Update citizen status from admin panel
  const updateCitizenStatus = useCallback(async (citizenId: number, status: 'SAFE' | 'ALERTED' | 'URGENT' | 'RESOLVED') => {
    try {
      await api.admin.updateCitizenStatus(citizenId, status);
      // Hot update in state
      setCitizens((prev) =>
        prev.map((c) => (c.id === citizenId ? { ...c, status } : c))
      );
      // Update stats
      const statsRes = await api.admin.getDashboard();
      setDashboardStats(statsRes.stats);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update status.');
    }
  }, []);

  return {
    citizens,
    selectedCitizenId,
    setSelectedCitizenId,
    messages,
    messagesLoading,
    dashboardStats,
    auditLogs,
    loading,
    error,
    connectionStatus,
    sendReply,
    updateCitizenStatus,
    refetch: fetchGlobalData,
  };
}
