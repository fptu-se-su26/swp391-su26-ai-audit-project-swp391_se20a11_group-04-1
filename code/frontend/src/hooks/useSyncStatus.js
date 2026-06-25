import { useState, useEffect } from 'react';

// Lightweight Native STOMP Client for WebSocket communication without external npm packages
class NativeStompClient {
  constructor(url, onConnect) {
    this.ws = new WebSocket(url);
    this.onConnect = onConnect;
    this.connected = false;
    this.callbacks = {};

    this.ws.onopen = () => {
      this.sendFrame('CONNECT', { 'accept-version': '1.1,1.0', 'heart-beat': '10000,10000' });
    };

    this.ws.onmessage = (evt) => {
      this.handleMessage(evt.data);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket STOMP error:", err);
    };

    this.ws.onclose = () => {
      console.log("WebSocket STOMP connection closed");
    };
  }

  sendFrame(command, headers, body = '') {
    let frame = command + '\n';
    for (let key in headers) {
      frame += key + ':' + headers[key] + '\n';
    }
    frame += '\n' + body + '\u0000';
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    }
  }

  subscribe(destination, callback) {
    const id = 'sub-' + Math.random().toString(36).substring(2, 9);
    this.callbacks[destination] = callback;
    if (this.connected) {
      this.sendFrame('SUBSCRIBE', { destination, id });
    } else {
      // Nếu chưa connect, lưu lại để connect xong thì subscribe
      this.pendingSubscriptions = this.pendingSubscriptions || [];
      this.pendingSubscriptions.push({ destination, id });
    }
    return {
      unsubscribe: () => {
        delete this.callbacks[destination];
        if (this.connected) {
          this.sendFrame('UNSUBSCRIBE', { id });
        }
      }
    };
  }

  handleMessage(data) {
    if (data.startsWith('CONNECTED')) {
      this.connected = true;
      if (this.onConnect) this.onConnect();
      if (this.pendingSubscriptions) {
        this.pendingSubscriptions.forEach(sub => {
          this.sendFrame('SUBSCRIBE', { destination: sub.destination, id: sub.id });
        });
        this.pendingSubscriptions = [];
      }
    } else if (data.startsWith('MESSAGE')) {
      const lines = data.split('\n');
      let destination = '';
      let bodyStart = -1;
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '') {
          bodyStart = i + 1;
          break;
        }
        if (lines[i].startsWith('destination:')) {
          destination = lines[i].substring(12).trim();
        }
      }
      
      if (bodyStart !== -1 && this.callbacks[destination]) {
        let body = lines.slice(bodyStart).join('\n').replace(/\u0000$/, '');
        this.callbacks[destination](destination, body);
      }
    }
  }

  disconnect() {
    if (this.connected) {
      this.sendFrame('DISCONNECT', {});
      this.connected = false;
    }
    this.ws.close();
  }
}

const useSyncStatus = (projectId) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);

    useEffect(() => {
        if (!projectId) return;

        // Use standard STOMP ws endpoint
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // In dev it might be localhost:8080 or mapped
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const wsUrl = baseUrl.replace('http', 'ws') + '/ws';
        
        let stompClient = new NativeStompClient(wsUrl, () => {
            stompClient.subscribe(`/topic/project/${projectId}/sync`, (dest, body) => {
                try {
                    const data = JSON.parse(body);
                    if (data.status === 'COMPLETED') {
                        setIsSyncing(true);
                        setLastSync(new Date(data.timestamp));
                        
                        setTimeout(() => {
                            setIsSyncing(false);
                        }, 2000);
                    }
                } catch (err) {
                    console.error("Error parsing sync message", err);
                }
            });
        });

        return () => {
            if (stompClient) {
                stompClient.disconnect();
            }
        };
    }, [projectId]);

    return { isSyncing, lastSync };
};

export default useSyncStatus;
