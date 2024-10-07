const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const axios = require('axios');

async function fetchImage(url) {
	const response = await axios.get(url, { responseType: 'arraybuffer' });
	return Buffer.from(response.data, 'binary');
}

router.post('/create-og-image', async (req, res) => {
	try {
		const { thumbnailUrl, backgroundUrl } = req.body;

		// Fetch images
		const [thumbnail, background] = await Promise.all([fetchImage(thumbnailUrl), fetchImage(backgroundUrl)]);

		// Process background image
		const processedBackground = await sharp(background)
			.resize(1200, 630, { fit: 'cover' }) // Adjust size and fit for background
			.toBuffer();

		// Process thumbnail (adjust size to match new layout)
		const processedThumbnail = await sharp(thumbnail)
			.resize(600, 600, { fit: 'contain' }) // More balanced sizing
			.toBuffer();

		// Composite images (adjust position to match desired layout)
		const result = await sharp(processedBackground)
			.composite([
				{
					input: processedThumbnail,
					top: 50, // Adjust this value to move the thumbnail vertically
					left: 300, // Adjust this value to center the thumbnail horizontally
				},
			])
			.toBuffer();

		// Send the result
		res.set('Content-Type', 'image/jpeg');
		res.send(result);
	} catch (error) {
		console.error('Error processing image:', error);
		res.status(500).json({ error: 'Error processing image' });
	}
});

module.exports = router;
