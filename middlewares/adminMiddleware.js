// middlewares/adminMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.adminProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password -adminPassword');

      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
      }
    } catch (error) {
      console.error('Not authorized, token failed', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
