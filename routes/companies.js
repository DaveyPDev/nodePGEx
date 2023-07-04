const express = require('express');

const app = express();
const ExpressError = require('../expressError');
const db = require('../db');
const router = express.Router();

app.use(express.json());

// get company lists
router.get('/', async (req, res, next) => {
	try {
		const result = await db.query(`SELECT code, name FROM companies ORDER BY name`);
		return res.json({ companies: result.rows });
	} catch (e) {
		return next(e);
	}
});

//  get company details
router.get('/:code', async (req, res, next) => {
	try {
		let code = req.params.code;
		const companyRes = await db.query(`SELECT code, name, description FROM companies WHERE code =$1`, [ code ]);
		const invoiceRes = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [ code ]);
		if (companyRes.rows.length === 0) {
			throw (new ExpressError(`Invalid Company: ${code}`), 404);
		}
		const company = companyRes.rows[0];
		const invoice = invoiceRes.rows;
		company.invoice = invoice.map((inv) => inv.id);
		return res.json({ company: company });
	} catch (e) {
		return next(e);
	}
});

// add company to list
router.post('/', async (req, res, next) => {
	try {
		let { name, description } = req.body;
		let code = req.params.code;
		const result = await db.query(
			`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
			[ code, name, description ]
		);

		return res.statusCode(201).json({ company: result.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// edit company details         !* why is it put and not patch? *!
router.put('/:code', async (req, res, next) => {
	try {
		let { name, description } = req.body;
		let code = req.params.code;
		const result = await db.query(
			`UPDATE companies SET name=$1, decription=$2 WHERE code = $3 RETURNING code, name, description`,
			[ name, description, code ]
		);

		if (companyRes.rows.length === 0) {
			throw (new ExpressError(`Invalid Company: ${code}`), 404);
		}
		else {
			return res.json({ company: result.rows[0] });
		}
	} catch (e) {
		return next(e);
	}
});

// delete company from list 
router.delete('/:code', async (req, res, next) => {
	try {
		let code = req.params.code;
		const result = await db.query(` DELETE FROM companies WHERE code=$1 RETURNING code`, [ code ]);

		if (result.rows.length === 0) {
			throw new ExpressError(`Invalid Company: ${code}`, 404);
		}
		else {
			return res.json({ statud: 'deleted' });
		}
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
