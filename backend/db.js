const { MongoClient } = require('mongodb');

let _client = null;
let _db = null;

async function connect(uri, dbName, options = {}) {
  if (_db) return _db;

  const defaultOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  _client = new MongoClient(uri, { ...defaultOptions, ...options });

  try {
    console.log('Connecting to MongoDB Atlas...');
    await _client.connect();
    _db = _client.db(dbName);
    console.log('Successfully connected to MongoDB Atlas');
    return _db;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

function getDb() {
  if (!_db) throw new Error('Database not initialized. Call connect first.');
  return _db;
}

async function close() {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
}

module.exports = { connect, getDb, close };
