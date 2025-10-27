const express = require('express');
const path = require('path');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Messages page
router.get('/messages', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'messages.html'));
});

// Login page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

module.exports = router;