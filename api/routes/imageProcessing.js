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
		console.log('Fetching images...');
		const [thumbnail, background] = await Promise.all([fetchImage(thumbnailUrl), fetchImage(backgroundUrl)]);
		console.log('Images fetched successfully');

		// Process background image with cover fit
		console.log('Processing background image...');
		const processedBackground = await sharp(background).resize(1200, 630, { fit: 'cover', position: 'top' }).toBuffer();
		console.log('Background image processed');

		// Process thumbnail
		console.log('Processing thumbnail image...');
		const processedThumbnail = await sharp(thumbnail).resize(600, 600, { fit: 'cover' }).toBuffer();
		console.log('Thumbnail image processed');

		// Composite images with adjusted positioning
		console.log('Compositing images...');
		const result = await sharp(processedBackground)
			.composite([
				{
					input: processedThumbnail,
					top: 15,
					left: 200,
				},
			])
			.toBuffer();
		console.log('Images composited');

		// Send the result
		res.set('Content-Type', 'image/jpeg');
		res.send(result);
	} catch (error) {
		console.error('Error processing image:', error.message);
		console.error(error); // Log the full error object
		res.status(500).json({ error: 'Error processing image', details: error.message });
	}
});

module.exports = router;
