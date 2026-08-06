require("dotenv").config();
const express = require("express");
const connectDB = require("./db/db.js");
const cors = require("cors");
const app = express();
const { generateSecureHash } = require("./utils/hashingUtils"); //get the hashing function
const spotifyRoutes = require("./routes/spotifyRoutes");
const sessionRoutes = require("./routes/sessionsRoutes");

//connect to the mongodb database
connectDB();

app.use(express.json());

// The cloud provider will inject a PORT, but we fallback to 3000 for local testing
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(cors());
app.use(express.json()); //use middleware -- every request goes through them first.
//express.json() translates json to javascript objects and attaches them to the req.body parameter so my controllers can read it easily

//anything starting with /songs is to be handed over to spotifyRoutes
app.use("/songs", spotifyRoutes);
//anything starting with /sessions is to be handed over to activeSessionsRoutes
app.use("/sessions", sessionRoutes);
//server health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
