import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes
export const isAuthenticatedUser = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in cookies
    if (req.cookies.token) {
      token = req.cookies.token;
    }
    // Check for token in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'Login first to access this resource'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        message: 'User not found'
      });
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      message: 'Token is invalid or expired'
    });
  }
};

// Handling users roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user.role}) is not allowed to access this resource`
      });
    }
    next();
  };
};

// Check if user is seller
export const isSeller = async (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Seller privileges required.'
    });
  }
  next();
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
}; 