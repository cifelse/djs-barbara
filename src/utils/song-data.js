module.exports = {
	getSongData: (song, platform) => {
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
				song: `${song.name} - ${song.artists[0].name}`,
				url: song.url,
				platform,
			};
		}
		else if (platform === 'so') {
			data = {
				song: `${song.name} - ${song.user.name}`,
				url: song.url,
				platform,
			};
		}
		return data;
	},
};