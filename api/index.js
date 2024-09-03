const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const airtableRoute = require('./routes/airtable');
const errorRoute = require('./routes/error');

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Airtable route
app.use('/api/airtable', airtableRoute);

// Error route
app.use('/api/error', errorRoute);

// Root route
app.get('/', async (req, res) => {
	try {
		const landingPath = path.join(process.cwd(), 'public', 'html', 'index.html');
		const content = await fs.readFile(landingPath, 'utf8');
		res.send(content);
	} catch (err) {
		console.error('Error reading landing page:', err);
		res.status(500).send('An error occurred while loading the landing page');
	}
});

// 404 handler
app.use((req, res, next) => {
	res.status(404);
	next(new Error('Not Found'));
});

// Error handler
app.use((err, req, res, next) => {
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
	res.status(statusCode);
	errorRoute.renderErrorPage(req, res, statusCode);
});

module.exports = app;
