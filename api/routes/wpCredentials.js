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
	try {
		await base('Protokoll').create([
			{
				fields: {
					Lizenz: licenseId ? [licenseId] : undefined,
					'Request Type': 'get_credentials',
					'IP-Adresse': req.ip,
					Status: status,
					'Trace ID': traceId,
					Nachricht: message,
					Timestamp: new Date().toISOString(),
				},
			},
		]);
	} catch (error) {
		console.error('Logging failed:', error);
	}
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
			await logRequest(null, req, 400, traceId, 'Missing required parameters');
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
			await logRequest(null, req, 403, traceId, 'Invalid or inactive license');
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
				trace_id: traceId,
				error: errorStatus.message,
			});
		}

		const planId = license.get('Plan');
		if (!planId) {
			await logRequest(license.id, req, 400, traceId, 'No plan associated with license');
			return res.status(400).json({
				success: false,
				trace_id: traceId,
				error: 'No plan associated with license',
			});
		}

		const planRecord = await base('Pläne').find(planId[0]);
		const planName = planRecord.get('Name');
		const credentials = await fetchServiceAccounts(planName);

		await logRequest(license.id, req, 200, traceId, 'Success');
		res.json({
			success: true,
			trace_id: traceId,
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
		const message = 'Internal server error';
		await logRequest(null, req, 500, traceId, `${message}: ${error.message}`);
		res.status(500).json({
			success: false,
			error: message,
			traceId,
			details: error.message,
		});
	}
});

module.exports = router;
