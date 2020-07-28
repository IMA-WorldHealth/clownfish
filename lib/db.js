const debug = require('debug')('clownfish:db');
const Sqlite3 = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const { DATABASE_NAME } = process.env;

const db = new Sqlite3(DATABASE_NAME);
db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');

debug('Loading schema for database.');

db.exec(schema);

// temporary - load in the correct mappings
/*
const sql = `
INSERT OR IGNORE INTO router (gdrive_folder_id, email_address) VALUES
  ('1QWnvP30SKkMfwEJJDT7kVpbynqgWfcO1', 'clownfish@ima-mild.org'),
  ('1QWnvP30SKkMfwEJJDT7kVpbynqgWfcO1', 'clownfish@ima-data.com'),
  ('1ItVnTm7ZSTt3xrG2E-3tUONkn-7RuEbK', 'retro@snisrdc.com'),
  ('1k_sx78qTAO-l7B5iBgkWtQN0agExP87u', 'pcima@ima-assp.org'),
  ('19X9MM9jspTD3PnNphVoDma0LyQQ2hElU', 'retro@ima-assp.org');
`.trim();
*/

const sql = `
INSERT OR IGNORE INTO smtp (host, username, password, gdrive_folder_id, paused) VALUES
  ('mail.ima-data.com', 'retro@snisrdc.com', '584Ebp9@F9%cdn#XcL2jrfH*5Raef*Ut', '1QWnvP30SKkMfwEJJDT7kVpbynqgWfcO1', FALSE),
  ('mail.ima-data.com', 'pcima@ima-assp.org', '584Ebp9@F9%cdn#XcL2jrfH*5Raef*Ut', '1k_sx78qTAO-l7B5iBgkWtQN0agExP87u', TRUE),
  ('mail.ima-data.com', 'retro@ima-assp.org', '584Ebp9@F9%cdn#XcL2jrfH*5Raef*Ut', '19X9MM9jspTD3PnNphVoDma0LyQQ2hElU', TRUE);
`.trim();

db.exec(sql);

module.exports = db;

process.on('exit', () => db.close());
