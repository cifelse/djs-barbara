import { createPool } from 'mysql';
import 'dotenv/config';

const pool = createPool({
	connectionLimit: process.env.LIMIT,
	host: process.env.HOST,
	user: process.env.USERNAME,
	password: process.env.PW,
	database: process.env.DB
});

// CREATING A LOTTERY AND SAVING IT TO DATABASE
export const saveLottery = (details, callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `INSERT INTO lotteries (lottery_id, title, num_winners, num_entries, price, max_tickets, miles_burned, start_date, end_date, ffa, channel_id) VALUES ('${details.lottery_id}', '${details.title}', ${details.num_winners}, ${details.num_entries}, ${details.price}, ${details.max_tickets}, 0, '${details.start_date}', '${details.end_date}', ${details.ffa}, '${details.channel_id}')`;
		
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new lottery!');
			connection.release();
			callback();
        });
    });
}

export const getLotteries = (callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        const sql = 'SELECT * FROM lotteries';

        connection.query(sql, (err, res) => {
            if (err) throw err;
            connection.release();
			callback(res);
        });
    });
}

export const updateLotteryEntries = (lotteryId) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
        // Increment Entries
        const sql = `UPDATE lotteries SET num_entries = num_entries + 1 WHERE lottery_id = '${lotteryId}'`;
        
        connection.query(sql, (err) => {
            if (err) throw err;
            // End the Connection
            connection.release();
        });
    });
}

export const insertLotteryEntry = (lotteryId, discordId, price) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
            // Insert a Record to the Table
            const sql = `INSERT INTO lottery_entries (lottery_id, discord_id, price) VALUES ('${lotteryId}', '${discordId}', '${price}')`;
			
            connection.query(sql, err => {
                if (err) throw err;
                console.log('Barbara: one (1) passenger is entered into the lottery pool!');
            });

            // End the Connection
            connection.release();
        });
}

export const getLotteryEntries = (lotteryId, callback) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        const sql = `SELECT num_entries FROM lotteries WHERE lottery_id = ${lotteryId}`;

        connection.query(sql, (err, res) => {
            if (err) throw err;
            connection.release();
            callback(res);
        });
    });
}

export const getGamblers = (lotteryId, callback) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `SELECT * FROM lottery_entries WHERE lottery_id = "${lotteryId}"`;
    
        connection.query(sql, (err, result) => {
			if (err) throw err;
			connection.release();
            callback(result);
        });
    });
}

export const checkMaxTicketsAndEntries = (lotteryId, discordId, callback) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `SELECT l.max_tickets, l.price, COUNT(*) as 'entries' FROM lotteries l JOIN lottery_entries g ON l.lottery_id = g.lottery_id WHERE l.lottery_id = '${lotteryId}' AND g.discord_id = '${discordId}';`;
        connection.query(sql, (err, result) => {
			if (err) throw err;
			connection.release();
            callback(result[0]);
        });
    });
}

export const checkExisting = (discordId, callback) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
    
		const sql = `SELECT * FROM miles WHERE discord_id = "${discordId}"`
        
		connection.query(sql, (err, res) => {
			if (err) throw err;
			if (!res[0]) {
				connection.release();
				callback(res);
				return;
			}
			connection.release();
			callback(res);
		});
	});
}

export const checkExceedingQuantity = (discordId, quantity, callback) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
		const sql = `SELECT miles FROM miles WHERE miles < ${quantity} AND discord_id = ${discordId}`;
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
				const sql = `UPDATE miles SET miles = miles - ${quantity} WHERE discord_id = '${discordId}'`;
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

export const getDataForBet = (lotteryId, discordId, callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `SELECT l.title, l.price, COUNT(*) as 'entries' FROM lotteries l JOIN lottery_entries g ON l.lottery_id = g.lottery_id WHERE l.lottery_id = '${lotteryId}' AND g.discord_id = '${discordId}';`;
        connection.query(sql, (err, result) => {
			if (err) throw err;
			connection.release();
            callback(result[0]);
        });
    });
}

export const getStrictMode = (lotteryId, callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `SELECT ffa FROM lotteries WHERE lottery_id = '${lotteryId}';`;
        connection.query(sql, (err, result) => {
			if (err) throw err;
			connection.release();
            callback(result[0]);
        });
    });
}

export const updateMilesBurned = (lotteryId, miles) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `UPDATE lotteries SET miles_burned = miles_burned + ${miles} WHERE lottery_id = '${lotteryId}';`;
		
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log(`Barbara: Added ${miles} to miles burned in lottery table!`);
			connection.release();
        });
    });
}

export const insertLotteryWinner = (lotteryId, user) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `INSERT INTO lottery_winners (lottery_id, discord_id) VALUES ('${lotteryId}', '${user.id}');`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
}