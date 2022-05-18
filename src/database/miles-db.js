import { createPool } from 'mysql';
import 'dotenv/config';

const pool = createPool({
	connectionLimit: process.env.LIMIT,
	host: process.env.HOST,
	user: process.env.USERNAME,
	password: process.env.PW,
	database: process.env.DB,
});

export const updateMilesBurned = (quantity, type) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
        let sql = `UPDATE miles_burned SET ${type} = ${type} + ${quantity} WHERE id = (SELECT MAX(id) FROM miles_burned)`;
        connection.query(sql, (err) => {
            if (err) throw err;
            connection.release();
        });
    })
};

export const checkExisting = (discordId, callback) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
    
		const sql = `SELECT * FROM accounts WHERE discord_id = "${discordId}"`;
        
		connection.query(sql, (err, res) => {
			if (err) throw err;
			connection.release();
			callback(res);
		});
	});
};

export const checkMiles = (discordId, callback) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
    
		checkExisting(discordId, existing => {
			if (!existing[0]) {
				const sql = `INSERT INTO accounts (discord_id, level, first_class miles, miles_spent, num_transfers, lotteries_won, auctions_wonn, giveaways_won, wallet) VALUES ('${discordId}', null, 0, 0, 0, 0, 0, 0, 0, null);`;
				connection.query(sql, err => {
					if (err) throw err;
					console.log('Blake: one (1) passenger is entered into the miles table!');
					connection.release();
				});
			}
			callback(existing[0]);
		});
    });
};

export const checkExceedingQuantity = (discordId, quantity, callback) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
		const sql = `SELECT miles FROM accounts WHERE miles < ${quantity} AND discord_id = ${discordId}`;
		connection.query(sql, (err, res) => {
			if (err) throw err;
			if (!res[0]) {
				connection.release();
				callback(false);
				return;
			}
			connection.release();
			callback(true);
			return;
		});
	});
}

export const removeMiles = (discordId, quantity, callback) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
		checkExisting(discordId, existing => {
			if (!existing[0]) {
				connection.release();
				callback(null)
				return;
			}
			checkExceedingQuantity(discordId, quantity, exceeded => {
				if (exceeded) {
					callback(true);
					connection.release();
					return;
				}
				const sql = `UPDATE accounts SET miles = miles - ${quantity} WHERE discord_id = '${discordId}'`;
				connection.query(sql, (err) => {
					if (err) throw err;
					console.log(`Blake: Deducted ${quantity} miles to user: ${discordId}`);
					connection.release();
					callback(false);
					return;
				});
			})
		});
    });
}