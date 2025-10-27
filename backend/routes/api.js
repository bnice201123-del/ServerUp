const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// API info
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'ServerUp API is running',
    server: {
      time: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
    endpoints: {
      health: '/health',
      api: '/api',
      messages: '/api/messages',
      products: '/api/products'
    }
  });
});

module.exports = router;