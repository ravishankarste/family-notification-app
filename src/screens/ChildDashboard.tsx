import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useStore } from '../lib/Store';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

export default function ChildDashboard() {
  const { setDeviceRole } = useStore();

  // We MUST keep the push notification registration so the server knows where to send the FCM wake signal!
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        savePushTokenToSupabase(token);
      }
    });
  }, []);

  const savePushTokenToSupabase = async (token: string) => {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ role: 'child', token }, { onConflict: 'token' });
    if (error) {
      console.error('Error saving push token:', error);
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } catch (e) {
        console.error(e);
      }
    }
    return token;
  }

  return (
    <View style={styles.idleContainer}>
      <TouchableOpacity style={styles.resetButtonTopRight} onPress={() => setDeviceRole(null)}>
        <Text style={styles.resetButtonTextTopRight}>Reset</Text>
      </TouchableOpacity>
      
      <Text style={styles.idleText}>Emergency System Active</Text>
      <Text style={styles.idleSubtext}>Status: Monitoring via FCM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  idleContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleText: {
    color: '#10b981',
    fontSize: 22,
    fontWeight: 'bold',
  },
  idleSubtext: {
    color: '#3f3f46',
    marginTop: 8,
    fontSize: 16,
  },
  resetButtonTopRight: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  resetButtonTextTopRight: {
    color: '#3f3f46',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
