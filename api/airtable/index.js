const Airtable = require('airtable');
const securityMiddleware = require('../middleware/securityMiddleware');

// Security settings
const allowedDomains = ['vierless.de', 'cf-vierless.webflow.io'];
const errorRedirectUrl = 'https://api.vierless.de/error-page';

// Airtable API route handler
module.exports = async (req, res) => {
	// Apply security middleware
	securityMiddleware(allowedDomains, false, errorRedirectUrl)(req, res, async () => {
		try {
			// Get the base ID, table name, and record ID from the query parameters
			const { base: baseId, table: tableName, record: recordId } = req.query;

			// Check if all required parameters are provided
			if (!baseId || !tableName || !recordId) {
				return res.status(400).json({ error: 'Base ID, table name, and record ID are all required' });
			}

			// Configure Airtable with the provided base ID
			const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseId);

			// Fetch the specific record from Airtable
			const record = await base(tableName).find(recordId);

			// If no record is found, return a 404 error
			if (!record) {
				return res.status(404).json({ error: 'Record not found' });
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
			res.status(500).json({ error: 'An error occurred while fetching data from Airtable' });
		}
	});
};
