import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore, DeviceRole } from '../lib/Store';

export default function SetupScreen() {
  const { setDeviceRole } = useStore();
  const [confirmRole, setConfirmRole] = useState<DeviceRole>(null);

  const handleSelectRole = (role: DeviceRole) => {
    setConfirmRole(role);
  };

  const handleConfirm = () => {
    if (confirmRole) {
      setDeviceRole(confirmRole);
    }
  };

  const handleCancel = () => {
    setConfirmRole(null);
  };

  if (confirmRole) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Are you sure?</Text>
        <Text style={styles.subtitle}>
          You are about to lock this device as the <Text style={styles.highlight}>{confirmRole.toUpperCase()}</Text> device.
        </Text>
        
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Yes, I am sure</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.buttonText}>No, go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Please select the role for this device.</Text>

      <TouchableOpacity 
        style={[styles.button, styles.parentButton]} 
        onPress={() => handleSelectRole('parent')}
      >
        <Text style={styles.buttonText}>I am the Parent</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.childButton]} 
        onPress={() => handleSelectRole('child')}
      >
        <Text style={styles.buttonText}>I am the Child</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a3a3a3',
    marginBottom: 48,
    textAlign: 'center',
  },
  highlight: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  parentButton: {
    backgroundColor: '#3b82f6',
  },
  childButton: {
    backgroundColor: '#10b981',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
    width: '100%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: '#3f3f46',
    width: '100%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
