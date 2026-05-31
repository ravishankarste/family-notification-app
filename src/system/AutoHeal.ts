import { NativeModules, DeviceEventEmitter } from 'react-native';
import LocalLogger from '../dev/Logger';
import { ConnectionManager } from '../services/ConnectionManager';

const { WatchdogModule } = NativeModules;

export interface SystemState {
  nativeAlive: boolean;
  jsAlive: boolean;
  websocketState: string;
  lastJsHeartbeat: number;
  lastNativeHeartbeat: number;
  healLevel: 1 | 2 | 3 | 4;
}

class AutoHealEngine {
  private jsHeartbeatInterval: any = null;
  private healthCheckInterval: any = null;
  private nativeListener: any = null;

  public state: SystemState = {
    nativeAlive: false,
    jsAlive: true,
    websocketState: 'DISCONNECTED',
    lastJsHeartbeat: Date.now(),
    lastNativeHeartbeat: 0,
    healLevel: 1
  };

  init() {
    LocalLogger.log('AUTOHEAL_INIT');
    this.startJsHeartbeat();
    this.startHealthCheck();
    this.listenToNative();
    
    // Initial connect
    ConnectionManager.connect();
  }

  private startJsHeartbeat() {
    if (this.jsHeartbeatInterval) clearInterval(this.jsHeartbeatInterval);
    
    this.jsHeartbeatInterval = setInterval(() => {
      this.state.lastJsHeartbeat = Date.now();
      this.state.jsAlive = true;
      this.state.websocketState = ConnectionManager.state;
      
      // Emit to Native
      try {
        if (WatchdogModule && WatchdogModule.onJsAlive) {
          WatchdogModule.onJsAlive();
        }
      } catch (e) {
        // Native module might not be linked yet
      }
    }, 10000); // 10 seconds
  }

  private listenToNative() {
    if (this.nativeListener) this.nativeListener.remove();
    
    this.nativeListener = DeviceEventEmitter.addListener('NATIVE_HEARTBEAT', () => {
      this.state.lastNativeHeartbeat = Date.now();
      this.state.nativeAlive = true;
      LocalLogger.log('NATIVE_HEARTBEAT_ACK');
    });
  }

  private startHealthCheck() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);

    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      
      // We don't check JS frozen here because if JS is frozen, this setInterval won't run!
      // Native Watchdog checks if JS is frozen.
      // But we can check if WebSocket is dead or native is dead.

      // 1. Check WebSocket health (escalation level 1)
      if (ConnectionManager.state === 'DISCONNECTED') {
        LocalLogger.log('AUTOHEAL_LEVEL_1_WS_RECONNECT');
        this.state.healLevel = 1;
        ConnectionManager.connect();
      }

      // 2. Check Native health
      // If we expect native heartbeat but haven't seen it in 30s
      if (this.state.lastNativeHeartbeat > 0 && now - this.state.lastNativeHeartbeat > 30000) {
        LocalLogger.log('AUTOHEAL_NATIVE_FROZEN', { delay: now - this.state.lastNativeHeartbeat });
        this.state.nativeAlive = false;
        
        // Try to restart native service via bridging
        try {
          if (WatchdogModule && WatchdogModule.startService) {
            WatchdogModule.startService();
          }
        } catch (e) {}
      }
    }, 15000); // 15 seconds
  }

  stop() {
    if (this.jsHeartbeatInterval) clearInterval(this.jsHeartbeatInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.nativeListener) this.nativeListener.remove();
  }
}

export const AutoHeal = new AutoHealEngine();
