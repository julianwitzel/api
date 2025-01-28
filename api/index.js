// api/routes/slack.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/options', async (req, res) => {
	try {
		// Parse Slack's payload
		let slackPayload;
		try {
			slackPayload = JSON.parse(req.body.payload);
			console.log('Parsed Slack payload:', slackPayload);
		} catch (parseError) {
			console.error('Error parsing Slack payload:', parseError);
			return res.status(400).json({ error: 'Invalid payload' });
		}

		// Send complete payload to Make.com
		const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(slackPayload),
		});

		if (!makeResponse.ok) {
			console.log('Make.com error response:', await makeResponse.text());
			return res.status(makeResponse.status).json({ error: 'Make.com processing failed' });
		}

		// Parse Make.com's wrapped response
		const makeData = await makeResponse.json();
		console.log('Make.com response:', makeData);

		// Extract the options from Make.com's response body and send to Slack
		const options = JSON.parse(makeData.body);
		return res.status(200).json(options);
	} catch (error) {
		console.error('Detailed error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details: error.message,
		});
	}
});

module.exports = router;
