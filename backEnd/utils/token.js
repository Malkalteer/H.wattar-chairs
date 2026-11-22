const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role, v: user.tokenVersion || 0 }, jwtSecret, { expiresIn: '7d' });
};

module.exports = { generateToken };
