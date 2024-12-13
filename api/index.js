const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const securityMiddleware = require('./middleware/security');
const airtableRoute = require('./routes/airtable');
const errorRoute = require('./routes/error');
const imageProcessingRoutes = require('./routes/imageProcessing');
const wpCredentialsRoute = require('./routes/wpCredentials.js');

const app = express();

// Define allowed domains
const allowedDomains = ['https://vierless.de', 'https://cf-vierless.webflow.io'];

// Apply security middleware to all routes
app.use(securityMiddleware(allowedDomains, false));

// Body parsing middleware
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// API routes
app.use('/api/airtable', airtableRoute);
app.use('/api/error', errorRoute);
app.use('/api/image', imageProcessingRoutes);
app.use('/api/wp-credentials', wpCredentialsRoute);

// Root route
app.get('/', async (req, res, next) => {
	try {
		const landingPath = path.join(process.cwd(), 'public', 'html', 'index.html');
		const content = await fs.readFile(landingPath, 'utf8');
		res.send(content);
	} catch (err) {
		next(err);
	}
});

// Catch-all route for handling 404s
app.use('*', (req, res, next) => {
	res.status(404);
	next(new Error('Not Found'));
});

// Error handler
app.use((err, req, res, next) => {
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
	errorRoute.renderErrorPage(req, res, statusCode);
});

module.exports = app;
