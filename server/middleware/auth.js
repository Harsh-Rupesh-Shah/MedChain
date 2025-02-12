import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle admin authentication differently
    if (decoded.role === 'admin') {
      req.user = {
        userId: decoded.userId,
        role: 'admin',
        email: decoded.email
      };
      return next();
    }

    // For regular users, verify against database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      userId: user._id,
      role: user.role
    };
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};