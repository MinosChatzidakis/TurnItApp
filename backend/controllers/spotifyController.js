const spotifyModel = require("../models/spotifyModel");
const { writeToCache } = require("../utils/songCachingUtils");

const searchSongs = async (req, res) => {
  const userQuery = req.query.q;

  const getArtists = (item) => {
    const numberOfArtists = item.artists.length;
    return numberOfArtists === 1
      ? item.artists[0].name
      : item.artists.reduce((acc, curr) => {
          return acc.length === 0
            ? (acc = acc + curr.name)
            : (acc = acc = acc + ", " + curr.name);
        }, "");
  };

  // Validation
  if (!userQuery) {
    return res.status(400).json({ error: "Please provide a search term" });
  }

  try {
    // Ask the Model to get the data
    const data = await spotifyModel.searchTracks(userQuery);
    if (data.length === 0) res.status(300).json(data);

    const finalSongs = data.tracks.items.map((item, index) => ({
      id: item.id,
      title: item.name,
      artists: getArtists(item),
      thumbnail: item.album.images[2]?.url || "https://via.placeholder.com/64",
    }));

    console.log(`found;\n${finalSongs.length} song`);
    console.log("Caching them...");
    writeToCache(finalSongs); //cache fetched songs
    // Send it back

    res.status(200).json(finalSongs);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
};

const getSongWithID = async (songID) => {
  if (!songID) {
    console.log("Cannot get song without a songID");
    return;
  }
  try {
    const foundSong = await spotifyModel.getSpecificTrack(songID);
    if (!foundSong) {
      console.log(`Song with id ${songID} not found in spotify`);
    }
    //convert to needed format
    //return final object -- this will be directly saved to db
  } catch (error) {
    console.log(error);
    return;
  }
};

module.exports = {
  searchSongs,
  getSongWithID,
};
