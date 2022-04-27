const mysql = require('mysql');

// CREATING AN AUCTION AND SAVING IT TO DATABASE
function saveAuction(details, callback) {
	const connection = mysql.createConnection({
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

function checkExisting(discordId, callback) {
	const connection = mysql.createConnection({
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

function checkMiles(discordId, callback) {
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

function updateBid(auctionId, user, bid) {
	const connection = mysql.createConnection({
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

function getAuctions(callback) {
	const con = mysql.createConnection({
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

function getAuction(auction_id, callback) {
	const connection = mysql.createConnection({
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

function updateEndTime(auctionId, endDate) {
	const connection = mysql.createConnection({
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

function addToBidHistory(auctionId, bidderId, bid) {
	const connection = mysql.createConnection({
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

module.exports = {
	saveAuction,
	checkMiles,
	updateBid,
	getAuctions,
	getAuction,
	updateEndTime,
	addToBidHistory,
};