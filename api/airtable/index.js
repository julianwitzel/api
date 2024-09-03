const { config } = require('dotenv');
const Airtable = require('airtable');

config();

const ALLOWED_DOMAINS = ['vierless.de', 'cf-vierless.webflow.io'];
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

const isAllowedOrigin = (origin) => {
	return ALLOWED_DOMAINS.some((domain) => origin && origin.endsWith(domain));
};

const fetchAirtableRecord = async (baseId, tableName, recordId, fields) => {
	const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseId);
	const record = await base(tableName).find(recordId);

	if (fields) {
		const fieldList = fields.split(',');
		return Object.fromEntries(Object.entries(record.fields).filter(([key]) => fieldList.includes(key)));
	}

	return record.fields;
};

module.exports = async (req, res) => {
	console.log(`API hit in ${IS_DEVELOPMENT ? 'development' : 'production'} mode`);

	const origin = req.headers.origin;
	console.log('Origin:', origin);

	if (!IS_DEVELOPMENT && origin && !isAllowedOrigin(origin)) {
		console.log('Access denied: Invalid origin');
		return res.status(403).json({ error: 'Forbidden: Invalid origin' });
	}

	res.setHeader('Access-Control-Allow-Origin', IS_DEVELOPMENT ? '*' : origin || '');
	res.setHeader('Access-Control-Allow-Methods', 'GET');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const { base: baseId, table: tableName, record: recordId, fields } = req.query;

	if (!baseId || !tableName || !recordId) {
		console.log('Missing required parameters');
		return res.status(400).json({ error: 'Missing required parameters' });
	}

	try {
		const data = await fetchAirtableRecord(baseId, tableName, recordId, fields);
		res.status(200).json(data);
	} catch (error) {
		console.error('Error fetching data:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};
