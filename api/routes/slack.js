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
			console.log('1. Parsed Slack payload:', slackPayload);
		} catch (parseError) {
			console.error('Error parsing Slack payload:', parseError);
			return res.status(400).json({ error: 'Invalid payload' });
		}

		const makePayload = {
			payload: slackPayload,
		};
		console.log('2. Sending to Make.com:', makePayload);

		const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(makePayload),
		});

		const makeData = await makeResponse.json();
		console.log('3. Raw Make.com response:', makeData);
		console.log('4. Make.com options:', makeData?.body?.options);

		// Check if we have valid options data
		if (makeData?.body?.options?.length > 0 && makeData.body.options[0]?.text?.text && makeData.body.options[0]?.value) {
			console.log('5. Valid options found, returning:', makeData.body);
			return res.status(200).json(makeData.body);
		} else {
			console.log('6. No valid options, returning empty array');
			return res.status(200).json({
				options: [],
			});
		}
	} catch (error) {
		console.error('7. Error caught:', error);
		return res.status(200).json({
			options: [],
		});
	}
});

module.exports = router;
