const Session = require("../Session");

const getActiveSessions = async () => {
  return await Session.find({ isActive: true });
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
module.exports = {
  getActiveSessions,
  getSessionByCode,
  createSession,
  joinSession,
  updateSession,
  endSession,
  addSuggestionToSession,
};
