import { createPool } from 'mysql';
import 'dotenv/config';

const pool = createPool({
	connectionLimit: process.env.LIMIT,
	host: process.env.HOST,
	user: process.env.USERNAME,
	password: process.env.PW,
	database: process.env.DB
});

// CREATING A GIVEAWAY AND SAVING IT TO DATABASE
export const saveGiveaway = (details, callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `INSERT INTO giveaways (giveaway_id, title, num_winners, num_entries, start_date, end_date, multiplier, ffa, channel_id) VALUES ('${details.giveaway_id}', '${details.title}', ${details.num_winners}, ${details.num_entries}, '${details.start_date}', '${details.end_date}', ${details.multiplier}, ${details.ffa}, '${details.channel_id}')`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			console.log('Barbara: I\'ve created a new giveaway!');
			connection.release();
            callback()
        });
    });
}

// ENTERING A PARTICIPANT
export const insertParticipant = (giveawayId, discordId) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        // Check if the Giveaway exists
        let sql = `SELECT COUNT(1) as 'value' FROM giveaways WHERE giveaway_id = '${giveawayId}'`;
        connection.query(sql, (err, res) => {
            if (err) throw err;
            if (res[0].value == 0) {
                console.log('Barbara: Unfortunately, there\'s no such giveaway.');
                connection.release();
                return;
            }

            // Insert a Record to the Table
            sql = `INSERT INTO giveaway_entries (giveaway_id, discord_id) VALUES ('${giveawayId}', '${discordId}')`;
            connection.query(sql, err => {
                if (err) throw err;
                console.log('Barbara: one (1) passenger is entered into the pool!');
            });

            // End the Connection
            connection.release();
        });
    });
}

export const updateEntries = (giveawayId) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
        // Increment Entries
        const sql = `UPDATE giveaways SET num_entries = num_entries + 1 WHERE giveaway_id = '${giveawayId}'`;
        
        connection.query(sql, (err) => {
            if (err) throw err;
            // End the Connection
            connection.release();
        });
    });
}

export const getParticipants = (giveawayId, callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `SELECT * FROM giveaway_entries WHERE giveaway_id = "${giveawayId}"`;
    
        connection.query(sql, (err, result) => {
			if (err) throw err;
			console.log('Barbara: Got all the passengers!');
			connection.release();
            callback(result);
        });
    });
}

export const checkDuplicateParticipant = (giveawayId, participantId, callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        const sql = `SELECT * FROM giveaway_entries WHERE giveaway_id = ${giveawayId} AND discord_id = ${participantId}`;

        connection.query(sql, (err, res) => {
            if (err) throw err;
            connection.release();
			callback(res);
        });
    });
}

export const getGiveaways = (callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        const sql = 'SELECT * FROM giveaways';

        connection.query(sql, (err, res) => {
            if (err) throw err;
            connection.release();
			callback(res);
        });
    });
}

export const getEntries = (giveawayId, callback) => {
    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        const sql = `SELECT num_entries FROM giveaways WHERE giveaway_id = ${giveawayId}`;

        connection.query(sql, (err, res) => {
            if (err) throw err;
            connection.release();
            callback(res);
        });
    });
}

export const insertGiveawayWinner = (giveawayId, user) => {

    pool.getConnection((err, connection) => {
        if (err) throw err;
    
        const sql = `INSERT INTO giveaway_winners (giveaway_id, discord_id) VALUES ('${giveawayId}', '${user.discord_id}');`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.release();
        });
    });
}