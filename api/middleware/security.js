const securityMiddleware = (allowedDomains = [], allowAll = false) => {
	return (req, res, next) => {
		const origin = req.headers.origin;

		if (!origin) {
			return next();
		}

		// CORS handling
		if (allowAll) {
			res.setHeader('Access-Control-Allow-Origin', '*');
		} else if (allowedDomains.includes(origin)) {
			res.setHeader('Access-Control-Allow-Origin', origin);
		} else {
			return res.status(403).json({ error: 'Forbidden' });
		}

		// Set more detailed CORS headers
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');

		// Allow credentials
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
