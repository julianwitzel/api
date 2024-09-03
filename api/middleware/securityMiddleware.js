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

		// Handle preflight requests
		if (req.method === 'OPTIONS') {
			return res.status(200).end();
		}

		if (allowAll || (origin && allowedDomains.includes(origin))) {
			return next();
		}

		return res.redirect(303, '/api/error?code=403');
	};
};

module.exports = securityMiddleware;
