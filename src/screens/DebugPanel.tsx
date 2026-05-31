import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import LocalLogger, { LocalLogEntry } from '../dev/Logger';

interface Props {
  onClose: () => void;
}

export function DebugPanel({ onClose }: Props) {
  const [logs, setLogs] = useState<LocalLogEntry[]>([]);
  const [systemState, setSystemState] = useState({
    websocket: 'DISCONNECTED',
    jsHeartbeat: 'UNKNOWN',
    nativeHeartbeat: 'UNKNOWN',
  });

  useEffect(() => {
    // Poll logs every second for the UI
    const interval = setInterval(() => {
      setLogs([...LocalLogger.getLogs()]);
      
      // We will read system state from AutoHeal later, but for now we extract from logs if possible
      // This will be properly hooked into the global state model later
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Debug Panel</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close X</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>WebSocket: {systemState.websocket}</Text>
        <Text style={styles.statusText}>JS Heartbeat: {systemState.jsHeartbeat}</Text>
        <Text style={styles.statusText}>Native Watchdog: {systemState.nativeHeartbeat}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.clearButton} onPress={() => {
          LocalLogger.clear();
          setLogs([]);
        }}>
          <Text style={styles.clearText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <View key={index} style={styles.logItem}>
            <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
            <Text style={styles.logEvent}>{log.event}</Text>
            {log.data && (
              <Text style={styles.logData}>{JSON.stringify(log.data)}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    zIndex: 10000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusBox: {
    padding: 16,
    backgroundColor: '#1f2937',
    margin: 16,
    borderRadius: 8,
  },
  statusText: {
    color: '#10b981',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  controls: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  clearButton: {
    padding: 8,
    backgroundColor: '#4b5563',
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  clearText: {
    color: '#fff',
  },
  logContainer: {
    flex: 1,
    padding: 16,
  },
  logItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#222',
    paddingBottom: 8,
  },
  logTime: {
    color: '#6b7280',
    fontSize: 12,
  },
  logEvent: {
    color: '#60a5fa',
    fontWeight: 'bold',
    marginTop: 2,
  },
  logData: {
    color: '#9ca3af',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  }
});
