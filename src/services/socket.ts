import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export const connectSocket = () => {
  if (!socket.connected) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for socket connection');
      return;
    }

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    // Create new socket instance with auth token
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Connect the socket
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinRoom = (userId: string) => {
  if (socket.connected) {
    socket.emit('join_room', { userId });
  }
};

export { socket };