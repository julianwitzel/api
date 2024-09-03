const { config } = require('dotenv');
const Airtable = require('airtable');
const helmet = require('helmet');

config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Create a helmet middleware instance
const helmetMiddleware = helmet();

module.exports = async (req, res) => {
	// Apply Helmet middleware
	await new Promise((resolve) => helmetMiddleware(req, res, resolve));

	// Set CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	try {
		const records = await base(process.env.AIRTABLE_TABLE_NAME).select().firstPage();
		const data = records.map((record) => record.fields);
		res.status(200).json(data);
	} catch (error) {
		console.error('Error fetching data:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};
