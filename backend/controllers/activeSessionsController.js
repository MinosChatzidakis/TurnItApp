const sessionsModel = require("../models/activeSessionsModel");
const { generateSessionCode } = require("../utils/activeSessionsUtils");

const getActiveSessions = async (req, res) => {
  const codesOnly = req.query.codesOnly;
  try {
    const data = await sessionsModel.getActiveSessions();
    if (data.length === 0) return res.status(200).json([]);
    let finalData;
    if (codesOnly === "false") {
      //req.params only contains strings
      finalData = data.map((session) => ({
        code: session.code,
        owner: session.owner,
        participants: session.nicknames,
      }));
    } else if (codesOnly === "true") {
      finalData = data.map((session) => session.code);
    } else {
      console.log("codesOnly is neither true nor false!!");
      throw new Error(
        "Invalid query entered (only true/false values permitted",
      );
    }
    console.log(finalData);
    res.status(200).json(finalData);
  } catch (err) {
    console.log("session controller error: ", err.message);
    res.status(500).json({
      error: "Failed to fetch active sessions",
    });
  }
};

const getSessionByCode = async (req, res) => {
  const sessionCode = req.params.sessionCode;
  try {
    const data = await sessionsModel.getSessionByCode(sessionCode);
    if (!data) return res.status(404);
    res.json(data);
  } catch (err) {
    console.log("controller error: ", err.message);
    res.status(500).json({
      error: "Failed to fetch session: ",
      sessionCode,
    });
  }
};

const joinSession = async (req, res) => {
  const { sessionCode, nickname } = req.body;
  try {
    sessionsModel.joinSession(sessionCode, nickname);
  } catch (err) {
    throw new Error(`Couldn't add ${nickname} to session ${sessionCode}`);
    console.log(err);
  }
};

const createSession = async (req, res) => {
  const { sessionName, sessionHost } = req.body; // look into the request body and not the url (req.params)
  let unique = false;
  let sessionCode;
  let existingCode;
  while (!unique) {
    try {
      sessionCode = generateSessionCode();
      existingCode = await sessionsModel.getSessionByCode(sessionCode); // check if the code already exists //!this needs refactoring, only one query should be made to the database
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("Item not found! Triggering the fallback action...");
      }
    }
    if (!existingCode) unique = true;
    try {
      await sessionsModel.createSession(sessionName, sessionHost, sessionCode); // register new session
      res.status(200).json({ code: sessionCode });
    } catch (error) {
      console.error(`Failed to create session: ${sessionName}`, error);

      res
        .status(500)
        .json({ error: "Internal server error while creating session" });
    }
  }
};

const updateSession = async (req, res) => {
  const sessionCode = req.params.sessionCode;
  const { newSessionName, newHostName } = req.body;

  // Protect against undefined before calling .trim()
  if (!newSessionName || !newHostName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const pureName = newSessionName.trim();
  const pureHost = newHostName.trim();

  if (pureName === "" || pureHost === "") {
    return res.status(400).json({ error: "Fields cannot be empty strings" });
  }

  try {
    const data = await sessionsModel.updateSession(
      sessionCode,
      pureName,
      pureHost,
    );

    return res.status(200).json({ message: "Session updated successfully!" });
  } catch (e) {
    console.log("error in updating session:", sessionCode, ". Error:", e);

    // Default to 500 if e.status doesn't exist
    return res.status(e.status || 500).json({
      error: e.message || "Failed to update session",
      sessionCode,
    });
  }
};

module.exports = {
  getActiveSessions,
  getSessionByCode,
  joinSession,
  createSession,
  updateSession,
};
