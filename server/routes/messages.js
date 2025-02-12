import express from 'express';
import { auth } from '../middleware/auth.js';
import { Message, User } from '../models/index.js';

const router = express.Router();

// Get conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user.userId },
            { receiver: req.user.userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user.userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const conversationUsers = await User.find({
      _id: { $in: messages.map(m => m._id) }
    }).select('name role');

    const conversations = messages.map(m => ({
      user: conversationUsers.find(u => u._id.equals(m._id)),
      lastMessage: m.lastMessage
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name role')
    .populate('receiver', 'name role');

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content, attachments } = req.body;

    const message = new Message({
      sender: req.user.userId,
      receiver: receiverId,
      content,
      attachments: attachments || []
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name role')
      .populate('receiver', 'name role');

    // Emit socket event for real-time update
    req.app.get('io').to(`user_${receiverId}`).emit('new_message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user.userId,
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;