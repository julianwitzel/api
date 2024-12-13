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

	switch (status) {
		case 'Gelöscht':
			return {
				code: 403,
				message: 'License is deleted',
				details: 'This license has been permanently deleted',
			};
		case 'Inaktiv':
			return {
				code: 403,
				message: 'License is inactive',
				details: 'This license is currently deactivated',
			};
		case 'Gesperrt':
			return {
				code: 403,
				message: 'License is suspended',
				details: 'This license has been suspended',
			};
		case 'Aktiv':
			if (now < validFrom) {
				return {
					code: 403,
					message: 'License not yet valid',
					details: `License period starts at ${validFrom.toISOString()}`,
				};
			}
			if (now > validUntil) {
				return {
					code: 403,
					message: 'License has expired',
					details: `License expired at ${validUntil.toISOString()}`,
				};
			}
			break;
		default:
			return {
				code: 403,
				message: 'Invalid license status',
				details: `Unknown status: ${status}`,
			};
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
		// 1. Parameter-Validierung
		const { domain, license_key } = req.body;
		if (!domain || !license_key) {
			await logRequest(null, req, 400, traceId, 'Missing parameters: ' + (!domain ? 'domain ' : '') + (!license_key ? 'license_key' : ''));
			return res.status(400).json({
				success: false,
				error: 'Missing required parameters',
				missing: (!domain ? ['domain'] : []).concat(!license_key ? ['license_key'] : []),
				traceId,
			});
		}

		// 2. Lizenzsuche
		const licenses = await base('Lizenzen')
			.select({
				filterByFormula: `AND(
			  {🤖 Key} = '${license_key}',
			  {Domain} = '${domain}'
			)`,
			})
			.firstPage();

		// 3. Lizenz nicht gefunden
		if (!licenses.length) {
			await logRequest(null, req, 404, traceId, 'License not found');
			return res.status(404).json({
				success: false,
				error: 'License not found',
				details: 'No license exists for this domain/key combination',
				traceId,
			});
		}

		// 4. Lizenz gefunden - Status prüfen
		const license = licenses[0];
		const now = new Date();
		const errorStatus = validateLicense(license, now);

		if (errorStatus) {
			await logRequest(license.id, req, errorStatus.code, traceId, errorStatus.message);
			return res.status(errorStatus.code).json({
				success: false,
				error: errorStatus.message,
				license_status: {
					status: license.get('Status'),
					valid_from: license.get('🤖 Gültig ab'),
					valid_until: license.get('🤖 Gültig bis'),
				},
				traceId,
			});
		}

		// 5. Plan-Validierung
		const planId = license.get('Plan');
		if (!planId) {
			await logRequest(license.id, req, 400, traceId, 'License has no plan');
			return res.status(400).json({
				success: false,
				error: 'License configuration error',
				details: 'No plan associated with license',
				traceId,
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
		const message = `Internal server error: ${error.message}`;
		await logRequest(error.licenseId || null, req, 500, traceId, message);
		res.status(500).json({
			success: false,
			error: 'Internal server error',
			details: error.message,
			traceId,
		});
	}
});

module.exports = router;
