require("dotenv").config();
const express = require("express");
const connectDB = require("./db/db.js");
const cors = require("cors");
const app = express();

//connect to the mongodb database
connectDB();

app.use(express.json());

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

const { generateSecureHash } = require("./utils/hashingUtils"); //get the hashing function
const spotifyRoutes = require("./routes/spotifyRoutes");
const sessionRoutes = require("./routes/sessionsRoutes");
app.use(cors());
app.use(express.json()); //use middleware -- every request goes through them first.
//express.json() translates json to javascript objects and attaches them to the req.body parameter so my controllers can read it easily

//anything starting with /songs is to be handed over to spotifyRoutes
app.use("/songs", spotifyRoutes);
//anything starting with /sessions is to be handed over to activeSessionsRoutes
app.use("/sessions", sessionRoutes);
//generate new hash for a user
app.post("/utils/generate-hash", (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "Text is required" });
  const hash = generateSecureHash(text);
  if (!hash)
    return res
      .status(400)
      .json({ error: "Something went wrong while generating the hash" });
  return res.json({ hash: hash });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure Middleman running on http://localhost:${PORT}`);
});
