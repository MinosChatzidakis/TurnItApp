//! replace this with db logic to fetch actual current sessions
const activeSessions = [
  {
    code: "123",
    owner: "idk",
    participants: ["nick", "name", "what"],
  },
  {
    code: "456",
    owner: "someone",
    participants: ["nick2", "name2", "what2"],
  },
]; //proxeiri mlkia

const getActiveSessions = async () => {
  return activeSessions;
};

//add a new session
const addToActiveSessions = async (newSession) => {
  //check newSession's validity
  activeSessions = [...activeSessions, newSession]; //! replace with actually writing to the db
};

const getSessionByCode = async (code) => {
  const selectedSession = activeSessions?.find(
    (s) => s.code === code.toString().trim(),
  );
  if (selectedSession) return selectedSession;
  else return null;
  //throw new Error("Model error: Couldn't get session with code", code);
};

//!! this has to change -- right now it works with the local dummy arrays
const joinSession = async (code, newUser) => {
  try {
    const i = activeSessions.indexOf((s) => s.code === code); // locate index of session user wishes to join
    const hashedNickname = hashingAlgorithm(newUser);
    prevState = activeSessions[i];
    activeSessions[i] = {
      ...prevState,
      participants: [...prevState.participants, hashedNickname], //** add hashed nickname to session instead of regular nickname
    };
  } catch (err) {
    console.log(err);
  }
};

const createSession = async (name, host, code) => {};

module.exports = { getActiveSessions, getSessionByCode };
