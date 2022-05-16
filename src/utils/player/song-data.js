export const getSongData = (song, platform) => {
	let data;
	if (platform === 'yt') {
		data = {
			song: song.title,
			url: song.url,
			platform,
		};
	}
	else if (platform === 'sp') {
		data = {
			song: `${song.artists[0].name} - ${song.name}`,
			url: song.url,
			platform,
		};
	}
	else if (platform === 'so') {
		data = {
			song: `${song.user.name} - ${song.name}`,
			url: song.url,
			platform,
		};
	}
	return data;
}