const express = require("express");
const router = express.Router();
const activeSessionsController = require("../controllers/activeSessionsController");

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

module.exports = router;
