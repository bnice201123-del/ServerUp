require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const routes = require('./routes');

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

// Health check endpoint (before routes)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Mount all routes
app.use('/', routes);

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

    // Create and start server
    server = app.listen(PORT, () => {
      console.log(`ServerUp backend listening on port ${PORT}`);
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