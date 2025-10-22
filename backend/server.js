require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const Message = require('./models/message');
const User = require('./models/user');
const auth = require('./middleware/auth');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files (css, js, images)
app.use(express.static(path.join(__dirname, 'public')));

// Page Routes - These will only be hit if the static file serving doesn't find a match
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/messages', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'messages.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Example API route
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
      echo: '/api/echo (POST)'
    }
  });
});

// Example POST route
app.post('/api/echo', (req, res) => {
  res.json({ received: req.body });
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
    console.log('Saved message from:', name);
    
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

// Get all messages with search
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

// Delete message
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

// Serve static files if a client build exists (e.g., ./client/build)
const clientBuildPath = path.join(__dirname, 'client', 'build');
app.use(express.static(clientBuildPath));
app.get('*', (req, res, next) => {
  // If the request accepts html and a client build exists, serve index.html
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

  if (mongoUri && dbName) {
    try {
      console.log('Attempting MongoDB connection...');
      const database = await db.connect(mongoUri, dbName);
      app.locals.db = database;
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
      // Exit on DB connection failure
      process.exit(1);
    }
  } else {
    console.warn('MONGO_URI or MONGO_DB_NAME not set; skipping MongoDB connection');
  }

  app.listen(PORT, () => {
    console.log(`ServerUp backend listening on port ${PORT}`);
  });
}

start();
