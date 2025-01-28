// api/routes/slack.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/options', async (req, res) => {
	try {
		// Log what we're sending to Make.com
		console.log('Sending to Make.com:', req.body);

		const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		// Get the raw response text
		const rawResponse = await makeResponse.text();
		console.log('Raw Make.com response:', rawResponse);
		console.log('Make.com response status:', makeResponse.status);

		if (!makeResponse.ok) {
			return res.status(502).json({
				error: 'Make.com returned an error',
				status: makeResponse.status,
				response: rawResponse,
			});
		}

		try {
			// Only try to parse JSON if we have a successful response
			const makeData = JSON.parse(rawResponse);
			const options = JSON.parse(makeData.body);
			return res.status(200).json(options);
		} catch (parseError) {
			console.error('Parse error:', parseError);
			return res.status(500).json({
				error: 'Failed to parse Make.com response',
				rawResponse: rawResponse,
				parseError: parseError.message,
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
