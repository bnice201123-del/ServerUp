#!/usr/bin/env node
/*
  Usage:
    Set environment variables MONGO_URI and MONGO_DB_NAME, then run:
      node backend/scripts/listProducts.js [--json]

  Example (PowerShell):
    $env:MONGO_URI = 'mongodb+srv://<user>:<pass>@cluster0.mongodb.net'
    $env:MONGO_DB_NAME = 'your_db_name'
    node backend/scripts/listProducts.js --json
*/

const db = require('../db');

async function main() {
  const asJson = process.argv.includes('--json');
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;

  if (!mongoUri || !dbName) {
    console.error('Please set MONGO_URI and MONGO_DB_NAME environment variables before running this script.');
    process.exit(2);
  }

  try {
    const database = await db.connect(mongoUri, dbName);
    const products = await database.collection('products').find({}).sort({ createdAt: -1 }).toArray();

    if (asJson) {
      console.log(JSON.stringify(products, null, 2));
    } else {
      if (products.length === 0) {
        console.log('No products found.');
      } else {
        console.log(`Found ${products.length} products:\n`);
        products.forEach(p => {
          console.log(`- ID: ${p._id}\n  Name: ${p.name}\n  Price: ${p.price}\n  SKU: ${p.sku || '-'}\n  CreatedAt: ${p.createdAt}\n`);
        });
      }
    }

    await db.close();
    process.exit(0);
  } catch (err) {
    console.error('Error listing products:', err);
    process.exit(1);
  }
}

main();
