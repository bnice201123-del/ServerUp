const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.register({ username, password });
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      user: { username: user.username }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await User.login({ username, password });
    res.json({
      status: 'success',
      ...result
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;