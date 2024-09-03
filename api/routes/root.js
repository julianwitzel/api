const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
	try {
		const filePath = path.join(process.cwd(), 'public', 'index.html');
		const content = await fs.readFile(filePath, 'utf8');
		res.setHeader('Content-Type', 'text/html');
		res.status(200).send(content);
	} catch (error) {
		console.error('Error serving index.html:', error);
		res.status(500).send('An error occurred while loading the page');
	}
};
