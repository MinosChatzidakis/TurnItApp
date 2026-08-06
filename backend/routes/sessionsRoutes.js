const express = require("express");
const router = express.Router();
const activeSessionsController = require("../controllers/activeSessionsController");
const Email = require("../models/email"); // Adjust path if needed

//* they all inherently start with "/sessions"
router.get("/active", activeSessionsController.getActiveSessions);
router.get(
  "/code/:sessionCode/:token",
  activeSessionsController.getSessionByCode,
);
router.post("/join", activeSessionsController.joinSession);
router.post("/create", activeSessionsController.createSession);
router.post("/update/:sessionCode", activeSessionsController.updateSession);
router.post("/suggest/:sessionCode", activeSessionsController.addSuggestion);
router.delete("/:sessionCode", activeSessionsController.endSession);
router.get(
  "/suggestions/:sessionCode",
  activeSessionsController.getSuggestions,
);
router.delete(
  "/:sessionCode/participants/:nickname",
  activeSessionsController.removeParticipant,
);
router.post(
  "/:sessionCode/played-suggestions",
  activeSessionsController.toggleSongAsPlayed,
);
router.delete(
  "/:sessionCode/songs/:songId",
  activeSessionsController.removeSong,
);

router.post(
  "/:sessionCode/songs/:songId/vote",
  activeSessionsController.voteForSong,
);

// POST route to save an email
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const newEmail = new Email({ email });
    await newEmail.save();

    res.status(201).json({ message: "Email saved successfully!" });
  } catch (error) {
    // 11000 is MongoDB's error code for a duplicate unique value
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email is already registered!" });
    }
    console.error(error);
    res.status(500).json({ error: "Server error saving email." });
  }
});

module.exports = router;
