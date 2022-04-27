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
    
        const sql = `INSERT INTO giveaways (giveaway_id, title, num_winners, num_entries, start_date, end_date, multiplier, ffa, channel_id) VALUES ('${details.giveaway_id}', '${details.title}', '${details.num_winners}', '${details.num_entries}', '${details.start_date}', '${details.end_date}', '${details.multiplier}', '${details.ffa}', '${details.channel_id}')`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new giveaway!');
			connection.end();
        });
    });
}

// ENTERING A PARTICIPANT
function insertParticipant(participant) {
    const { giveawayId, discordId } = participant;

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
            sql = `INSERT INTO giveaway_entries (giveaway_id, discord_id) VALUES ('${giveawayId}', '${discordId}')`;
            con.query(sql, err => {
                if (err) throw err;
                console.log('Barbara: one (1) passenger is entered into the pool!');
            });

            // End the Connection
            con.end();
        });
    });
}

function updateEntries(giveawayId) {
    const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        // Increment Entries
        const sql = `UPDATE giveaways SET num_entries = num_entries + 1 WHERE giveaway_id = '${giveawayId}'`;
        
        con.query(sql, (err) => {
            if (err) throw err;
            // End the Connection
            con.end();
        });
    });
}

function getParticipants(giveawayId, callback) {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `SELECT * FROM giveaway_entries WHERE giveaway_id = "${giveawayId}"`;
    
        connection.query(sql, (err, result) => {
			if (err) throw err;
			console.log('Barbara: Got all the passengers!');
			connection.end();
            callback(result);
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
        
        const sql = `SELECT * FROM giveaway_entries WHERE giveaway_id = ${giveawayId} AND discord_id = ${participantId}`;

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
			callback(res);
        });
    });
}

function getGiveaways(callback) {
	const con = mysql.createConnection({
        host: 'eu02-sql.pebblehost.com',
        user: 'customer_253110_giveaways',
        password: 'LwtF8qJ6lEiEC3H!@KFm',
        database: 'customer_253110_giveaways',
    });

    con.connect(err => {
        if (err) throw err;
        
        const sql = 'SELECT * FROM giveaways';

        con.query(sql, (err, res) => {
            if (err) throw err;
            con.end();
			callback(res);
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
    updateEntries,
    getParticipants,
    checkDuplicateParticipant, 
    getGiveaways, 
    getEntries,
};