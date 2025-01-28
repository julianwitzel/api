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

		const searchTerm = slackPayload.value?.toLowerCase() || '';

		try {
			// Wrap the payload in an object before sending to Make.com
			const makePayload = {
				payload: slackPayload,
			};

			console.log('Sending to Make.com:', makePayload);

			const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(makePayload), // Send the wrapped payload
			});

			const rawResponse = await makeResponse.text();
			console.log('Raw Make.com response:', rawResponse);

			try {
				const makeData = JSON.parse(rawResponse);
				const options = JSON.parse(makeData.body);
				return res.status(200).json(options);
			} catch (parseError) {
				console.log('Could not parse Make.com response, using fallback options');
				throw new Error('Invalid Make.com response');
			}
		} catch (error) {
			// Fallback options
			const fallbackOptions = [
				{
					text: {
						type: 'plain_text',
						text: `Example Project 1 (${searchTerm})`,
					},
					value: 'project_1',
				},
				{
					text: {
						type: 'plain_text',
						text: `Example Project 2 (${searchTerm})`,
					},
					value: 'project_2',
				},
			];

			const filteredOptions = fallbackOptions.filter((option) => option.text.text.toLowerCase().includes(searchTerm));

			return res.status(200).json({
				options: filteredOptions,
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
