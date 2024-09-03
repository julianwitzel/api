const express = require('express');
const airtableRoute = require('./routes/airtable');
const errorRoute = require('./routes/error');

const app = express();

// Airtable route
app.use('/api/airtable', airtableRoute);

// Error route
app.use('/api/error', errorRoute);

// 404 handler
app.use((req, res) => {
	res.redirect(404, '/api/error?code=404');
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.redirect(500, '/api/error?code=500');
});

module.exports = app;
