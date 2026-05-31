import { supabase } from '../lib/supabase';
import { getDeviceId } from './deviceId';

interface LogEntry {
  event: string;
  data: any;
  timestamp: string;
}

class RemoteLoggerService {
  private queue: LogEntry[] = [];
  private flushInterval: any = null;
  private readonly FLUSH_DELAY = 15000; // 15 seconds

  constructor() {
    this.startBatching();
  }

  log(event: string, data?: any) {
    this.queue.push({
      event,
      data: data || {},
      timestamp: new Date().toISOString()
    });

    // If queue gets too large, force a flush to avoid memory issues
    if (this.queue.length > 50) {
      this.flush();
    }
  }

  private startBatching() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_DELAY);
  }

  private async flush() {
    if (this.queue.length === 0) return;

    // Take snapshot of current queue and clear it immediately
    // so incoming logs don't get lost while flushing
    const batch = [...this.queue];
    this.queue = [];

    try {
      const deviceId = await getDeviceId();
      
      const payload = batch.map(log => ({
        device_id: deviceId,
        event: log.event,
        data: log.data,
        created_at: log.timestamp
      }));

      const { error } = await supabase.from('debug_logs').insert(payload);
      
      if (error) {
        console.error('RemoteLogger Flush Error:', error);
        // Put them back in queue if we failed, but limit total queue size
        if (this.queue.length < 200) {
          this.queue = [...batch, ...this.queue];
        }
      }
    } catch (e) {
      console.error('RemoteLogger Critical Exception:', e);
      if (this.queue.length < 200) {
        this.queue = [...batch, ...this.queue];
      }
    }
  }

  // Force flush immediately (useful for crashes)
  async forceFlush() {
    await this.flush();
  }
}

export const RemoteLogger = new RemoteLoggerService();
export default RemoteLogger;
