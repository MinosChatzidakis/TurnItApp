const sessionsModel = require("../models/activeSessionsModel");
const {
  generateSessionCode,
  generateSecureHash,
} = require("../utils/hashingUtils");
const { readFromCache } = require("../utils/songCachingUtils");
const { getSongWithID } = require("../controllers/spotifyController");

const getActiveSessions = async (req, res) => {
  const codesOnly = req.query.codesOnly;
  try {
    const data = await sessionsModel.getActiveSessions();
    if (data.length === 0) {
      console.log("active sessions not found");
      return res.status(200).json([]); //no sessions found
    }
    let finalData;
    if (codesOnly === "false") {
      //req.params only contains strings
      finalData = data.map((session) => ({
        code: session.code,
        owner: session.owner,
        participants: session.nicknames,
      }));
    } else if (codesOnly === "true") {
      finalData = data.map((session) => session.code); //return only the codes of the active sessions
    } else {
      console.log("codesOnly is neither true nor false!!"); //wtf
      throw new Error(
        "Invalid query entered (only true/false values permitted",
      );
    }
    console.log(`Found ${finalData.length} active sessions!`);
    res.status(200).json(finalData);
  } catch (err) {
    console.log("session controller error: ", err.message);
    res.status(500).json({
      error: "Failed to fetch active sessions",
    });
  }
};

