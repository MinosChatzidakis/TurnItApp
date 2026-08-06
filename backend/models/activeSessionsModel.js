const Session = require("../Session");

const getActiveSessions = async () => {
  const sessions = await Session.find({ isActive: true });
};

const getSessionByCode = async (code) => {
  // If not found, it returns null. The controller will handle the null.
  return await Session.findOne({ code: code, isActive: true });
};

const joinSession = async (code, nickname, hash) => {
  const updatedSession = await Session.findOneAndUpdate(
    { code: code, isActive: true },
    { $addToSet: { participants: { nickname, hash } } },
    { returnDocument: true },
  );

  if (!updatedSession) {
    const error = new Error(`Cannot join: Session ${code} not found.`);
    error.status = 404;
    throw error;
  }

  return updatedSession;
};

const createSession = async (name, host, hostHash, code) => {
  // If Mongoose validation fails (e.g., missing code), it automatically throws here
  return await Session.create({
    code: code,
    name: name,
    host: {
      nickname: host,
      hash: hostHash,
    },
  });
};

const updateSession = async (code, newSessionName, newHostName) => {
  const updatedSession = await Session.findOneAndUpdate(
    { code: code },
    {
      name: newSessionName,
      "host.nickname": newHostName,
    },
    { returnDocument: true },
  );

  if (!updatedSession) {
    const error = new Error(`No session found with code ${code}`);
    error.status = 404;
    throw error;
  }

  return updatedSession;
};

const endSession = async (code) => {
  //return await Session.deleteOne({ code: code });
  const updatedSession = await Session.findOneAndUpdate(
    { code: code },
    { $set: { isActive: false } },
    { returnDocument: true },
  );
  if (!updatedSession) {
    const error = new Error(`Cannot end: Session ${code} not found.`);
    error.status = 404;
    throw error;
  }

  return updatedSession;
};

const addSuggestionToSession = async (sessionCode, newSongData) => {
  const updatedSession = await Session.findOneAndUpdate(
    { code: sessionCode },
    { $push: { suggestions: newSongData } },
    { returnDocument: true },
  );

  if (!updatedSession) {
    throw new Error("Session not found");
  }
  return updatedSession;
};

const getSuggestionsWithNicknames = async (sessionCode, userHash) => {
  const session = await Session.findOne({ code: sessionCode }).lean();

  if (!session) {
    throw new Error("Session not found");
  }

  // 1. Check if the hash matches the host
  const isHost = session.host.hash === userHash;

  // 2. Check if the hash belongs to any participant
  const isParticipant = session.participants.some(
    (participant) => participant.hash === userHash,
  );

  // 3. If they are neither, kick them out!
  if (!isHost && !isParticipant) {
    throw new Error("Unauthorized: User does not belong to this session");
  }

  const nicknameMap = new Map();
  nicknameMap.set(session.host.hash, session.host.nickname);

  session.participants.forEach((participant) => {
    nicknameMap.set(participant.hash, participant.nickname);
  });

  const formattedSuggestions = session.suggestions.map((song) => {
    return {
      songId: song.songId,
      songTitle: song.songTitle,
      artists: song.artists,
      thumbnail: song.thumbnail,
      score: song.score,
      suggestedAt: song.suggestedAt,
      suggestedByNickname:
        nicknameMap.get(song.suggestedByHash) || "Unknown User",
      isPlayed: song.isPlayed,

      // 👇 NEW CODE: Check the arrays and return a safe boolean instead
      hasLiked: Boolean(song.likedBy?.includes(userHash)),
      hasDisliked: Boolean(song.dislikedBy?.includes(userHash)),
    };
  });

  return formattedSuggestions;
};

const toggleSuggestionPlayedStatus = async (
  sessionCode,
  songId,
  requesterHash,
) => {
  // 1. Fetch the session
  const session = await Session.findOne({ code: sessionCode, isActive: true });
  if (!session) {
    const error = new Error("Active session not found");
    error.status = 404;
    throw error;
  }

  // 2. Authorization Check
  if (session.host.hash !== requesterHash) {
    const error = new Error(
      "Unauthorized: Only the host can mark songs as played",
    );
    error.status = 403;
    throw error;
  }

  // 3. Find the song
  const songIndex = session.suggestions.findIndex((s) => s.songId === songId);
  if (songIndex === -1) {
    const error = new Error("Song not found in this session");
    error.status = 404;
    throw error;
  }

  // 4. Toggle and save
  const currentStatus = session.suggestions[songIndex].isPlayed || false;
  session.suggestions[songIndex].isPlayed = !currentStatus;
  await session.save();

  // 5. Return the newly formatted array
  return await getSuggestionsWithNicknames(sessionCode, requesterHash);
};

