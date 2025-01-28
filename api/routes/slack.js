// api/routes/slack.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/options', async (req, res) => {
	try {
		console.log('Received request from Slack:', req.body);

		const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		console.log('Make.com response status:', makeResponse.status);

		// Get the raw text response first
		const rawResponse = await makeResponse.text();
		console.log('Raw Make.com response:', rawResponse);

		try {
			// Try to parse it as JSON
			const makeData = JSON.parse(rawResponse);
			const options = JSON.parse(makeData.body);
			return res.status(200).json(options);
		} catch (parseError) {
			console.error('Parse error:', parseError);
			return res.status(500).json({
				error: 'Failed to parse Make.com response',
				rawResponse: rawResponse,
			});
		}
	} catch (error) {
		console.error('Detailed error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details: error.message,
		});
	}
});

module.exports = router;
