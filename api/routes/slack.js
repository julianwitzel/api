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

		const makeData = await makeResponse.json();
		console.log('Make.com response data:', makeData);

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
