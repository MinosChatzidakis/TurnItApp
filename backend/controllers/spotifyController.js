const spotifyModel = require("../models/spotifyModel");

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

    console.log(finalSongs);

    // Send it back
    res.status(200).json(finalSongs);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ error: "Failed to fetch songs" });
  }
};

module.exports = {
  searchSongs,
};
