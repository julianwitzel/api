const { config } = require('dotenv');
const Airtable = require('airtable');
const helmet = require('helmet');

config();

const helmetMiddleware = helmet();
const ALLOWED_DOMAINS = ['vierless.de', 'cf-vierless.webflow.io'];
const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Relaxed security check for development
const securityCheck = (req, res) => {
	if (IS_DEVELOPMENT) {
		console.log('Development mode: Bypassing security checks');
		return null;
	}

	const origin = req.headers.origin;
	const referer = req.headers.referer;

	console.log('Origin:', origin);
	console.log('Referer:', referer);

	if (!origin || !ALLOWED_DOMAINS.some((domain) => origin.endsWith(domain))) {
		console.log('Security check failed: Invalid origin');
		return res.status(403).json({ error: 'Forbidden: Invalid origin' });
	}

	if (!referer || !ALLOWED_DOMAINS.some((domain) => referer.includes(domain))) {
		console.log('Security check failed: Invalid referer');
		return res.status(403).json({ error: 'Forbidden: Invalid referer' });
	}

	return null; // Passes security check
};

module.exports = async (req, res) => {
	console.log('API endpoint hit');
	console.log('Query parameters:', req.query);

	try {
		await new Promise((resolve) => helmetMiddleware(req, res, resolve));

		// CORS configuration
		if (IS_DEVELOPMENT) {
			res.setHeader('Access-Control-Allow-Origin', '*');
		} else {
			const origin = req.headers.origin;
			if (ALLOWED_DOMAINS.some((domain) => origin.endsWith(domain))) {
				res.setHeader('Access-Control-Allow-Origin', origin);
			} else {
				console.log('CORS check failed: Invalid origin');
				return res.status(403).json({ error: 'Forbidden: Invalid origin' });
			}
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
			console.log('Missing required parameters');
			return res.status(400).json({ error: 'Missing required parameters' });
		}

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
		console.error('Detailed error:', error);
		res.status(500).json({ error: 'Internal Server Error', details: error.message, stack: error.stack });
	}
};
