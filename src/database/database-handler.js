const mysql = require('mysql');

// CREATING A GIVEAWAY AND SAVING IT TO DATABASE
function saveGiveaway(details) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `INSERT INTO giveaways (title, giveaway_id, num_winners, num_entries, start_date, end_date, multiplier, strict_mode, channel_id, ongoing) VALUES ('${details.title}', '${details.messageId}', '${details.winnerCount}', '${details.entries}', '${details.createdOn}', '${details.endsOn}', '${details.multiplier}', '${details.all}', '${details.channelId}', 1)`;
    
        connection.query(sql, (err, result) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new giveaway!');
			connection.end();
        });
    });
}

// ENTERING A PARTICIPANT
function insertParticipant(giveawayId, discordId, username, discriminator) {
    
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        
        // Check if the Giveaway exists
        let sql = `SELECT COUNT(1) as 'value' FROM giveaways WHERE giveaway_id = '${giveawayId}'`;
        con.query(sql, (err, res) => {
            if (err) throw err;
            if (res[0].value == 0) {
                console.log('Barbara: Unfortunately, there\'s no such giveaway.');
                con.end();
                return;
            }

            // Insert a Record to the Table
            sql = `INSERT INTO participants (giveaway_id, discord_id, username, discriminator) VALUES ('${giveawayId}', '${discordId}', '${username}', '${discriminator}')`;
            con.query(sql, err => {
                if (err) throw err;
                console.log('Barbara: one (1) passenger is entered into the pool!');
            });

            // Increment Entries
            sql = `UPDATE giveaways SET num_entries = num_entries + 1 WHERE giveaway_id = '${giveawayId}'`;
            con.query(sql, err => {
                if (err) throw err;
            });

            // End the Connection
            con.end();
        });
    });
}

function getParticipants(callback) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = 'SELECT * FROM participants';
    
        connection.query(sql, (err, result) => {
			if (err) throw err;
			console.log('Barbara: Got all the passengers!');
			console.log(result);
			connection.end();
            callback(result);
        });
    });
}

function retrieveParticipants(giveawayId) {
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = `SELECT * FROM participants WHERE giveaway_id = ${giveawayId}`;

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
			return res;
        });
    });
}

function checkDuplicateParticipant(giveawayId, participantId, callback) {
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = `SELECT * FROM participants WHERE giveaway_id = ${giveawayId} AND discord_id = ${participantId}`;

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
			callback(res);
        });
    });
}

function getGiveaway(giveawayId) {
	const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = `SELECT * FROM giveaways WHERE giveaway_id = ${giveawayId}`;

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
			return res;
        });
    });
}

function checkOngoing(scheduleGiveaway) {
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = 'SELECT * FROM giveaways WHERE ongoing = 1';

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
            console.log(res);
        });
    });
}

function getEntries(giveawayId, callback) {
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = `SELECT num_entries FROM giveaways WHERE giveaway_id = ${giveawayId}`;

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
            callback(res);
        });
    });
}

module.exports = { 
    saveGiveaway, 
    insertParticipant, 
    getParticipants, 
    retrieveParticipants, 
    checkDuplicateParticipant, 
    getGiveaway, 
    checkOngoing,
    getEntries,
};