const express = require('express');
const Airtable = require('airtable');
const securityMiddleware = require('../middleware/security');
const { renderErrorPage } = require('./error');

const router = express.Router();

// Security settings
const allowedDomains = ['https://vierless.de', 'https://cf-vierless.webflow.io'];

// Apply security middleware to all routes in this router
router.use(securityMiddleware(allowedDomains, false));

// Airtable API route handler
router.get('/', async (req, res) => {
	try {
		// Get the base ID, table name, and record ID from the query parameters
		const { base: baseId, table: tableName, record: recordId } = req.query;

		// Check if all required parameters are provided
		if (!baseId || !tableName || !recordId) {
			return res.redirect(303, `/api/error?code=400`);
		}

		// Configure Airtable with the provided base ID
		const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseId);

		// Fetch the specific record from Airtable
		const record = await base(tableName).find(recordId);

		// If no record is found, return a 404 error
		if (!record) {
			return res.redirect(303, `/api/error?code=404`);
		}

		// Format the record
		const formattedRecord = {
			id: record.id,
			fields: record.fields,
		};

		// Send the response
		res.status(200).json({ record: formattedRecord });
	} catch (error) {
		console.error('Airtable API Error:', error);

		// Determine the appropriate error code
		let statusCode;
		if (error.error === 'NOT_FOUND') {
			statusCode = 404;
		} else if (error.error === 'INVALID_API_KEY') {
			statusCode = 401;
		} else if (error.statusCode) {
			statusCode = error.statusCode;
		} else {
			statusCode = 500; // Default to 500 for unexpected errors
		}

		// Render the error page directly
		await renderErrorPage(req, res, statusCode);
	}
});

module.exports = router;