const removeAndOptionallyBanSong = async (
  sessionCode,
  songId,
  requesterHash,
  banSong,
) => {
  // 1. Fetch the active session
  const session = await Session.findOne({ code: sessionCode, isActive: true });

  if (!session) {
    const error = new Error("Active session not found");
    error.status = 404;
    throw error;
  }

  // 2. Authorization: Only the host can remove/ban songs
  if (session.host.hash !== requesterHash) {
    const error = new Error("Unauthorized: Only the host can remove songs");
    error.status = 403;
    throw error;
  }

  // 3. Remove the song from the suggestions array
  // The $pull operator automatically finds and removes any item matching the condition
  const updateQuery = {
    $pull: { suggestions: { songId: songId } },
  };

  // 4. If the host chose to ban it, add it to the banned list
  if (banSong) {
    updateQuery.$addToSet = { bannedSongs: songId };
    // $addToSet ensures we don't add duplicates if they ban it twice
  }

  // 5. Execute the update directly
  await Session.updateOne({ code: sessionCode, isActive: true }, updateQuery);

  // 6. Return the freshly mapped suggestions back to the controller
  return await getSuggestionsWithNicknames(sessionCode, requesterHash);
};

const updateSongVote = async (sessionCode, songId, userHash, action) => {
  console.log(`[Backend DB] Finding session: "${sessionCode}"`);
  const session = await Session.findOne({ code: sessionCode, isActive: true });

  if (!session) {
    console.log(
      `[Backend DB] Failed: Session "${sessionCode}" not found or not active.`,
    );
    const error = new Error("Active session not found");
    error.status = 404;
    throw error;
  }

  console.log(
    `[Backend DB] Session found. Searching for songId: "${songId}"...`,
  );
  // Ensure we are comparing strings!
  const song = session.suggestions.find(
    (s) => String(s.songId) === String(songId),
  );

  if (!song) {
    console.log(
      `[Backend DB] Failed: Song "${songId}" not found in session suggestions array.`,
    );
    console.log(
      `[Backend DB] Available song IDs are:`,
      session.suggestions.map((s) => s.songId),
    );
    const error = new Error("Song not found in this session");
    error.status = 404;
    throw error;
  }

  console.log(
    `[Backend DB] Song found. Checking user permissions for hash: "${userHash}"`,
  );
  const isHost = session.host.hash === userHash;
  const isParticipant = session.participants.some((p) => p.hash === userHash);

  if (!isHost && !isParticipant) {
    console.log(
      `[Backend DB] Failed: User hash "${userHash}" is not a participant or host.`,
    );
    const error = new Error(
      "Unauthorized: You must be a member of this session to vote.",
    );
    error.status = 403;
    throw error;
  }

  // Ensure arrays exist so .filter doesn't crash on undefined
  song.likedBy = song.likedBy || [];
  song.dislikedBy = song.dislikedBy || [];

  const removeFromLiked = () => {
    song.likedBy = song.likedBy.filter((hash) => hash !== userHash);
  };
  const removeFromDisliked = () => {
    song.dislikedBy = song.dislikedBy.filter((hash) => hash !== userHash);
  };

  console.log(`[Backend DB] Applying action: "${action}"`);
  switch (action) {
    case "like":
      removeFromDisliked();
      if (!song.likedBy.includes(userHash)) song.likedBy.push(userHash);
      break;
    case "dislike":
      removeFromLiked();
      if (!song.dislikedBy.includes(userHash)) song.dislikedBy.push(userHash);
      break;
    case "none":
      removeFromLiked();
      removeFromDisliked();
      break;
    default:
      const error = new Error("Invalid vote action.");
      error.status = 400;
      throw error;
  }

  song.score = song.likedBy.length - song.dislikedBy.length;
  console.log(
    `[Backend DB] New score calculated: ${song.score}. Saving session...`,
  );

  session.markModified("suggestions");
  await session.save();

  console.log(`[Backend DB] Session saved successfully.`);
  return song;
};

module.exports = {
  getActiveSessions,
  getSessionByCode,
  createSession,
  joinSession,
  updateSession,
  endSession,
  addSuggestionToSession,
  getSuggestionsWithNicknames,
  toggleSuggestionPlayedStatus,
  removeAndOptionallyBanSong,
  updateSongVote,
};
