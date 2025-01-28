// api/routes/slack.js
const express = require('express');
const router = express.Router();

router.post('/options', async (req, res) => {
	try {
		// Forward the request to Make.com
		const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		const makeData = await makeResponse.json();

		// Extract and parse the options from Make's wrapped response
		const options = JSON.parse(makeData.body);

		// Send the clean response back to Slack
		return res.status(200).json(options);
	} catch (error) {
		console.error('Error processing Slack options:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

module.exports = router;
