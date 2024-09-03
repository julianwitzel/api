const fs = require('fs');
const path = require('path');

const errorPages = {
	400: 'errors/400.html',
	401: 'errors/401.html',
	403: 'errors/403.html',
	404: 'errors/404.html',
	500: 'errors/500.html',
	default: 'errors/generic.html',
};

module.exports = (req, res) => {
	const statusCode = req.query.code || 500;
	const errorFile = errorPages[statusCode] || errorPages.default;
	const errorPagePath = path.join(process.cwd(), 'public', errorFile);

	fs.readFile(errorPagePath, 'utf8', (err, data) => {
		if (err) {
			console.error('Error reading error page:', err);
			return res.status(500).send('An error occurred');
		}

		res.setHeader('Content-Type', 'text/html');
		res.status(parseInt(statusCode)).send(data);
	});
};
