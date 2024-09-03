const { config } = require('dotenv');
const Airtable = require('airtable');
const helmet = require('helmet');

config();

const helmetMiddleware = helmet();

module.exports = async (req, res) => {
	console.log('API endpoint hit');

	await new Promise((resolve) => helmetMiddleware(req, res, resolve));

	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const { base: baseId, table: tableName, record: recordId } = req.query;

	if (!baseId || !tableName) {
		return res.status(400).json({ error: 'Missing required parameters: base and table' });
	}

	try {
		const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseId);

		if (recordId) {
			// Fetch a specific record
			const record = await base(tableName).find(recordId);
			res.status(200).json(record.fields);
		} else {
			// Fetch all records from the table
			const records = await base(tableName).select().all();
			const data = records.map((record) => record.fields);
			res.status(200).json(data);
		}
	} catch (error) {
		console.error('Error in API:', error);
		res.status(500).json({ error: 'Internal Server Error', details: error.message });
	}
};
