require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const Message = require('./models/message');
const User = require('./models/user');
const Product = require('./models/product');
const auth = require('./middleware/auth');

const app = express();

// Middlewares
app.use(cors());
// Parse JSON and capture raw body for better debugging of malformed JSON
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf.toString();
    } catch (e) {
      req.rawBody = '';
    }
  }
}));

// Error handler for invalid JSON payloads produced by body-parser
app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === 'entity.parse.failed')) {
    console.error('Invalid JSON payload received:', err.message);
    // Log raw body for debugging (don't leak in production logs)
    console.error('Raw body:', req && req.rawBody);
    return res.status(400).json({ status: 'error', message: 'Invalid JSON payload' });
  }
  return next(err);
});

// Serve static files (css, js, images)
app.use(express.static(path.join(__dirname, 'public')));

// Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/messages', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// API info
app.get('/api', (req, res) => {
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

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
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

// Message endpoints
app.post('/api/messages', auth, async (req, res) => {
  const { name, message } = req.body;
  
  if (!name || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Name and message are required'
    });
  }

  try {
    await Message.create({
      name,
      message,
      userId: req.user.userId,
      username: req.user.username
    });
    
    res.json({
      status: 'success',
      message: `Thank you ${name}! Your message has been saved.`
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save message. Please try again.'
    });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const { search, username } = req.query;
    const messages = await Message.findAll({ search, username });
    res.json({
      status: 'success',
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    });
  }
});

app.delete('/api/messages/:id', auth, async (req, res) => {
  try {
    const deleted = await Message.deleteMessage(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found or you do not have permission to delete it'
      });
    }
    res.json({
         status: 'success',
         message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message'
    });
  }
});

// Product routes
app.post('/api/products', auth, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create product'
    });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.findAll(req.query);
    res.json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    res.json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    res.json({
      status: 'success',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product'
    });
  }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    const deleted = await Product.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product'
    });
  }
});

// Serve static files for client build
const clientBuildPath = path.join(__dirname, 'client', 'build');
app.use(express.static(clientBuildPath));
app.get('*', (req, res, next) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(clientBuildPath, 'index.html'), err => {
      if (err) next();
    });
  }
  next();
});

// Start server
const PORT = process.env.PORT || 4000;

async function start() {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;

  console.log('Environment variables loaded:');
  console.log('- MONGO_URI:', mongoUri ? `mongodb+srv://****:****@${mongoUri.split('@')[1]}` : '(not set)');
  console.log('- MONGO_DB_NAME:', dbName);
  console.log('- NODE_ENV:', process.env.NODE_ENV);

  let server;

  try {
    if (mongoUri && dbName) {
      console.log('Attempting MongoDB connection...');
      const database = await db.connect(mongoUri, dbName);
      app.locals.db = database;
      console.log('Connected to MongoDB');
    } else {
      console.warn('MONGO_URI or MONGO_DB_NAME not set; skipping MongoDB connection');
    }

    // Create server but don't start listening yet
const server = app.listen(PORT, () => {
      console.log(`ServerUp backend listening on port ${PORT}`);
    }).on('listening', () => {
      // Keep the event loop alive
      setInterval(() => {}, 1000);
    });

    // Enhanced error handling for the server
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using that port.`);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      if (server) {
        server.close(() => {
          console.log('Server closed due to uncaught exception');
        });
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM. Performing graceful shutdown...');
      if (server) {
        server.close(() => {
          console.log('Server closed. Exiting process.');
          process.exit(0);
        });
      }
    });

    // Keep the process running
    process.stdin.resume();

  } catch (err) {
    console.error('Failed to start server:', err);
    console.error('Full error:', err.stack || err);
  }

  return server;
}

// Start the server and handle any startup errors
start().catch(err => {
  console.error('Unhandled error during startup:', err);
  console.error('Stack trace:', err.stack);
});