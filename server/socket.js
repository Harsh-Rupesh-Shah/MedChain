import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Message } from './models/index.js';

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.userId);

    // Join user's room
    socket.on('join_room', ({ userId }) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    socket.on('private_message', async (data) => {
      try {
        const message = new Message({
          sender: socket.user.userId,
          receiver: data.receiverId,
          content: data.content,
          attachments: data.attachments || []
        });

        await message.save();
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name role')
          .populate('receiver', 'name role');

        // Send to receiver's room
        io.to(`user_${data.receiverId}`).emit('new_message', populatedMessage);
        
        // Send back to sender's room
        io.to(`user_${socket.user.userId}`).emit('new_message', populatedMessage);
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      socket.to(`user_${data.receiverId}`).emit('typing', {
        userId: socket.user.userId
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(`user_${data.receiverId}`).emit('stop_typing', {
        userId: socket.user.userId
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.userId);
    });
  });

  return io;
};

export default initializeSocket;