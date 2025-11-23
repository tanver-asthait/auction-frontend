import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  
  // Signals for connection state
  connected = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {}

  connect(url: string = 'http://localhost:3000'): void {
    if (this.socket?.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected.set(true);
      this.error.set(null);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected.set(false);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('WebSocket connection error:', err);
      this.error.set(err.message);
      this.connected.set(false);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected.set(false);
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.error('Cannot emit: WebSocket not connected');
      this.error.set('WebSocket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  on<T = any>(event: string, callback: (data: T) => void): void {
    if (!this.socket) {
      console.error('Cannot listen: WebSocket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  once<T = any>(event: string, callback: (data: T) => void): void {
    if (!this.socket) {
      console.error('Cannot listen once: WebSocket not initialized');
      return;
    }
    this.socket.once(event, callback);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