const getSessionByCode = async (req, res) => {
  const sessionCode = req.params.sessionCode; //grab session code t use
  try {
    const data = await sessionsModel.getSessionByCode(sessionCode); //fetch the correct session from the database
    if (!data)
      return res
        .status(404) //session not found
        .json({ message: `Session with code ${sessionCode} not found` });
    console.log(`Session with code ${sessionCode} found`);
    res.json(data); //return the session
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
  let cleanName = nickname?.trim();
  const cleanCode = sessionCode?.trim();
  if (!cleanCode)
    return res.status(400).json({ message: "Session code cannot be empty" });
  if (!cleanName)
    return res.status(400).json({ message: "Nickname cannot be empty" });

  try {
    //if a user has joined any previous sessions we cant do shit about that

    //get active session
    const selectedSession = await sessionsModel.getSessionByCode(cleanCode); //get the session with code
    if (!selectedSession)
      //nothing found
      return res
        .status(404)
        .json({ message: `Session with code ${cleanCode} not found` });
    //check if the name already exists in said session
    const nicknameExistsInSession = selectedSession?.participants?.some(
      (element) => element.nickname === cleanName,
    );
    if (nicknameExistsInSession) {
      //nickname exists :::: append a number and join with it
      cleanName =
        cleanName + "_" + (Math.floor(Math.random() * 90) + 10).toString();
      console.log(
        `${nickname} already exists in session. Joining as ${cleanName} instead.`,
      );
    }
    //generate hash
    const userHash = generateSecureHash(cleanName);
    if (!userHash)
      throw new Error({
        message: `Failed to generate secure hash for user with nickname: ${cleanName}`,
      });

    sessionsModel.joinSession(cleanCode, cleanName, userHash); //join session

    console.log(`Successfully joined session ${cleanCode} as ${cleanName}`);

    return res.status(200).json({ hash: userHash, nickname: cleanName });
  } catch (err) {
    console.log(err);
    throw new Error(`Couldn't add ${nickname} to session ${cleanCode}`);
  }
  //todo check if the code and the name are ok
  //todo check if the session exists
  //todo check username availability
  //todo generate hash
  //todo return hash if successful join or an error object if unsuccessful
};

const createSession = async (req, res) => {
  const { sessionName, sessionHost } = req.body;

  if (!sessionName || !sessionHost) {
    return res.status(400).json({
      error: "Missing information. Provide a name and a nickname.", //stuff missing
    });
  }

  try {
    let unique = false;
    let sessionCode;

    //generate and verify the code in the loop -- only
    while (!unique) {
      sessionCode = generateSessionCode();
      const existingCode = await sessionsModel.getSessionByCode(sessionCode);

      if (!existingCode) {
        unique = true; // Breaks the loop safely!
      }
    }

    // guaranteed unique code, create it
    const hostHash = generateSecureHash();

    await sessionsModel.createSession(
      sessionName,
      sessionHost,
      hostHash,
      sessionCode,
    );

    console.log(`Successfully created session with code: ${sessionCode}`);

    return res.status(200).json({ code: sessionCode, hostHash: hostHash });
  } catch (error) {
    console.error(`Failed to create session: ${sessionName}`, error);
    return res
      .status(500)
      .json({ error: "Internal server error while creating session" });
  }
};

const updateSession = async (req, res) => {
  const sessionCode = req.params.sessionCode;
  const { newSessionName, newHostName, hostToken } = req.body;

  // Protect against undefined before calling .trim()
  if (!newSessionName || !newHostName || !hostToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const pureName = newSessionName?.trim();
  const pureHost = newHostName?.trim();
  const pureToken = hostToken?.trim();

  if (pureName === "" || pureHost === "" || pureToken === "") {
    return res.status(400).json({ error: "Fields cannot be empty strings" });
  }

  try {
    const foundSession = await sessionsModel.getSessionByCode(sessionCode);
    if (!foundSession) {
      console.log(`no session found with code: ${sessionCode}`);
      return res
        .status(404)
        .json({ message: `Session with code ${sessionCode} not found` });
    }
    const actualHash = foundSession?.host?.hash;
    if (actualHash !== hostToken) {
      //check if the token provided matches the expected one
      console.log(
        `Invalid host credentials.\nExpected: ${actualHash} but got: ${hostToken}`,
      );
      return res
        .status(401)
        .json({ errorMessage: "You are not authorised to end this session." });
    }

    //update session now that we know that the hash matches
    console.log("Host indentified!");
    const data = await sessionsModel.updateSession(
      sessionCode,
      pureName,
      pureHost,
    );
    console.log(
      `Session ${sessionCode} updated successfully. New name: ${pureName} and new host: ${
        pureHost
      }`,
    );
    return res
      .status(200)
      .json({ message: "Session updated successfully!", session: data });
  } catch (e) {
    console.log("error in updating session:", sessionCode, ". Error:", e);

    // Default to 500 if e.status doesn't exist
    return res.status(e.status || 500).json({
      error: e.message || "Failed to update session",
      sessionCode,
    });
  }
};

const endSession = async (req, res) => {
  const { code, hash } = req.body;
  try {
    //check if a session with this characteristics exists
    const foundSession = await sessionsModel.getSessionByCode(code);
    if (!foundSession)
      return res
        .status(404)
        .json({ message: `Session with code ${code} not found` });
    const actualHash = foundSession?.host?.hash;
    if (actualHash !== hash) {
      console.log(
        `Invalid host credentials.\nExpected: ${actualHash} but got: ${hash}`,
      );
      return res
        .status(401)
        .json({ errorMessage: "You are not authorised to end this session." });
    }
    // request is valid (hash matches) => remove session
    console.log("Host identified!");
    await sessionsModel.endSession(code);
    return res.status(200).json({ message: "Session successfully ended." });
  } catch (e) {
    console.log("Failed to end session", e);
  }
};

const addSuggestion = async (req, res) => {
  const sessionCode = req.params.sessionCode;
  const { hash: participantToken, songId } = req.body;
  if (!sessionCode || !participantToken || !songId) {
    console.log("Can't suggest song (info is missing)");
    return res.status(400).json({ error: "Bad Request - Missing info" }); //bad request if missing info
  }
  sessionCode = sessionCode.trim();
  participantToken = participantToken.trim();
  //check that the session is active
  try {
    const sess = await sessionsModel.getSessionByCode(sessionCode); //get session in which we are trying to add a suggestion
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "" });
  }
  //check that the user is indeed in the session
  const isInSession = sess?.participants?.some(
    (element) => element.hash === participantToken,
  );
  if (!isInSession) {
    return res
      .status(401) //authentication failed
      .json({
        error:
          "Authentication failed: Token provided could not be found in this session.",
      });
  }
  //check that the song has not been already suggested
  const songAlreadySuggested = sess?.suggestions.some(
    (song) => song.songId === songId,
  );
  if (songAlreadySuggested) {
    return res
      .status(409) //conflict
      .json({
        error:
          "This song has already been suggested! You can vote for it instead",
      });
  }

  //get song object from cache based on id sent back
  let songToSuggest;
  let fetchedSong;
  const cachedSong = readFromCache(songId);
  if (!cachedSong) {
    //fetch from spotify
    fetchedSong = getSongWithID(songId);
  } else {
    //song was cached
    cachedSong = cachedSong?.data;
  }

  const songToSuggest = cachedSong || fetchedSong; //prefer the cached one

  //add suggestion to db
  const suggestedSongs = await sessionsModel.addSuggestion(
    sessionCode,
    songToSuggest,
  );

  //
};

module.exports = {
  getActiveSessions,
  getSessionByCode,
  joinSession,
  createSession,
  updateSession,
  endSession,
  addSuggestion,
};
