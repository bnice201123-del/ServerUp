#!/usr/bin/env node
/*
  Usage:
    Set environment variables MONGO_URI and MONGO_DB_NAME, then run:
      node backend/scripts/removeUser.js <username>

  Example (PowerShell):
    $env:MONGO_URI = "mongodb+srv://user:pass@cluster0.mongodb.net"
    $env:MONGO_DB_NAME = "mydb"
    node backend/scripts/removeUser.js testuser
*/

const db = require('../db');

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error('Usage: node backend/scripts/removeUser.js <username>');
    process.exit(2);
  }

  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;
  if (!mongoUri || !dbName) {
    console.error('Please set MONGO_URI and MONGO_DB_NAME environment variables before running this script.');
    process.exit(2);
  }

  try {
    const database = await db.connect(mongoUri, dbName);
    const users = database.collection('users');

    const existing = await users.findOne({ username });
    if (!existing) {
      console.log(`No user found with username: ${username}`);
      await db.close();
      process.exit(0);
    }

    const result = await users.deleteOne({ username });
    if (result.deletedCount === 1) {
      console.log(`Deleted user '${username}' successfully.`);
    } else {
      console.log(`Failed to delete user '${username}'.`);
    }

    await db.close();
    process.exit(0);
  } catch (err) {
    console.error('Error removing user:', err);
    process.exit(1);
  }
}

main();
