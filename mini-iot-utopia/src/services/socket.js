import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to telemetry updates
  onTelemetryUpdate(callback) {
    if (!this.socket) this.connect();
    
    this.socket.on('telemetry:update', callback);
    
    // Store callback for cleanup
    this.listeners.set('telemetry:update', callback);
  }

  // Unsubscribe from telemetry updates
  offTelemetryUpdate() {
    if (this.socket) {
      const callback = this.listeners.get('telemetry:update');
      if (callback) {
        this.socket.off('telemetry:update', callback);
        this.listeners.delete('telemetry:update');
      }
    }
  }

  // Authenticate socket connection (optional)
  authenticate(token) {
    if (this.socket) {
      this.socket.emit('authenticate', { token });
    }
  }

  // Get connection status
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
