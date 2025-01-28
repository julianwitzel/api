// api/routes/slack.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Add urlencoded parser middleware
router.use(express.urlencoded({ extended: true }));

router.post('/options', async (req, res) => {
	try {
		console.log('Raw body from Slack:', req.body);

		// Slack sends the payload as a urlencoded string in a 'payload' field
		let slackPayload;
		try {
			slackPayload = JSON.parse(req.body.payload);
			console.log('Parsed Slack payload:', slackPayload);
		} catch (parseError) {
			console.error('Error parsing Slack payload:', parseError);
		}

		const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(
				slackPayload || {
					type: 'block_suggestion',
					action_id: slackPayload?.action_id || 'test_action',
					block_id: slackPayload?.block_id || 'test_block',
					value: slackPayload?.value || '',
				}
			),
		});

		const rawResponse = await makeResponse.text();
		console.log('Raw Make.com response:', rawResponse);
		console.log('Make.com response status:', makeResponse.status);

		// For now, return test options to verify Slack integration
		return res.status(200).json({
			options: [
				{
					text: {
						type: 'plain_text',
						text: 'Option 1',
					},
					value: 'option_1',
				},
				{
					text: {
						type: 'plain_text',
						text: 'Option 2',
					},
					value: 'option_2',
				},
			],
		});
	} catch (error) {
		console.error('Detailed error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			details: error.message,
		});
	}
});

module.exports = router;
