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

		// Process background image with cover fit
		const processedBackground = await sharp(background)
			.resize(1200, 630, { fit: 'cover', position: 'top' }) // Aligns the background image to the top
			.toBuffer();

		// Process thumbnail
		const processedThumbnail = await sharp(thumbnail)
			.resize(600, 600, { fit: 'cover' }) // Adjust thumbnail to cover
			.toBuffer();

		// Create a rounded rectangle mask
		const roundedCorners = await sharp({
			create: {
				width: 1200,
				height: 630,
				background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
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
					blend: 'dest-in', // Create a mask
				},
			])
			.toBuffer();

		// Composite images with adjusted positioning
		const result = await sharp(processedBackground)
			.composite([
				{
					input: processedThumbnail,
					top: 15, // Position the thumbnail closer to the top
					left: 200, // Center the thumbnail horizontally
				},
			])
			.toBuffer();

		// Apply rounded corners
		const finalImage = await sharp(result)
			.composite([
				{
					input: roundedCorners,
					blend: 'dest-in', // Mask the image with rounded corners
				},
			])
			.toBuffer();

		// Send the result
		res.set('Content-Type', 'image/jpeg');
		res.send(finalImage);
	} catch (error) {
		console.error('Error processing image:', error);
		res.status(500).json({ error: 'Error processing image' });
	}
});

module.exports = router;
