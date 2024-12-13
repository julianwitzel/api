const express = require('express');
const Airtable = require('airtable');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Airtable-Konfiguration
const BASE_ID = process.env.ALFREDS_TOOLBOX_LICENSE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(BASE_ID);

// Hilfsfunktionen
const logRequest = async (licenseId, req, status, traceId, message = '') => {
	await base('Protokoll').create([
		{
			fields: {
				Lizenz: [licenseId],
				'Request Type': 'get_credentials',
				'IP-Adresse': req.ip,
				Status: status,
				'Trace ID': traceId,
				Nachricht: message,
				Timestamp: new Date().toISOString(),
			},
		},
	]);
};

const validateLicense = (license, now) => {
	const validFrom = new Date(license.get('🤖 Gültig ab'));
	const validUntil = new Date(license.get('🤖 Gültig bis'));
	const status = license.get('Status');

	if (status === 'Gelöscht') {
		return { code: 403, message: 'License is deleted' };
	} else if (status !== 'Aktiv') {
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
	const traceId = uuidv4();

	try {
		const { domain, license_key } = req.body;
		if (!domain || !license_key) {
			return res.status(400).json({
				success: false,
				error: 'Missing required parameters',
				traceId,
			});
		}

		const licenses = await base('Lizenzen')
			.select({
				filterByFormula: `AND(
          {🤖 Key} = '${license_key}',
          {Domain} = '${domain}',
          {Status} = 'Aktiv'
        )`,
			})
			.firstPage();

		if (!licenses.length) {
			return res.status(403).json({
				success: false,
				error: 'Invalid or inactive license',
				traceId,
			});
		}

		const license = licenses[0];
		const now = new Date();
		const errorStatus = validateLicense(license, now);

		if (errorStatus) {
			await logRequest(license.id, req, errorStatus.code, traceId, errorStatus.message);
			return res.status(errorStatus.code).json({
				success: false,
				error: errorStatus.message,
				traceId,
			});
		}

		const planId = license.get('Plan');
		if (!planId) {
			const message = 'No plan associated with license';
			await logRequest(license.id, req, 400, traceId, message);
			return res.status(400).json({
				success: false,
				error: message,
				traceId,
			});
		}

		const planRecord = await base('Pläne').find(planId[0]);
		const planName = planRecord.get('Name');
		const credentials = await fetchServiceAccounts(planName);

		await logRequest(license.id, req, 200, traceId, 'Request successful');

		res.json({
			success: true,
			data: {
				credentials,
				license: {
					status: 'Aktiv',
					plan: planName,
					valid_until: license.get('🤖 Gültig bis'),
				},
				traceId,
			},
		});
	} catch (error) {
		const message = 'Internal server error';
		res.status(500).json({
			success: false,
			error: message,
			traceId,
			details: error.message,
		});
	}
});

module.exports = router;
