const crypto = require('crypto');

// Demo sessions use a new in-memory signing key each time the server starts.
// Set JWT_SECRET only when deploying with a managed secret.
module.exports = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
