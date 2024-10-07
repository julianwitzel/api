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

		// Create a rounded rectangle mask
		console.log('Creating rounded corners mask...');
		const roundedCorners = await sharp({
			create: {
				width: 1200,
				height: 630,
				background: { r: 255, g: 255, b: 255, alpha: 0 },
			},
		})
			.png()
			.composite([
				{
					input: Buffer.from(
						`<svg width="1200" height="630">
                    <rect x="0" y="0" width="1200" height="630" rx="50" ry="50" fill="white" />
                </svg>`
					),
					blend: 'dest-in',
				},
			])
			.toBuffer();
		console.log('Rounded corners mask created');

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

		// Apply rounded corners
		console.log('Applying rounded corners...');
		const finalImage = await sharp(result)
			.composite([
				{
					input: roundedCorners,
					blend: 'dest-in',
				},
			])
			.toBuffer();
		console.log('Rounded corners applied');

		// Send the result
		res.set('Content-Type', 'image/jpeg');
		res.send(finalImage);
	} catch (error) {
		console.error('Error processing image:', error.message);
		console.error(error); // Log the full error object
		res.status(500).json({ error: 'Error processing image', details: error.message });
	}
});

module.exports = router;
