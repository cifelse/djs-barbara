export const burnMiles = (type, quantity) => {
	const connection = mysql.createConnection({
		host: 'eu02-sql.pebblehost.com',
		user: 'customer_253110_giveaways',
		password: 'LwtF8qJ6lEiEC3H!@KFm',
		database: 'customer_253110_giveaways',
	});

    connection.connect(err => {
        if (err) throw err;
    
        const sql = `UPDATE miles_burned SET ${type} = ${type} + ${quantity} WHERE id = (SELECT MAX(id) FROM miles_burned)`;
    
        connection.query(sql, (err) => {
			if (err) throw err;
			connection.end();
        });
    });
}