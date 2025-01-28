// api/routes/slack.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post('/options', async (req, res) => {
	try {
		let slackPayload;
		try {
			slackPayload = JSON.parse(req.body.payload);
			console.log('Parsed Slack payload:', slackPayload);
		} catch (parseError) {
			console.error('Error parsing Slack payload:', parseError);
			return res.status(400).json({ error: 'Invalid payload' });
		}

		const makePayload = {
			payload: slackPayload,
		};

		const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(makePayload),
		});

		const makeData = await makeResponse.json();

		// Check if we have valid options data
		if (makeData?.body?.options?.length > 0 && makeData.body.options[0]?.text?.text && makeData.body.options[0]?.value) {
			// Return the options if they contain valid data
			return res.status(200).json(makeData.body);
		} else {
			// Return empty options array if no valid data
			return res.status(200).json({
				options: [],
			});
		}
	} catch (error) {
		console.error('Detailed error:', error);
		return res.status(200).json({
			options: [],
		});
	}
});

module.exports = router;
