const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  try {
    // 1. Get the Authorization header from request headers
    const authHeader = req.headers.authorization;

    // 2. Defensive check: Verify header exists
    if (!authHeader) {
      return res.status(401).json({ error: 'Not authorized, token missing' });
    }

    // 3. Defensive check: Verify header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authorized, malformed token header' });
    }

    // 4. Defensive check: Split safely to get the token part
    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Not authorized, malformed token header' });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authorized, empty token value' });
    }

    // 5. Verify the token using process.env.JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 6. Attach ONLY user ID and role from decoded token to req.user
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    // 7. Call next middleware
    next();
  } catch (error) {
    console.error(`Auth Middleware Error: ${error.message}`);
    return res.status(401).json({ error: 'Not authorized, token invalid' });
  }
};

// 8. Admin Authorization Middleware
const admin = (req, res, next) => {
  // Check if user context exists and role is 'admin'
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden, admin access required' });
  }
};

module.exports = { protect, admin };
