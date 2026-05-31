import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type MessageType = 'silent' | 'normal' | 'emergency';
export type DeviceRole = 'parent' | 'child' | null;

export interface Message {
  id: string; // uuid
  created_at: string;
  text: string;
  type: MessageType;
  read: boolean;
}

interface StoreContextType {
  role: DeviceRole;
  isRoleLoaded: boolean;
  messages: Message[];
  setDeviceRole: (role: DeviceRole) => Promise<void>;
  sendMessage: (text: string, forceEmergency?: boolean) => void;
  markAsRead: (id: string) => void;
  isSchoolHours: () => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function isCurrentlySchoolHours(): boolean {
  const date = new Date();
  const hour = date.getHours();
  // School hours: 9:00 AM (9) to 3:59 PM (15).
  return hour >= 9 && hour < 16;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [role, setRole] = useState<DeviceRole>(null);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);

  useEffect(() => {
    // Load the saved role on startup
    const loadRole = async () => {
      try {
        const savedRole = await AsyncStorage.getItem('DEVICE_ROLE');
        if (savedRole === 'parent' || savedRole === 'child') {
          setRole(savedRole as DeviceRole);
        }
      } catch (e) {
        console.error('Failed to load role', e);
      } finally {
        setIsRoleLoaded(true);
      }
    };
    
    // Sign in anonymously to get a stable session (useful for future Push Notifications & RLS)
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
    };

    loadRole();
    initAuth();

    // 1. Fetch initial messages (only unread to keep it light for MVP)
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('family_app_messages')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        setMessages(data as Message[]);
      }
    };

    fetchMessages();

    // 2. Subscribe to realtime inserts and updates
    const channel = supabase
      .channel('public:family_app_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'family_app_messages' },
        (payload) => {
          console.log('New message received!', payload.new);
          setMessages((prev) => [payload.new as Message, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'family_app_messages' },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? (payload.new as Message) : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setDeviceRole = async (newRole: DeviceRole) => {
    try {
      if (newRole === null) {
        await AsyncStorage.removeItem('DEVICE_ROLE');
      } else {
        await AsyncStorage.setItem('DEVICE_ROLE', newRole);
      }
      setRole(newRole);
    } catch (e) {
      console.error('Failed to save role', e);
    }
  };

  const sendMessage = async (text: string, forceEmergency: boolean = false) => {
    let type: MessageType = 'normal';
    
    if (forceEmergency) {
      type = 'emergency';
    } else if (isCurrentlySchoolHours()) {
      type = 'silent';
    }

    const { error } = await supabase
      .from('family_app_messages')
      .insert([
        { text, type, read: false }
      ]);

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Is your Supabase configured correctly?');
      return;
    }

    // Attempt to send Push Notification
    try {
      const { data, error: tokenError } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('role', 'child')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.token) {
        await sendPushNotification(data.token, text, type);
      }
    } catch (e) {
      console.error('Failed to query or send push:', e);
    }
  };

  const sendPushNotification = async (expoPushToken: string, text: string, type: MessageType) => {
    // For normal messages, we want the Android OS to show a banner.
    // For EMERGENCY messages, we want a purely "Data-Only" payload. 
    // If an emergency has a title/body, FCM intercepts it and blocks our background JavaScript task!
    
    let message: any = {
      to: expoPushToken,
      data: { type, text }, // Always pass text in data so background task can read it
    };

    if (type !== 'emergency') {
      message.title = 'New Family Message';
      message.body = text;
      message.sound = type === 'silent' ? null : 'default';
      message.channelId = 'default';
    } else {
      // EMERGENCY: Data-only, no title/body. 
      // We set priority high to wake the phone's networking stack
      message.priority = 'high';
    }

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, read: true } : msg))
    );

    const { error } = await supabase
      .from('family_app_messages')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        role,
        isRoleLoaded,
        messages,
        setDeviceRole,
        sendMessage,
        markAsRead,
        isSchoolHours: isCurrentlySchoolHours,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
