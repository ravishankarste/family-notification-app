import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, KeyboardAvoidingView, ScrollView, Platform, TouchableWithoutFeedback } from 'react-native';
import { useStore } from '../lib/Store';

export default function ParentDashboard() {
  const { sendMessage, isSchoolHours, setDeviceRole } = useStore();
  const [text, setText] = useState('');

  const handleSendNormal = () => {
    if (!text.trim()) return;
    sendMessage(text, false);
    setText('');
    Keyboard.dismiss();
  };

  const handleSendEmergency = () => {
    if (!text.trim()) return;
    sendMessage(text, true);
    setText('');
    Keyboard.dismiss();
  };

  const schoolHours = isSchoolHours();

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.resetButtonTopRight} onPress={() => setDeviceRole(null)}>
            <Text style={styles.resetButtonTextTopRight}>Reset</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Parent Dashboard</Text>
      
      <View style={styles.statusBox}>
        <Text style={styles.statusTitle}>Current Delivery Mode:</Text>
        <Text style={[styles.statusText, schoolHours ? styles.statusSilent : styles.statusNormal]}>
          {schoolHours ? 'School Hours (Silent Delivery)' : 'Standard Delivery'}
        </Text>
        <Text style={styles.statusDesc}>
          {schoolHours 
            ? 'Messages sent now will only vibrate their phone to avoid disrupting class.' 
            : 'Messages sent now will trigger normal notification sounds.'}
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor="#9ca3af"
        value={text}
        onChangeText={setText}
        multiline
      />

      <TouchableOpacity 
        style={[styles.button, schoolHours ? styles.buttonSilent : styles.buttonNormal]} 
        onPress={handleSendNormal}
      >
        <Text style={styles.buttonText}>
          {schoolHours ? 'Send Message (Silent)' : 'Send Message'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.warningText}>
        Use the button below ONLY for true emergencies. It will bypass silent mode and play a loud sound.
      </Text>

      <TouchableOpacity 
        style={styles.buttonEmergency} 
        onPress={handleSendEmergency}
      >
        <Text style={styles.buttonTextEmergency}>🚨 SEND EMERGENCY OVERRIDE 🚨</Text>
      </TouchableOpacity>

      </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  statusTitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusSilent: {
    color: '#60a5fa', // Blue
  },
  statusNormal: {
    color: '#4ade80', // Green
  },
  statusDesc: {
    color: '#d1d5db',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#262626',
    color: '#ffffff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSilent: {
    backgroundColor: '#3b82f6', // Blue
  },
  buttonNormal: {
    backgroundColor: '#22c55e', // Green
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#404040',
    marginVertical: 32,
  },
  warningText: {
    color: '#ef4444', // Red
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonEmergency: {
    backgroundColor: '#dc2626', // Deep Red
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonTextEmergency: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonTopRight: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  resetButtonTextTopRight: {
    color: '#737373',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
