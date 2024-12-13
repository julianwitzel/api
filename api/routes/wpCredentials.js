const express = require('express');
const Airtable = require('airtable');
const router = express.Router();

// Airtable-Konfiguration
const BASE_ID = process.env.ALFREDS_TOOLBOX_LICENSE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(BASE_ID);

// Hilfsfunktionen
const logRequest = async (licenseId, req, status, errorMessage = null) => {
	await base('Protokoll').create([
		{
			fields: {
				Lizenz: licenseId ? [licenseId] : undefined,
				'Request Type': 'get_credentials',
				'IP-Adresse': req.ip,
				Status: status,
				Nachricht: errorMessage,
				Timestamp: new Date().toISOString(),
			},
		},
	]);
};

const validateLicense = (license, now) => {
	const validFrom = new Date(license.get('🤖 Gültig ab'));
	const validUntil = new Date(license.get('🤖 Gültig bis'));

	if (license.get('Status') !== 'Aktiv') {
		return { code: 403, message: 'License is inactive' };
	} else if (now < validFrom) {
		return { code: 403, message: 'License period has not started yet' };
	} else if (now > validUntil) {
		return { code: 403, message: 'License has expired' };
	}
	return null;
};

const fetchServiceAccounts = async (planName) => {
	const serviceAccounts = await base('Services')
		.select({
			filterByFormula: `AND(
        {Status} = 'Aktiv',
        FIND('${planName}', {Erlaubte Pläne})
      )`,
		})
		.firstPage();

	return serviceAccounts.reduce((acc, account) => {
		const type = account.get('Typ');
		acc[type] = {
			client_email: account.get('Client Email'),
			private_key: account.get('Private Key'),
		};
		return acc;
	}, {});
};

// Endpoint für Credentials Anfrage
router.post('/verify-credentials', async (req, res) => {
	try {
		const { domain, license_key } = req.body;

		// Validiere Eingabedaten
		if (!domain || !license_key) {
			const errorMessage = 'Missing required parameters';
			await logRequest(null, req, 400, errorMessage);
			return res.status(400).json({
				success: false,
				error: errorMessage,
			});
		}

		const licenses = await base('Lizenzen')
			.select({
				filterByFormula: `AND(
			{🤖 Key} = '${license_key}',
			{Domain} = '${domain}'
		  )`,
			})
			.firstPage();

		if (!licenses.length) {
			const errorMessage = 'Invalid license or domain mismatch';
			await logRequest(null, req, 403, errorMessage);
			return res.status(403).json({
				success: false,
				error: errorMessage,
			});
		}

		const license = licenses[0];
		const now = new Date();
		const errorStatus = validateLicense(license, now);

		// Protokollierung für alle Lizenz-Status-Fehler
		if (errorStatus) {
			await logRequest(license.id, req, errorStatus.code, errorStatus.message);
			return res.status(errorStatus.code).json({
				success: false,
				error: errorStatus.message,
			});
		}

		// Zusätzliche Planprüfung
		const planId = license.get('Plan');
		if (!planId) {
			const errorMessage = 'No plan associated with license';
			await logRequest(license.id, req, 400, errorMessage);
			return res.status(400).json({
				success: false,
				error: errorMessage,
			});
		}

		const planRecord = await base('Pläne').find(planId[0]);
		const planName = planRecord.get('Name');
		const credentials = await fetchServiceAccounts(planName);

		// Erfolgsfall protokollieren
		await logRequest(license.id, req, 200);

		res.json({
			success: true,
			data: {
				credentials,
				license: {
					status: 'Aktiv',
					plan: planName,
					valid_until: license.get('🤖 Gültig bis'),
				},
			},
		});
	} catch (error) {
		const errorMessage = 'Internal server error';
		await logRequest(null, req, 500, error.message);
		res.status(500).json({
			success: false,
			error: errorMessage,
			details: error.message,
		});
	}
});

module.exports = router;
