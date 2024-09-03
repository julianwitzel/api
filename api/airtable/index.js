const { config } = require('dotenv');
const Airtable = require('airtable');
const helmet = require('helmet');

config();

const helmetMiddleware = helmet();
const ALLOWED_DOMAINS = ['vierless.de', 'cf-vierless.webflow.io'];

// Strict referer and origin check
const securityCheck = (req, res) => {
	const origin = req.headers.origin;
	const referer = req.headers.referer;

	if (!origin || !ALLOWED_DOMAINS.some((domain) => origin.endsWith(domain))) {
		return res.status(403).json({ error: 'Forbidden: Invalid origin' });
	}

	if (!referer || !ALLOWED_DOMAINS.some((domain) => referer.includes(domain))) {
		return res.status(403).json({ error: 'Forbidden: Invalid referer' });
	}

	return null; // Passes security check
};

module.exports = async (req, res) => {
	console.log('API endpoint hit');

	await new Promise((resolve) => helmetMiddleware(req, res, resolve));

	// CORS configuration
	const origin = req.headers.origin;
	if (ALLOWED_DOMAINS.some((domain) => origin.endsWith(domain))) {
		res.setHeader('Access-Control-Allow-Origin', origin);
	} else {
		return res.status(403).json({ error: 'Forbidden: Invalid origin' });
	}
	res.setHeader('Access-Control-Allow-Methods', 'GET');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	// Apply security checks
	const securityError = securityCheck(req, res);
	if (securityError) return securityError;

	const { base: baseId, table: tableName, record: recordId, fields } = req.query;

	if (!baseId || !tableName || !recordId) {
		return res.status(400).json({ error: 'Missing required parameters' });
	}

	try {
		const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseId);

		// Fetch the specific record
		const record = await base(tableName).find(recordId);

		// Filter fields if specified
		let responseData = record.fields;
		if (fields) {
			const fieldList = fields.split(',');
			responseData = Object.fromEntries(Object.entries(record.fields).filter(([key]) => fieldList.includes(key)));
		}

		res.status(200).json(responseData);
	} catch (error) {
		console.error('Error in API:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};
