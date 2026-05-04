require("dotenv").config();
const express = require("express");
const cors = require("cors");

const spotifyRoutes = require("./routes/spotifyRoutes");
const sessionRoutes = require("./routes/sessionsRoutes");
const app = express(); //set the server running
app.use(cors());
app.use(express.json()); //use middleware -- every request goes through them first.
//express.json() translates json to javascript objects and attaches them to the req.body parameter so my controllers can read it easily

//anything starting with /songs is to be handed over to spotifyRoutes
app.use("/songs", spotifyRoutes);
//anything starting with /sessions is to be handed over to activeSessionsRoutes
app.use("/sessions", sessionRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure Middleman running on http://localhost:${PORT}`);
});
