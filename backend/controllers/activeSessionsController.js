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
  } catch (e) {
    console.log("session controller error: ", e.message);
    res.status(500).json({
      error: "Failed to fetch active sessions",
    });
  }
};

module.exports = {
  getActiveSessions,
};
