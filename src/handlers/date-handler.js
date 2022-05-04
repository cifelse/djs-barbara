function convertDateToTimestamp(date) {
	return date.getUTCFullYear() + '-' +
			('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
			('00' + date.getUTCDate()).slice(-2) + ' ' + 
			('00' + date.getUTCHours()).slice(-2) + ':' + 
			('00' + date.getUTCMinutes()).slice(-2) + ':' + 
			('00' + date.getUTCSeconds()).slice(-2);
}

function convertTimestampToDate(timestamp) {
	const newDateArray = timestamp.split(/[- :]/);
	return new Date(Date.UTC(newDateArray[0], newDateArray[1]-1, newDateArray[2], newDateArray[3], newDateArray[4], newDateArray[5]));
}

module.exports = { convertDateToTimestamp, convertTimestampToDate };