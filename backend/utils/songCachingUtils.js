const songsCache = new Map();
const writeToCache = (spotifyResults = []) => {
  if (!Array.isArray(spotifyResults)) return;

  spotifyResults.forEach((song) => {
    if (!song || !song.id) return;

    const existingEntry = songsCache.get(song.id);

    // 2. If it is, CLEAR the old deletion timer so they don't pile up!
    if (existingEntry && existingEntry.timeoutId) {
      clearTimeout(existingEntry.timeoutId);
    }

    // 3. Create a NEW 15-minute timer
    const newTimeoutId = setTimeout(
      () => {
        songsCache.delete(song.id);
        console.log(`Removed ${song.id} from cache at ${Date.now()}`);
      },
      15 * 60 * 1000,
    );

    // 4. Save BOTH the song data and the new timer ID into the Map
    songsCache.set(song.id, {
      data: song,
      timeoutId: newTimeoutId,
    });

    console.log(`Cached ${song.id}`);
  });
  const firstEntry = [...songsCache][0];
  console.log("Song in cache: ", firstEntry);
};

const readFromCache = (songId) => {
  // Grab the full object from our temporary cache
  const fullSongObject = songsCache.get(songId);
  const songData = fullSongObject?.data; //disregard the timer

  if (!songData) {
    console.log(`Song ${songId} not found in cache`);
    return;
  }

  return songData;
};

module.exports = {
  writeToCache,
  readFromCache,
};
