const express = require('express');
const Airtable = require('airtable');
const router = express.Router();

// Konfiguration für Airtable Bases
const BASE_ID = process.env.ALFREDS_TOOLBOX_LICENSE_BASE_ID;

// Endpoint für Credentials Anfrage
router.post('/verify-credentials', async (req, res) => {
	try {
		const { domain, license_key } = req.body;

		// Validiere Request Daten
		if (!domain || !license_key) {
			return res.status(400).json({
				success: false,
				error: 'Missing required parameters',
			});
		}

		// Initialisiere Airtable Connection
		const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(BASE_ID);

		// Suche nach der Lizenz in der Lizenzen-Tabelle
		const licenses = await base('Lizenzen')
			.select({
				filterByFormula: `AND(
                {🤖 Key} = '${license_key}',
                {Domain} = '${domain}',
                {Status} = 'Aktiv'
            )`,
			})
			.firstPage();

		// Wenn keine aktive Lizenz gefunden wurde
		if (!licenses || licenses.length === 0) {
			return res.status(403).json({
				success: false,
				error: 'Invalid or inactive license',
			});
		}

		const license = licenses[0];
		console.log('License:', license);
		console.log('Plan field:', license.get('Plan'));

		// Vor dem Service Account Query fügen wir eine Sicherheitsabfrage ein
		if (!license.get('Plan')) {
			return res.status(400).json({
				success: false,
				error: 'No plan associated with license',
				debug: {
					licenseFields: license.fields,
					planField: license.get('Plan'),
				},
			});
		}

		const planRecord = await base('Pläne').find(license.get('Plan')[0]);
		const planName = planRecord.get('Name');

		const serviceAccounts = await base('Services')
			.select({
				filterByFormula: `AND(
				{Status} = 'Aktiv',
				FIND('${planName}', {Erlaubte Pläne})
			)`,
			})
			.firstPage();

		console.log('Plan Name:', planName);
		console.log('Service Accounts found:', serviceAccounts.length);
		console.log('Service Accounts:', serviceAccounts);

		console.log(
			'Raw Service Accounts:',
			serviceAccounts.map((acc) => ({
				id: acc.id,
				fields: acc.fields,
			}))
		);

		// Formatiere die Credentials
		const credentials = serviceAccounts.reduce((acc, account) => {
			console.log('Processing account fields:', account.fields);
			const type = account.get('Typ');
			acc[type] = {
				client_email: account.get('Client Email'),
				private_key: account.get('Private Key'),
			};
			return acc;
		}, {});

		// Logge den Zugriff
		await base('Protokoll').create([
			{
				fields: {
					Lizenz: [license.id],
					'Request Type': 'get_credentials',
					'IP-Adresse': req.ip,
					Status: 200,
					Timestamp: new Date().toISOString(),
				},
			},
		]);

		// Sende die Credentials zurück
		res.json({
			success: true,
			data: {
				credentials,
				license: {
					status: 'Aktiv',
					plan: planLinks[0],
					valid_until: license.get('🤖 Gültig Bis'),
				},
			},
		});
	} catch (error) {
		console.error('Credential verification error:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error',
			details: error.message,
			stack: error.stack, // Nur temporär für Debugging!
		});
	}
});

module.exports = router;
