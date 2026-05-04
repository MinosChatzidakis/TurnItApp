const express = require("express");
const router = express.Router();
const spotifyController = require("../controllers/spotifyController");

// When someone hits GET /search, run the searchSongs controller function
router.get("/search", spotifyController.searchSongs);

module.exports = router;
