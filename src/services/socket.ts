import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token')
  },
  withCredentials: true
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.auth = { token: localStorage.getItem('token') };
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Add error handling and logging
socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
});

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

// Add reconnection handling
socket.on('reconnect', (attemptNumber) => {
  console.log('Socket reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_error', (err) => {
  console.error('Socket reconnection error:', err.message);
});

socket.on('reconnect_failed', () => {
  console.error('Socket reconnection failed');
});

export default socket;