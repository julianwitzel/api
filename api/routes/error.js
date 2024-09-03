const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

const errorDetails = {
	400: { title: 'Bad Request', message: 'The request could not be understood by the server due to malformed syntax.' },
	401: { title: 'Unauthorized', message: 'The request requires user authentication.' },
	403: { title: 'Forbidden', message: "You don't have permission to access this resource." },
	404: { title: 'Not Found', message: 'The requested resource could not be found.' },
	500: { title: 'Internal Server Error', message: 'The server encountered an unexpected condition which prevented it from fulfilling the request.' },
};

const renderErrorPage = async (req, res, statusCode) => {
	const templatePath = path.join(process.cwd(), 'public', 'html', 'error.html');

	try {
		let template = await fs.readFile(templatePath, 'utf8');
		const error = errorDetails[statusCode] || errorDetails[500];

		template = template
			.replace(/\{\{errorCode\}\}/g, statusCode)
			.replace(/\{\{errorTitle\}\}/g, error.title)
			.replace(/\{\{errorMessage\}\}/g, error.message)
			.replace(/\{\{errorDescription\}\}/g, 'If you believe this is an error, please contact the administrator.');

		res.status(parseInt(statusCode)).send(template);
	} catch (err) {
		console.error('Error reading template:', err);
		res.status(500).send('An error occurred while loading the error page');
	}
};

router.get('/', async (req, res) => {
	const statusCode = req.query.code || res.statusCode || 500;
	await renderErrorPage(req, res, statusCode);
});

// Export both the router and the renderErrorPage function
module.exports = router;
module.exports.renderErrorPage = renderErrorPage;
