/**
 * db/index.js — single SQLite handle shared across the app.
 *
 * Uses Node's built-in node:sqlite (Node 22.5+) so we don't pull in a native
 * dependency. The DB file lives at data/shop.db; back it up by copying the file.
 */
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'shop.db');

const db = new DatabaseSync(DB_PATH);

// Enforce foreign keys + use WAL for better read concurrency.
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL');

module.exports = db;
module.exports.DB_PATH = DB_PATH;
