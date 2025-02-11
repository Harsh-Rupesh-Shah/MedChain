import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token')
  }
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

socket.on('connect_error', (err) => {
  console.error('Socket connection error:', err.message);
});