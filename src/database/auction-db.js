import { createPool } from 'mysql';
import 'dotenv/config';

const pool = createPool({
	connectionLimit: process.env.LIMIT,
	host: process.env.HOST,
	user: process.env.USERNAME,
	password: process.env.PW,
	database: process.env.DB
});

// CREATING AN AUCTION AND SAVING IT TO DATABASE
export const saveAuction = (details, callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `INSERT INTO auctions (auction_id, title, minimum_bid, start_date, end_date, highest_bidder, bid, channel_id) VALUES ('${details.auction_id}', '${details.title}', ${details.minimum_bid}, '${details.start_date}', '${details.end_date}', null, null, '${details.channel_id}');`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new auction!');
			connection.release();
			callback();
        });
    });
}

export const checkExisting = (discordId, callback) => {

	pool.getConnection((err, connection) => {
        if (err) throw err;
    
		const sql = `SELECT * FROM miles WHERE discord_id = "${discordId}"`;
        
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

export const checkMiles = (discordId, callback) => {

	pool.getConnection((err, connection) => {
        if (err) throw err;
    
		checkExisting(discordId, existing => {
			if (!existing[0]) {
				const sql = `INSERT INTO miles (discord_id, miles) VALUES ('${discordId}', '0');`;
				connection.query(sql, err => {
					if (err) throw err;
					console.log('Blake: one (1) passenger is entered into the miles table!');
					connection.release();
				});
				callback(existing[0]);
			}
			else callback(existing[0]);
		});
    });
}

export const updateBid = (auctionId, user, bid) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `UPDATE auctions SET highest_bidder = '${user.id}', bid = '${bid}' WHERE auction_id = '${auctionId}';`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
}

export const getAuctions = (callback) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        const sql = 'SELECT * FROM auctions';

        connection.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
			callback(res);
        });
    });
}

export const getAuction = (auction_id, callback) => {

	pool.getConnection((err, connection) => {
        if (err) throw err;
    
		const sql = `SELECT * FROM auctions WHERE auction_id = "${auction_id}"`;
        
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

export const updateEndTime = (auctionId, endDate) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `UPDATE auctions SET end_date = '${endDate}' WHERE auction_id = '${auctionId}';`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
}

export const addToBidHistory = (auctionId, bidderId, bid) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `INSERT INTO auction_entries (auction_id, bidder_id, bid) VALUES ('${auctionId}', '${bidderId}', '${bid}');`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
}