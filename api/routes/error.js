const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

const errorDetails = {
	400: { title: 'Bad Request', heading: 'Falsche Abzweigung!', message: 'Dein Browser hat uns eine krumme Anfrage geschickt – da passt was nicht zusammen.' },
	401: { title: 'Unauthorized', heading: 'Zutritt verboten!', message: 'Ohne Berechtigung geht es hier nicht weiter – bitte anmelden!' },
	403: {
		title: 'Forbidden',
		heading: 'Kein Durchkommen!',
		message: 'Interessierst Du Dich für unsere Prozesse? Leute wie Dich brauchen wir!',
		showButton: true,
		buttonText: 'Karriere bei VIERLESS',
		buttonLink: 'https://vierless.de/karriere/',
	},
	404: { title: 'Not Found', heading: 'Irgendwo im Nirgendwo!', message: 'Die Seite existiert nicht – oder hat vielleicht nie existiert.' },
	500: { title: 'Internal Server Error', heading: 'Server auf Kaffeepause!', message: 'Unser Server braucht eine Pause – wir arbeiten schon an der Lösung.' },
};

const renderErrorPage = async (req, res, statusCode) => {
	const templatePath = path.join(process.cwd(), 'public', 'html', 'error.html');

	try {
		let template = await fs.readFile(templatePath, 'utf8');
		const error = errorDetails[statusCode] || errorDetails[500];

		template = template
			.replace(/\{\{errorCode\}\}/g, statusCode)
			.replace(/\{\{errorTitle\}\}/g, error.title)
			.replace(/\{\{errorHeading\}\}/g, error.heading)
			.replace(/\{\{errorMessage\}\}/g, error.message);

		if (error.showButton) {
			template = template
				.replace('{{#if showButton}}', '')
				.replace('{{/if}}', '')
				.replace(/\{\{buttonText\}\}/g, error.buttonText)
				.replace(/\{\{buttonLink\}\}/g, error.buttonLink);
		} else {
			// Remove the button section if showButton is false
			template = template.replace(/\{\{#if showButton\}\}[\s\S]*?\{\{\/if\}\}/g, '');
		}

		res.status(parseInt(statusCode)).send(template);
	} catch (err) {
		console.error('Error reading template:', err);
		res.status(500).send('An error occurred while loading the error page');
	}
};

router.get('/', async (req, res) => {
	const statusCode = req.query.code || res.statusCode || 500;
	await renderErrorPage(req, res, statusCode);
});

module.exports = router;
module.exports.renderErrorPage = renderErrorPage;
