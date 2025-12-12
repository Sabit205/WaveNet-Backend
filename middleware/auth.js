const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// This middleware will ensure the request is authenticated
// It attaches the user object to req.auth
const requireAuth = ClerkExpressRequireAuth({
    // Optional: Add configuration if needed, usually env vars are enough
});

module.exports = { requireAuth };
