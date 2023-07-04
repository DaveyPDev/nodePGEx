const express = require('express');

const app = express();
const ExpressError = require('../expressError');
const db = require('../db');
const router = express.Router();

app.use(express.json());

// get invoice lists
router.get('/', async (req, res, next) => {
	try {
		const result = await db.query(`SELECT id, comp_code FROM invoices ORDER BY id`);
		return res.json({ invoices: result.rows });
	} catch (e) {
		return next(e);
	}
});

//  get company details
router.get('/:id', async (req, res, next) => {
	try {
		let id = req.params.code;
		const result = await db.query(
			`SELECT i.id, i.comp_code, i.amt, i.paid, i.add_data, i.paid_data,, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id=$1`,
			[ id ]
		);
		if (result.rows.length === 0) {
			throw (new ExpressError(`Invalid invoice: ${id}`), 404);
		}
		const data = result.rows[0];
		const invoice = {
			id        : data.id,
			company   : { code: data.comp_code, name: data.name, description: data.description },
			amt       : data.amt,
			paid      : data.paid,
			add_date  : data.add_date,
			paid_date : data.paid_date
		};
		return res.json({ invoice: invoice });
	} catch (e) {
		return next(e);
	}
});

// add company to list
router.post('/', async (req, res, next) => {
	try {
		let { comp_code, amt } = req.body;

		const result = await db.query(
			`INSERT INTO invoices (comp_code, amt) 
               VALUES ($1, $2) 
               RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ comp_code, amt ]
		);
		return res.json({ invoice: result.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// edit company details         !* why is it put and not patch? *!
router.put('/:id', async (req, res, next) => {
	try {
		let { amt, paid } = req.body;
		let id = req.params.id;
		let dueDate = null;

		const balanceRes = await db.query(`SELECT paid FROM invoices WHERE id=$1`, [ id ]);
		if (balanceRes.rows.length === 0) {
			throw new ExpressError('Invalid invoice: ${id', 404);
		}

		const balanceDueDate = balanceRes.rows[0].dueDate;
		if (!balanceDueDate && paid) {
			dueDate = new Date();
		}
		else if (!paid) {
			dueDate = null;
		}
		else {
			dueDate = balanceDueDate;
		}

		const result = await db.query(
			`UPDATE invoices SET amt=$1, paid=$2, due_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[ amt, paid, dueDate, id ]
		);
		return res.json({ invoice: result.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// delete company from list
router.delete('/:id', async (req, res, next) => {
	try {
		let id = req.params.code;
		const result = await db.query(` DELETE FROM invoices WHERE id=$1 RETURNING id`, [ id ]);

		if (result.rows.length === 0) {
			throw new ExpressError(`Invalid invoice: ${id}`, 404);
		}
		return res.json({ statud: 'deleted' });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
