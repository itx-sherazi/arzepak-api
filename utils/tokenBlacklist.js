/* In-memory token blacklist — use Redis in production for multi-server setups */
const blacklist = new Set();

/* Auto-clear every hour to prevent memory leak */
setInterval(() => blacklist.clear(), 60 * 60 * 1000);

exports.add    = (token) => blacklist.add(token);
exports.has    = (token) => blacklist.has(token);
