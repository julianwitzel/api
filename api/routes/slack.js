// api/routes/slack.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/options', async (req, res) => {
	try {
		// Log the complete request from Slack
		console.log('Headers from Slack:', req.headers);
		console.log('Body from Slack:', req.body);

		// Create a test payload if we receive empty data
		const payload = {
			type: 'block_suggestion',
			block_id: 'test_block',
			action_id: 'test_action',
			value: '',
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
		};

		const makeResponse = await fetch('https://hook.eu1.make.com/idqd81md0dp59hz3o1nr7nt41xu46umc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body.payload || payload), // Use req.body.payload if exists, otherwise use test payload
		});

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

		// For testing, if Make.com fails, return our test options directly
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
