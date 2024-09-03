const securityMiddleware = (allowedDomains = [], allowAll = false, errorRedirectUrl = null) => {
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

		return handleError(res, errorRedirectUrl, 'Access denied');
	};
};

const handleError = (res, errorRedirectUrl, errorMessage) => {
	if (errorRedirectUrl) {
		return res.redirect(303, errorRedirectUrl);
	} else {
		return res.status(403).json({ error: errorMessage });
	}
};

module.exports = securityMiddleware;
