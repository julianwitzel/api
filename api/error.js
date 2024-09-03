const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
	const errorPagePath = path.join(process.cwd(), 'public', 'error.html');

	fs.readFile(errorPagePath, 'utf8', (err, data) => {
		if (err) {
			console.error('Error reading error page:', err);
			return res.status(500).send('An error occurred');
		}

		res.setHeader('Content-Type', 'text/html');
		res.status(403).send(data);
	});
};
