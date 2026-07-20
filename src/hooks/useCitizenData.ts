import { useState, useEffect, useCallback, useRef } from 'react';
import type { SupabaseCitizen, EmergencyMessage } from '../types';
import { api } from '../api/client';
import { supabasePublic } from '../supabase';

export function useCitizenData() {
  const [citizen, setCitizen] = useState<SupabaseCitizen | null>(null);
  const [messages, setMessages] = useState<EmergencyMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'realtime' | 'polling' | 'connecting'>('connecting');
  
  const citizenIdRef = useRef<number | null>(null);

  // Fetch full profile and messages
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [profileRes, messagesRes] = await Promise.all([
        api.citizen.getProfile(),
        api.citizen.getMessages(),
      ]);
      
      setCitizen(profileRes.citizen);
      setMessages(messagesRes.messages);
      citizenIdRef.current = profileRes.citizen.id;
    } catch (err: any) {
      setError(err.message || 'Failed to load citizen data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up Realtime or Polling Fallback
  useEffect(() => {
    if (loading || !citizen) return;

    let messageChannel: any = null;
    let citizenChannel: any = null;
    let pollInterval: any = null;

    if (supabasePublic && citizen.id) {
      setConnectionStatus('realtime');

      // Subscribe to messages for this citizen
      messageChannel = supabasePublic
        .channel(`citizen-messages-${citizen.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `citizen_id=eq.${citizen.id}`,
          },
          (payload) => {
            const rawMessage = payload.new as any;
            const newMessage: EmergencyMessage = {
              ...rawMessage,
              sender_type: rawMessage.sender || rawMessage.sender_type || 'CITIZEN',
            };
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `citizen_id=eq.${citizen.id}`,
          },
          (payload) => {
            const rawMessage = payload.new as any;
            const updatedMessage: EmergencyMessage = {
              ...rawMessage,
              sender_type: rawMessage.sender || rawMessage.sender_type || 'CITIZEN',
            };
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
            );
          }
        )
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.warn('[Realtime] Message subscription status:', status);
          }
        });

      // Subscribe to updates on the citizen record itself
      citizenChannel = supabasePublic
        .channel(`citizen-profile-${citizen.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'citizens',
            filter: `id=eq.${citizen.id}`,
          },
          (payload) => {
            const updated = payload.new as SupabaseCitizen;
            setCitizen(updated);
          }
        )
        .subscribe();
    } else {
      // Fallback: poll every 4 seconds
      setConnectionStatus('polling');
      pollInterval = setInterval(async () => {
        try {
          const [profileRes, messagesRes] = await Promise.all([
            api.citizen.getProfile(),
            api.citizen.getMessages(),
          ]);
          setCitizen(profileRes.citizen);
          setMessages(messagesRes.messages);
        } catch (err) {
          console.warn('[Polling] Failed to poll updates:', err);
        }
      }, 4000);
    }

    return () => {
      if (messageChannel) supabasePublic?.removeChannel(messageChannel);
      if (citizenChannel) supabasePublic?.removeChannel(citizenChannel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [loading, citizen?.id]);

  // Send a message
  const sendMessage = useCallback(async (text: string) => {
    try {
      const res = await api.citizen.sendMessage(text);
      // Optimistic update
      setMessages((prev) => [...prev, res.message]);
      return res.message;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send message.');
    }
  }, []);

  // Update Status
  const updateStatus = useCallback(async (action: 'SAFE' | 'HELP' | 'MEDICAL' | 'EVACUATION', notes?: string) => {
    try {
      const res = await api.citizen.updateStatus(action, notes);
      // Fetch fresh profile details after status update
      await fetchData();
      return res;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update status.');
    }
  }, [fetchData]);

  return {
    citizen,
    messages,
    loading,
    error,
    connectionStatus,
    sendMessage,
    updateStatus,
    refetch: fetchData,
  };
}
