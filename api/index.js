const express = require('express');
const airtableRoute = require('./routes/airtable');
const errorRoute = require('./routes/error');

const app = express();

// Airtable route
app.use('/api/airtable', airtableRoute);

// Error route
app.use('/api/error', errorRoute);

// Root route
app.get('/', (req, res) => {
	res.send('Welcome to the Vierless API');
});

// 404 handler
app.use((req, res, next) => {
	res.status(404);
	// Pass the error to the error handler
	next(new Error('Not Found'));
});

// Error handler
app.use((err, req, res, next) => {
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
	res.status(statusCode);

	// Instead of redirecting, we'll render the error page directly
	errorRoute(req, res, next);
});

module.exports = app;
