import { createPool } from 'mysql';
import 'dotenv/config';

const pool = createPool({
	connectionLimit: process.env.LIMIT,
	host: process.env.HOST,
	user: process.env.USERNAME,
	password: process.env.PW,
	database: process.env.DB
});

export const burnMiles = (type, quantity) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `UPDATE miles_burned SET ${type} = ${type} + ${quantity} WHERE id = (SELECT MAX(id) FROM miles_burned)`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
}