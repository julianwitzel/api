const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const airtableRoute = require('./routes/airtable');
const errorRoute = require('./routes/error');
const imageProcessingRoutes = require('./routes/imageProcessing');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// API routes
app.use('/api/airtable', airtableRoute);
app.use('/api/error', errorRoute);
app.use('/api/image', imageProcessingRoutes);

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
