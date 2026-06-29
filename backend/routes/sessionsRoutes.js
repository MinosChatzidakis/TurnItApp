const express = require("express");
const router = express.Router();
const activeSessionsController = require("../controllers/activeSessionsController");

// they all start with "/sessions"
router.get("/active", activeSessionsController.getActiveSessions);
router.get("/code/:sessionCode", activeSessionsController.getSessionByCode);
router.post("/join", activeSessionsController.joinSession);
router.post("/create", activeSessionsController.createSession);
router.post("/update/:sessionCode", activeSessionsController.updateSession);

module.exports = router;
