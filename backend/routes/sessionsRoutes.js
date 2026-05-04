const express = require("express");
const router = express.Router();
const activeSessionsController = require("../controllers/activeSessionsController");

router.get("/active", activeSessionsController.getActiveSessions);

module.exports = router;
