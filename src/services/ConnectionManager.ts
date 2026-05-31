import { supabase } from '../lib/supabase';
import LocalLogger from '../dev/Logger';
import { EmergencyDispatcher } from './EmergencyDispatcher';

class ConnectionManagerService {
  private channel: any = null;
  private heartbeatInterval: any = null;
  private reconnectTimeout: any = null;
  
  private lastMsgTime = Date.now();
  public state = 'DISCONNECTED';
  
  private HEARTBEAT_DELAY = 15000; // 15 seconds
  private FREEZE_DELAY = 30000;    // 30 seconds

  connect() {
    this.cleanup();
    this.state = 'CONNECTING';
    LocalLogger.log('WS_CONNECTING');

    this.channel = supabase.channel('emergency-monitor');

    this.channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        this.lastMsgTime = Date.now();
        const newMessage = payload.new as any;
        
        LocalLogger.log('WS_MESSAGE', { eventType: payload.eventType, type: newMessage?.type });

        if (payload.eventType === 'INSERT' && newMessage.type === 'emergency') {
          EmergencyDispatcher.trigger(newMessage);
        } else if (payload.eventType === 'UPDATE' && newMessage.read === true) {
          EmergencyDispatcher.stop();
        }
      })
      .on('broadcast', { event: 'pong' }, () => {
        // Native or server replied to our ping
        this.lastMsgTime = Date.now();
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.state = 'CONNECTED';
          LocalLogger.log('WS_CONNECTED');
          this.startHeartbeat();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.fail();
        }
      });
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(() => {
      // Send ping broadcast
      if (this.state === 'CONNECTED' && this.channel) {
        this.channel.send({
          type: 'broadcast',
          event: 'ping',
          payload: { timestamp: Date.now() }
        }).catch(() => {});
      }

      // Freeze detection
      if (Date.now() - this.lastMsgTime > this.FREEZE_DELAY) {
        LocalLogger.log('HEARTBEAT_STALE', { delay: Date.now() - this.lastMsgTime });
        this.forceReconnect();
      }
    }, this.HEARTBEAT_DELAY);
  }

  private forceReconnect() {
    LocalLogger.log('FORCE_RECONNECT');
    this.cleanup();
    this.fail();
  }

  private fail() {
    if (this.state !== 'DISCONNECTED') {
      this.state = 'DISCONNECTED';
      LocalLogger.log('WS_DISCONNECTED');
    }
    
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 2000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }

  cleanup() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.stopHeartbeat();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
  }
}

export const ConnectionManager = new ConnectionManagerService();
