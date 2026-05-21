const express = require("express");
const router = express.Router();
const activeSessionsController = require("../controllers/activeSessionsController");

// they all start with "/sessions"
router.get("/active", activeSessionsController.getActiveSessions);
router.get("code", activeSessionsController.getSessionByCode);
router.post("join", activeSessionsController.joinSession);
router.post("create", activeSessionsController.createSession);

module.exports = router;
