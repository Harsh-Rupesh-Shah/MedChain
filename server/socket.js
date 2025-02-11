import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from './models/Message.js';

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
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

  const userSockets = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user.userId;
    userSockets.set(userId, socket.id);

    // Join private room
    socket.join(`user_${userId}`);

    // Handle private messages
    socket.on('private_message', async (data) => {
      try {
        const message = new Message({
          sender: userId,
          receiver: data.receiverId,
          content: data.content,
          attachments: data.attachments || []
        });
        await message.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'name role')
          .populate('receiver', 'name role');

        // Send to receiver if online
        const receiverSocketId = userSockets.get(data.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('private_message', populatedMessage);
        }

        // Send back to sender
        socket.emit('private_message', populatedMessage);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing status
    socket.on('typing', (data) => {
      const receiverSocketId = userSockets.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { userId });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      userSockets.delete(userId);
    });
  });

  return io;
};

export default initializeSocket;