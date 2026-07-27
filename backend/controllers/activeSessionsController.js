const sessionsModel = require("../models/activeSessionsModel");
const Session = require("../Session");
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
        participants: session.nicknames, //!this needs fixing -- returns bullshit
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
  let { sessionCode, token } = req.params; //grab session code t use

  if (!sessionCode || !token) {
    console.log("Missing info, cannot get session");
    return res
      .status(400)
      .json({ error: "You did not provide everything that was needed" });
  }

  sessionCode = sessionCode.toUpperCase();
  try {
    const data = await sessionsModel.getSessionByCode(sessionCode); //fetch the correct session from the database
    if (!data)
      return res
        .status(404) //session not found
        .json({ message: `Session with code ${sessionCode} not found` });
    console.log(
      `Session with code ${sessionCode} found. Constructing object to be returned to the frontend`,
    );
    const isHost = data.host?.hash === token; //true => also return the nicknames in the session
    const { code, name, suggestions, participants, host } = data; //get only what we will need
    const nicknamesOfParticipants = participants.map((item) => item.nickname);
    //nicknamesOfParticipants.push(host.nickname); also include host -- unecessary it looks like
    const hostNickname = host?.nickname;
    let ltdSession = {
      //return a limited version of the session object
      code,
      name,
      suggestions: await sessionsModel.getSuggestionsWithNicknames(
        sessionCode,
        token,
      ),
    };
    if (isHost) {
      ltdSession = {
        ...ltdSession,
        participants: nicknamesOfParticipants,
        host: hostNickname,
      };
    }
    res.status(200).json(ltdSession); //return the session
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
  const cleanCode = sessionCode?.trim().toUpperCase();
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
    const nicknameExistsInSession =
      selectedSession?.participants?.some(
        (element) => element.nickname === cleanName,
      ) || selectedSession?.host.nickname === cleanName;
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
  let sessionCode = req.params.sessionCode?.toUpperCase();
  let { hash: participantToken, songSuggestion: songId } = req.body;
  if (!sessionCode || !participantToken || !songId) {
    console.log("Can't suggest song (info is missing)");
    return res.status(400).json({ error: "Bad Request - Missing info" }); //bad request if missing info
  }
  sessionCode = sessionCode.trim();
  participantToken = participantToken.trim();
  //check that the session is active
  let sess; //session to which song will be suggested
  try {
    sess = await sessionsModel.getSessionByCode(sessionCode); //get session in which we are trying to add a suggestion
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ error: "Session is inactive, cannot suggest song" });
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
  let cachedSong = readFromCache(songId);
  if (!cachedSong) {
    //fetch from spotify if somehow not cached
    console.log("Not cached, fetching from spotify instead!");
    fetchedSong = await getSongWithID(songId);
  }

  songToSuggest = cachedSong || fetchedSong; //prefer the cached one

  const finalSuggestionObject = {
    songId: songToSuggest.id,
    songTitle: songToSuggest.title,
    artists: songToSuggest.artists,
    thumbnail: songToSuggest.thumbnail,
    suggestedByHash: participantToken,
  };

  //add suggestion to db
  try {
    const newSession = await sessionsModel.addSuggestionToSession(
      sessionCode,
      finalSuggestionObject,
    );
    const suggestedSongs = newSession?.suggestions;
    console.log(
      `Successfully suggested song: ${songId} to session: ${sessionCode} by ${participantToken}`,
    );
    return res.status(200).json({ suggestionsList: suggestedSongs }); //return the whole suggestion list
  } catch (e) {
    console.log("Error in suggesting songs: ", e);
    return res
      .status(500)
      .json({ error: "Server refused to add song to suggestions." });
  }

  //
};

const getSuggestions = async (req, res) => {
  const sessionCode = req.params.sessionCode;

  const userToken = req.query.hash;

  if (!sessionCode || !userToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const cleanCode = sessionCode.trim().toUpperCase();
  const cleanToken = userToken.trim();

  try {
    const suggestions = await sessionsModel.getSuggestionsWithNicknames(
      cleanCode,
      cleanToken,
    );

    // 5. Always send a .json() payload, even with error statuses
    if (!suggestions) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.status(200).json({ currentSuggestions: suggestions });
  } catch (error) {
    console.log(error);

    // Handle the specific Unauthorized error from our model
    if (error.message.includes("Unauthorized")) {
      return res.status(401).json({ error: error.message });
    }

    return res
      .status(500)
      .json({ error: "Server failed to fetch suggestions" });
  }
};

const removeParticipant = async (req, res) => {
  try {
    const { sessionCode: code, nickname } = req.params;
    console.log(code, nickname);

    // 1. Extract the token from the "Authorization: Bearer <token>" header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }
    const requesterHash = authHeader.split(" ")[1];

    // 2. Fetch the session (using .lean() for speed since we just need to read it)
    const session = await Session.findOne({
      code: code,
      isActive: true,
    }).lean();

    if (!session) {
      console.log(`Couldn't find session with code: ${code}`);
      return res.status(404).json({ error: "Active session not found" });
    }

    // 3. Prevent the host from being removed via this endpoint
    if (session.host.nickname === nickname) {
      return res.status(400).json({
        error: "Cannot remove the host",
      });
    }

    // 4. Find the target participant to get their hash
    const targetParticipant = session.participants.find(
      (p) => p.nickname === nickname,
    );

    if (!targetParticipant) {
      return res
        .status(404)
        .json({ error: "Participant not found in this session" });
    }

    // 5. AUTHORIZATION CHECK
    const isHost = session.host.hash === requesterHash;
    const isSelf = targetParticipant.hash === requesterHash;

    if (!isHost && !isSelf) {
      return res.status(403).json({
        error:
          "Unauthorized: You must be the host or the specific user to do this.",
      });
    }

    // 6. Safe Removal using MongoDB $pull operator
    // We use findOneAndUpdate with $pull to prevent race conditions
    // if two people leave at the exact same millisecond.
    const updatedSession = await Session.findOneAndUpdate(
      { code: code },
      { $pull: { participants: { nickname: nickname } } },
      { returnDocument: true, returnDocument: "after" },
    ).lean();

    // 7. Strip sensitive data (DTO pattern) before sending the response
    const { host, participants, _id, __v, ...safeSessionData } = updatedSession;

    // Optional: You can map the remaining participants to hide their hashes too
    const safeParticipants = updatedSession.participants.map((p) => ({
      nickname: p.nickname,
    }));

    return res.status(200).json({
      message: `Successfully removed ${nickname}`,
      session: {
        ...safeSessionData, //only return data that can be shown + the nicknames of the remainding participants
        participants: safeParticipants,
      },
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = {
  getActiveSessions,
  getSessionByCode,
  joinSession,
  createSession,
  updateSession,
  endSession,
  addSuggestion,
  getSuggestions,
  removeParticipant,
};
