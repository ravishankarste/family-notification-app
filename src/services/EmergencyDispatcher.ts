import { NativeModules } from 'react-native';
import LocalLogger from '../dev/Logger';

const { WatchdogModule } = NativeModules;

class EmergencyDispatcherService {
  async trigger(messageData: any) {
    LocalLogger.log('EMERGENCY_DISPATCHED_TO_NATIVE', { message: messageData });
    
    try {
      if (WatchdogModule && WatchdogModule.queueEmergencyEvent) {
        WatchdogModule.queueEmergencyEvent(JSON.stringify(messageData));
      } else {
        LocalLogger.log('NATIVE_MODULE_UNAVAILABLE_FALLBACK');
      }
    } catch (e: any) {
      LocalLogger.log('EMERGENCY_DISPATCH_FAILED', { error: e.message });
    }
  }

  async stop() {
    LocalLogger.log('EMERGENCY_STOPPED');
    // JS stop logic no longer applicable since native layer handles execution
  }
}

export const EmergencyDispatcher = new EmergencyDispatcherService();
