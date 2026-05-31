import RemoteLogger from './RemoteLogger';

export interface LocalLogEntry {
  timestamp: string;
  event: string;
  data?: any;
}

class LocalLogger {
  private static logs: LocalLogEntry[] = [];

  static log(event: string, data?: any) {
    const entry: LocalLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      data
    };
    
    // 1. Keep local history for the Debug Panel
    this.logs.unshift(entry); // Add to beginning
    
    // Keep max 500 logs locally
    if (this.logs.length > 500) {
      this.logs.pop();
    }

    console.log(`[${entry.timestamp}] ${event}`, data ? JSON.stringify(data) : '');

    // 2. Forward to Remote Logger (Supabase)
    RemoteLogger.log(event, data);
  }

  static getLogs() {
    return this.logs;
  }

  static clear() {
    this.logs = [];
  }
}

export default LocalLogger;
