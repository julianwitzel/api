const { config } = require('dotenv');
const Airtable = require('airtable');
const helmet = require('helmet');

config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const helmetMiddleware = helmet();

module.exports = async (req, res) => {
	console.log('API endpoint hit');

	await new Promise((resolve) => helmetMiddleware(req, res, resolve));

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
		console.error('Error in API:', error);
		res.status(500).json({ error: 'Internal Server Error', details: error.message });
	}
};
