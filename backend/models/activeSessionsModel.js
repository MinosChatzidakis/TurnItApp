//! replace this with db logic to fetch actual current sessions
let activeSessions = []; //proxeiri mlkia

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
const joinSession = async (code, newUser) => {
  try {
    const i = activeSessions.findIndex((s) => s.code === code); // locate index of session user wishes to join
    //const hashedNickname = hashingAlgorithm(newUser);
    prevState = activeSessions[i];
    activeSessions[i] = {
      ...prevState,
      participants: [...prevState.participants, newUser], //** add hashed nickname to session instead of regular nickname
    };
    console.log("Joined session. All sessions:", activeSessions);
  } catch (err) {
    console.log(err);
  }
};

const createSession = async (name, host, code) => {
  activeSessions = [
    ...activeSessions,
    {
      code: code,
      name: name,
      owner: host,
      participants: [],
    },
  ];
  console.log("Created new session: ", activeSessions);
  return;
};

//update session's name / owner's nams
const updateSession = async (code, newSessionName, newHostName) => {
  try {
    const idx = activeSessions.findIndex((s) => s.code === code);

    if (idx === -1) {
      // Throw a custom error object so the controller can catch it and read the status
      const error = new Error(`No session found with code ${code}`);
      error.status = 404;
      throw error;
    }

    activeSessions[idx] = {
      ...activeSessions[idx],
      name: newSessionName,
      owner: newHostName,
    };

    console.log(
      `Updated session with code: ${code}. New session name: ${activeSessions[idx].name}. New host: ${activeSessions[idx].owner}`,
    );

    return activeSessions[idx]; // Return the updated data back to the controller
  } catch (e) {
    console.log(e);
    // If it's already our custom 404 error, throw it up the chain
    if (e.status === 404) throw e;

    // if not, throw a generic 500 error
    throw new Error(`Failed to update session with code ${code}`);
  }
};

module.exports = {
  getActiveSessions,
  getSessionByCode,
  createSession,
  joinSession,
  updateSession,
};
