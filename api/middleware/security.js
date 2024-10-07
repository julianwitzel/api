const securityMiddleware = (allowedDomains = [], allowAll = false) => {
	return (req, res, next) => {
		const origin = req.headers.origin;

		// CORS handling
		if (allowAll) {
			res.setHeader('Access-Control-Allow-Origin', '*');
		} else if (origin && allowedDomains.includes(origin)) {
			res.setHeader('Access-Control-Allow-Origin', origin);
		}

		// Allow common HTTP methods and headers for preflight requests
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		// Allow credentials if needed (update this based on your requirements)
		res.setHeader('Access-Control-Allow-Credentials', 'true');

		// Handle preflight requests
		if (req.method === 'OPTIONS') {
			return res.status(200).end();
		}

		// Additional security headers
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('X-Frame-Options', 'DENY');
		res.setHeader('X-XSS-Protection', '1; mode=block');
		res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

		if (allowAll || (origin && allowedDomains.includes(origin))) {
			return next();
		}

		return res.status(403).json({ error: 'Forbidden' });
	};
};

module.exports = securityMiddleware;
