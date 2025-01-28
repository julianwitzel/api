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
			// Try to get data from Make.com
			const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(slackPayload),
			});

			const rawResponse = await makeResponse.text();
			console.log('Raw Make.com response:', rawResponse);

			// Try to parse the response
			try {
				const makeData = JSON.parse(rawResponse);
				const options = JSON.parse(makeData.body);
				return res.status(200).json(options);
			} catch (parseError) {
				console.log('Could not parse Make.com response, using fallback options');
				// If Make.com response can't be parsed, fall back to test options
				throw new Error('Invalid Make.com response');
			}
		} catch (error) {
			// Fallback options that incorporate the search term
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

			// Filter fallback options based on search term
			const filteredOptions = fallbackOptions.filter((option) => option.text.text.toLowerCase().includes(searchTerm));

			return res.status(200).json({
				options: filteredOptions,
			});
		}
	} catch (error) {
		console.error('Detailed error:', error);
		// Even in case of error, return empty options array rather than error
		return res.status(200).json({
			options: [],
		});
	}
});

module.exports = router;
