const mysql = require('mysql');

// CREATING A GIVEAWAY AND SAVING IT TO DATABASE
function saveAuction(details) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `INSERT INTO auctions (auction_id, title, minimum_bid, bidder_id, miles) VALUES ('${details.title}', '${details.giveaway_id}', '${details.num_winners}', '${details.num_entries}', '${details.start_date}', '${details.end_date}', '${details.multiplier}', '${details.strict_mode}', '${details.channel_id}')`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new auction!');
			connection.end();
        });
    });
}

module.exports = {
	saveAuction,
};