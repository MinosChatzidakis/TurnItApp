const sessionsModel = require("../models/activeSessionsModel");

const getActiveSessions = async (req, res) => {
  const codesOnly = req.query.codesOnly;
  try {
    const data = await sessionsModel.getActiveSessions();
    if (data.length === 0) return res.status(200).json([]);
    let finalData;
    if (codesOnly === "false") {
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
  const sessionCode = req.query.sessionCode;
  try {
    const data = await sessionsModel.getSessionByCode(sessionCode);
    if (!data) return res.status(500);
    return data;
  } catch (err) {
    console.log("controller error: ", err.message);
    res.status(500).json({
      error: "Failed to fetch session: ",
      sess,
    });
  }
};

const joinSession = async (req, res) => {
  const { sessionCode, nickname } = req.params;
  try {
    sessionsModel.joinSession(sessionCode, nickname);
  } catch (err) {
    throw new Error(`Couldn't add ${nickname} to session ${sessionCode}`);
    console.log(err);
  }
};

const createSession = async (req, res) => {
  const { sessionName, sessionHost } = req.params();

  let unique = false;
  while (!unique) {
    const sessionCode = generateSessionCode();
    const existingCode = await sessionsModel.getSessionByCode(sessionCode); // check if the code already exists
    if (!existingCode) unique = true;
  }
  try {
    sessionsModel.createSession(sessionName, sessionHost, sessionCode); // register new session
  } catch (e) {
    throw new Error(
      `Failed to create session: ${sessionName}. Code: ${sessionCode}`,
    );
    console.log(err);
  }
};

module.exports = {
  getActiveSessions,
  getSessionByCode,
  joinSession,
};
