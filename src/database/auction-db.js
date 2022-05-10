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
    
        const sql = `INSERT INTO auctions (auction_id, title, minimum_bid, start_date, end_date, channel_id, num_winners) VALUES ('${details.auction_id}', '${details.title}', ${details.minimum_bid}, '${details.start_date}', '${details.end_date}', '${details.channel_id}, ${details.num_winners}');`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new auction!');
			connection.release();
			callback();
        });
    });
};

export const checkExisting = (discordId, callback) => {

	pool.getConnection((err, connection) => {
        if (err) throw err;
    
		const sql = `SELECT * FROM miles WHERE discord_id = "${discordId}"`;
        
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
				const sql = `INSERT INTO miles (discord_id, miles) VALUES ('${discordId}', '0');`;
				connection.query(sql, err => {
					if (err) throw err;
					console.log('Blake: one (1) passenger is entered into the miles table!');
					connection.release();
					callback(existing[0]);
				});
			}
			else callback(existing[0]);
		});
    });
};

export const insertAuctionWinner = (auctionId, winnerId, bid) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `INSERT INTO auction_winners (auction_id, discord_id, bid) VALUES ('${auctionId}', '${winnerId}', ${bid});`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
};

export const getAuctions = (callback) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        const sql = 'SELECT * FROM auctions';

        connection.query(sql, (err, res) => {
            if (err) throw err;
            connection.release();
			callback(res);
        });
    });
};

export const getAuctionWinner = (auctionId, callback) => {

	pool.getConnection((err, connection) => {
        if (err) throw err;
    
		const sql = `SELECT * FROM auction_entries WHERE auction_id = '${auctionId}' ORDER BY bid DESC LIMIT 1;`;
        
		connection.query(sql, (err, res) => {
			if (err) throw err;
			connection.release();
			callback(res[0]);
		});
	});
};

export const updateEndTime = (auctionId, endDate) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `UPDATE auctions SET end_date = '${endDate}' WHERE auction_id = '${auctionId}';`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
};

export const addAuctionEntry = (auctionId, bidderId, bid) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `INSERT INTO auction_entries (auction_id, discord_id, bid) VALUES ('${auctionId}', '${bidderId}', '${bid}');`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
};

export const payMiles = (discordId, quantity) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `UPDATE miles SET miles = miles - ${quantity} WHERE discord_id = '${discordId}'`;
		
		connection.query(sql, (err) => {
			if (err) throw err;
			console.log(`Barbara: Deducted ${quantity} miles to user: ${discordId} for winning Auction!`);
			connection.release();
		});
    });
};

export const getBidHistory = (auctionId) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `SELECT discord_id, bid FROM auction_entries WHERE auction_id = '${auctionId}' ORDER BY bid LIMIT 10;`;
		
		connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
			callback(res);
		});
    });
};

export const getWinners = (auctionId, numWinners, callback) => {
	pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `SELECT discord_id, bid
		FROM (
			SELECT auction_id, discord_id, bid, ROW_NUMBER() OVER (PARTITION BY discord_id ORDER BY bid DESC) AS rn
			FROM auction_entries
		) AS pool
		WHERE pool.rn = 1 AND pool.auction_id = '${auctionId}'
		ORDER BY pool.bid DESC
		LIMIT ${numWinners};`;
		
		connection.query(sql, (err, res) => {
			if (err) throw err;
			connection.release();
			callback(res);
		});
    });
};