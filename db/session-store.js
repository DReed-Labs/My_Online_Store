/**
 * db/session-store.js — express-session Store backed by the project's SQLite DB.
 *
 * Persistent across server restarts. Expired sessions are swept hourly.
 */
const session = require('express-session');
const db = require('./index');

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

class SQLiteSessionStore extends session.Store {
  constructor() {
    super();
    this.getStmt = db.prepare('SELECT data, expires FROM sessions WHERE sid = ?');
    this.setStmt = db.prepare(`
      INSERT INTO sessions (sid, data, expires) VALUES (?, ?, ?)
      ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires = excluded.expires
    `);
    this.delStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.touchStmt = db.prepare('UPDATE sessions SET expires = ? WHERE sid = ?');
    this.sweepStmt = db.prepare('DELETE FROM sessions WHERE expires < ?');

    // Sweep expired sessions hourly so the table doesn't grow forever.
    setInterval(() => this.sweepStmt.run(Date.now()), 60 * 60 * 1000).unref();
  }

  _expiresFromSession(sess) {
    if (sess && sess.cookie && sess.cookie.expires) return +new Date(sess.cookie.expires);
    return Date.now() + DEFAULT_TTL_MS;
  }

  get(sid, cb) {
    try {
      const row = this.getStmt.get(sid);
      if (!row) return cb(null, null);
      if (row.expires < Date.now()) {
        this.delStmt.run(sid);
        return cb(null, null);
      }
      cb(null, JSON.parse(row.data));
    } catch (e) { cb(e); }
  }

  set(sid, sess, cb) {
    try {
      this.setStmt.run(sid, JSON.stringify(sess), this._expiresFromSession(sess));
      cb && cb(null);
    } catch (e) { cb && cb(e); }
  }

  destroy(sid, cb) {
    try {
      this.delStmt.run(sid);
      cb && cb(null);
    } catch (e) { cb && cb(e); }
  }

  touch(sid, sess, cb) {
    try {
      this.touchStmt.run(this._expiresFromSession(sess), sid);
      cb && cb(null);
    } catch (e) { cb && cb(e); }
  }
}

module.exports = SQLiteSessionStore;
