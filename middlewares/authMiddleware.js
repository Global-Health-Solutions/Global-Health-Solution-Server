const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Specialist = require('../models/Specialist');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user or specialist
      const user = await User.findById(decoded.id).select('-password');
      const specialist = await Specialist.findById(decoded.id).select('-password');
      
      req.user = user || specialist;
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const userRole = role => (req, res, next) => {
  if (req.user && req.user.role === role) {
    next();
  } else {
    res.status(401);
    throw new Error(`Not authorized as a ${role}`);
  }
};

module.exports = { protect, userRole };
