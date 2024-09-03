const securityMiddleware = (allowedDomains = [], allowAll = false, errorRedirectUrl = null) => {
	return (req, res, next) => {
		const origin = req.headers.origin || req.headers.referer;

		if (allowAll) {
			// If allowAll is true, skip the domain check
			return next();
		}

		if (!origin) {
			return handleError(res, errorRedirectUrl, 'Origin not provided');
		}

		const isAllowed = allowedDomains.some((domain) => {
			const regex = new RegExp(`^https?://(.*\.)?${domain.replace(/\./g, '.')}$`);
			return regex.test(origin);
		});

		if (isAllowed) {
			return next();
		} else {
			return handleError(res, errorRedirectUrl, 'Access denied');
		}
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
