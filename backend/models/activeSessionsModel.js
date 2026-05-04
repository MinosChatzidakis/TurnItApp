//! replace this with database logic to fetch actual current sessions
const activeSessions = [
  {
    code: "123",
    owner: "idk",
    nicknames: ["nick", "name", "what"],
  },
  {
    code: "456",
    owner: "someone",
    nicknames: ["nick2", "name2", "what2"],
  },
]; //proxeiri mlkia

const getActiveSessions = async () => {
  return activeSessions;
};

module.exports = { getActiveSessions };
