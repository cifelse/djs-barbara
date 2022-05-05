import { createConnection } from 'mysql';

// CREATING AN AUCTION AND SAVING IT TO DATABASE
export const saveAuction = (details, callback) => {
	const connection = createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `INSERT INTO auctions (auction_id, title, minimum_bid, start_date, end_date, highest_bidder, bid, channel_id) VALUES ('${details.auction_id}', '${details.title}', ${details.minimum_bid}, '${details.start_date}', '${details.end_date}', null, null, '${details.channel_id}');`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new auction!');
			connection.end();
			callback();
        });
    });
}

export const checkExisting = (discordId, callback) => {
	const connection = createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

	connection.connect(err => {
        if (err) throw err;
    
		const sql = `SELECT * FROM miles WHERE discord_id = "${discordId}"`;
        
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

export const checkMiles = (discordId, callback) => {
	const connection = createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

	connection.connect(err => {
        if (err) throw err;
    
		checkExisting(discordId, existing => {
			if (!existing[0]) {
				const sql = `INSERT INTO miles (discord_id, miles) VALUES ('${discordId}', '0');`;
				connection.query(sql, err => {
					if (err) throw err;
					console.log('Blake: one (1) passenger is entered into the miles table!');
					connection.end();
				});
				callback(existing[0]);
			}
			else callback(existing[0]);
		});
    });
}

export const updateBid = (auctionId, user, bid) => {
	const connection = createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `UPDATE auctions SET highest_bidder = '${user.id}', bid = '${bid}' WHERE auction_id = '${auctionId}';`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.end();
        });
    });
}

export const getAuctions = (callback) => {
	const con = createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
		timezone: 'Z',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = 'SELECT * FROM auctions';

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
			callback(res);
        });
    });
}

export const getAuction = (auction_id, callback) => {
	const connection = createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

	connection.connect(err => {
        if (err) throw err;
    
		const sql = `SELECT * FROM auctions WHERE auction_id = "${auction_id}"`;
        
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

export const updateEndTime = (auctionId, endDate) => {
	const connection = createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `UPDATE auctions SET end_date = '${endDate}' WHERE auction_id = '${auctionId}';`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.end();
        });
    });
}

export const addToBidHistory = (auctionId, bidderId, bid) => {
	const connection = createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `INSERT INTO auction_entries (auction_id, bidder_id, bid) VALUES ('${auctionId}', '${bidderId}', '${bid}');`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.end();
        });
    });
}

export const addOneAuctionCreated = () => {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `UPDATE daily_logs SET auctions_created = auctions_created + 1 WHERE id = (SELECT MAX(id) FROM daily_logs)`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.end();
        });
    });
}