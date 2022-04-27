const mysql = require('mysql');

// CREATING A LOTTERY AND SAVING IT TO DATABASE
function saveLottery(details, callback) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `INSERT INTO lotteries (lottery_id, title, num_winners, num_entries, price, max_tickets, miles_burned, start_date, end_date, ffa, channel_id) VALUES ('${details.lottery_id}', '${details.title}', ${details.num_winners}, ${details.num_entries}, ${details.price}, ${details.max_tickets}, 0, '${details.start_date}', '${details.end_date}', ${details.ffa}, '${details.channel_id}')`;
		
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new lottery!');
			connection.end();
			callback();
        });
    });
}

function getLotteries(callback) {
	const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
		timezone: 'Z',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = 'SELECT * FROM lotteries';

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
			callback(res);
        });
    });
}

function updateLotteryEntries(lotteryId) {
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        // Increment Entries
        const sql = `UPDATE lotteries SET num_entries = num_entries + 1 WHERE lottery_id = '${lotteryId}'`;
        
        con.query(sql, (err) => {
            if (err) throw err;
            // End the Connection
            con.end();
        });
    });
}

function insertLotteryEntry(lotteryId, discordId, price) {
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
            // Insert a Record to the Table
            sql = `INSERT INTO lottery_entries (lottery_id, discord_id, price) VALUES ('${lotteryId}', '${discordId}', '${price}')`;
			
            con.query(sql, err => {
                if (err) throw err;
                console.log('Barbara: one (1) passenger is entered into the lottery pool!');
            });

            // End the Connection
            con.end();
        });
}

function getLotteryEntries(lotteryId, callback) {
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = `SELECT num_entries FROM lotteries WHERE lottery_id = ${lotteryId}`;

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
            callback(res);
        });
    });
}

function getGamblers(lotteryId, callback) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `SELECT * FROM lottery_entries WHERE lottery_id = "${lotteryId}"`;
    
        connection.query(sql, (err, result) => {
			if (err) throw err;
			connection.end();
            callback(result);
        });
    });
}

function checkMaxTicketsAndEntries(lotteryId, discordId, callback) {
    const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `SELECT l.max_tickets, l.price, COUNT(*) as 'entries' FROM lotteries l JOIN lottery_entries g ON l.lottery_id = g.lottery_id WHERE l.lottery_id = '${lotteryId}' AND g.discord_id = '${discordId}';`;
        connection.query(sql, (err, result) => {
			if (err) throw err;
			connection.end();
            callback(result[0]);
        });
    });
}

function checkExisting(discordId, callback) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

	connection.connect(err => {
        if (err) throw err;
    
		let sql = `SELECT * FROM miles WHERE discord_id = "${discordId}"`
        
		connection.query(sql, (err, res) => {
			if (err) throw err;
			if (!res[0]) {
				connection.end();
				callback(res);
				return;
			}
			connection.end();
			callback(res);
		});
	});
}

function checkExceedingQuantity(discordId, quantity, callback) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

	connection.connect(err => {
        if (err) throw err;
		sql = `SELECT miles FROM miles WHERE miles < ${quantity} AND discord_id = ${discordId}`;
		connection.query(sql, (err, res) => {
			if (err) throw err;
			if (!res[0]) {
				connection.end();
				callback(false);
				return;
			}
			connection.end();
			callback(true);
			return;
		});
	});
}

function removeMiles(discordId, quantity, callback) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

	connection.connect(err => {
        if (err) throw err;
		checkExisting(discordId, existing => {
			if (!existing[0]) {
				connection.end();
				callback(null)
				return;
			}
			checkExceedingQuantity(discordId, quantity, exceeded => {
				if (exceeded) {
					callback(true);
					connection.end();
					return;
				}
				sql = `UPDATE miles SET miles = miles - ${quantity} WHERE discord_id = '${discordId}'`;
				connection.query(sql, (err) => {
				if (err) throw err;
				console.log(`Blake: Deducted ${quantity} miles to user: ${discordId}`);
				connection.end();
				callback(false);
				return;
			});
			})
		});
    });
}

function getDataForBet(lotteryId, discordId, callback) {
    const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `SELECT l.title, l.price, COUNT(*) as 'entries' FROM lotteries l JOIN lottery_entries g ON l.lottery_id = g.lottery_id WHERE l.lottery_id = '${lotteryId}' AND g.discord_id = '${discordId}';`;
        connection.query(sql, (err, result) => {
			if (err) throw err;
			connection.end();
            callback(result[0]);
        });
    });
}

function getStrictMode(lotteryId, callback) {
    const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `SELECT ffa FROM lotteries WHERE lottery_id = '${lotteryId}';`;
        connection.query(sql, (err, result) => {
			if (err) throw err;
			connection.end();
            callback(result[0]);
        });
    });
}

function updateMilesBurned(lotteryId, miles) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `UPDATE lotteries SET miles_burned = miles_burned + ${miles} WHERE lottery_id = '${lotteryId}';`;
		
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log(`Barbara: Added ${miles} to miles burned in lottery table!`);
			connection.end();
        });
    });
}

module.exports = {
	saveLottery,
    getLotteries,
	updateLotteryEntries,
	insertLotteryEntry,
	getLotteryEntries,
	getGamblers,
    checkMaxTicketsAndEntries,
    checkExisting,
    removeMiles,
    getDataForBet,
    getStrictMode,
	updateMilesBurned,
}