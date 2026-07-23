//! replace this with db logic to fetch actual current sessions
let activeSessions = [
  {
    code: "123",
    name: "party",
    host: {
      nickname: "minos",
      hostHash: "111111111111Aa...",
    },
    participants: [],
  },
]; //proxeiri mlkia

const getActiveSessions = async () => {
  return activeSessions;
};

const getSessionByCode = async (code) => {
  const selectedSession = activeSessions?.find((s) => s.code === code);
  if (selectedSession) return selectedSession;
  else {
    console.log(`Session ${code} Not found in sessionsmodel`);
    return null;
  }
  throw new Error("Model error: Couldn't get session with code", code);
};

//!! this has to change -- right now it works with the local dummy arrays
const joinSession = async (code, nickname, hash) => {
  try {
    const i = activeSessions.findIndex((s) => s.code === code); // locate index of session user wishes to join
    //const hashedNickname = hashingAlgorithm(newUser);
    prevState = activeSessions[i];
    activeSessions[i] = {
      ...prevState,
      participants: [...prevState.participants, { nickname, hash }], //** add hashed nickname to session instead of regular nickname
    };
    console.log("Joined session. Session is:", activeSessions[i]);
  } catch (err) {
    console.log(err);
  }
};

const createSession = async (name, host, hostHash, code) => {
  activeSessions = [
    ...activeSessions,
    {
      code: code,
      name: name,
      host: {
        nickname: host,
        hostHash: hostHash,
      },
      participants: [],
    },
  ];
  console.log("Created new session: ", activeSessions);
  return;
};

//update session's name / host's nams
//activeSessionsModel.js
const updateSession = async (code, newSessionName, newHostName) => {
  const idx = activeSessions.findIndex((s) => s.code === code);

  if (idx === -1) {
    const error = new Error(`No session found with code ${code}`);
    error.status = 404; // Set the status code directly on the error
    throw error; // Throw directly to the controller!
  }

  activeSessions[idx] = {
    ...activeSessions[idx],
    name: newSessionName,
    host: { ...activeSessions[idx].host, nickname: newHostName },
  };

  console.log(`Updated session with code: ${code}`);
  console.log(`New session: ${activeSessions[idx]}`);
  return activeSessions[idx];
};

const endSession = async (code) => {
  try {
    const initialCount = activeSessions.length;

    // Must reassign the newly filtered array back to the variable!
    activeSessions = activeSessions.filter((s) => s.code !== code);

    // If the length shrank, something was deleted
    const wasDeleted = activeSessions.length < initialCount;
    if (wasDeleted) {
      console.log(`Successfully removed session ${code}.`);
    } else {
      console.log(`Session ${code} did not exist.`);
    }
  } catch (e) {
    throw e;
  }
};

module.exports = {
  getActiveSessions,
  getSessionByCode,
  createSession,
  joinSession,
  updateSession,
  endSession,
};
