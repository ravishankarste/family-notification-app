import { StatusBar } from 'expo-status-bar';
import React, { Component, ErrorInfo, useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, ActivityIndicator, Text, ScrollView } from 'react-native';
import { StoreProvider, useStore } from './src/lib/Store';
import ParentDashboard from './src/screens/ParentDashboard';
import ChildDashboard from './src/screens/ChildDashboard';
import SetupScreen from './src/screens/SetupScreen';

// Debug System
import { DebugGesture } from './src/dev/DebugGesture';
import { SecretDebug } from './src/dev/SecretDebug';
import { shakeDetector } from './src/dev/ShakeDetector';
import { DebugPanel } from './src/screens/DebugPanel';
import RemoteLogger from './src/dev/Logger'; // Local fallback handles remote forwarding

// Core System
import { AutoHeal } from './src/system/AutoHeal';

// Initialize the native foreground service (only on native platforms)
import { Platform } from 'react-native';
if (Platform.OS !== 'web') {
  require('./src/lib/ForegroundService');
}

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import crashlytics from '@react-native-firebase/crashlytics';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, errorInfo: ErrorInfo | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    crashlytics().recordError(error);
    console.error("Uncaught error:", error, errorInfo);
    try {
      const RemoteLoggerInstance = require('./src/dev/Logger').default;
      RemoteLoggerInstance.log('JS_ERROR', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    } catch (e) {
      console.error('Failed to log JS_ERROR', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'red' }}>
          <ScrollView style={{ padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 10 }}>FATAL APP CRASH</Text>
            <Text style={{ fontSize: 16, color: 'white', marginBottom: 20 }}>{this.state.error?.toString()}</Text>
            <Text style={{ fontSize: 12, color: 'white' }}>{this.state.errorInfo?.componentStack}</Text>
          </ScrollView>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { role, isRoleLoaded } = useStore();

  if (!isRoleLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  let content;
  if (role === null) {
    content = <SetupScreen />;
  } else if (role === 'parent') {
    content = <ParentDashboard />;
  } else {
    content = <ChildDashboard />;
  }

  return content;
}

export default function App() {
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // 1. Init AutoHeal engine (starts heartbeats & connection manager)
    AutoHeal.init();

    // 2. Register shake gesture
    shakeDetector.start(() => setShowDebug(true));

    return () => {
      AutoHeal.stop();
      shakeDetector.stop();
    };
  }, []);

  return (
    <ErrorBoundary>
      <StoreProvider>
        <DebugGesture onDoubleTap={() => setShowDebug(true)}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
              <MainApp />
              <StatusBar style="light" />
              
              {showDebug && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 99999 }]}>
                  <DebugPanel onClose={() => setShowDebug(false)} />
                </View>
              )}
              
              <SecretDebug onUnlock={() => setShowDebug(true)} />
            </View>
          </SafeAreaView>
        </DebugGesture>
      </StoreProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#171717',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
