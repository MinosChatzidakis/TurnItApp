import { generateSecureHash } from "./hash";

//!replace this when the time comes
const sessions = [
  {
    code: 123,
    owner: "MINOS_CHATZIDAKIS",
    nicknames: ["nick", "name", "what"],
  },
  {
    code: 456,
    owner: "CHATZIDAKIS",
    nicknames: ["nick2", "name2", "what2"],
  },
]; //proxeiri mlkia

const getLocalStorage = () => {
  const existingDataStr = localStorage.getItem("sessionData");
  let existingData;
  if (existingDataStr) {
    existingData = JSON.parse(existingDataStr);
  }
  return existingData;
};

const writeToLocalStorage = (newSessionData) => {
  const dataStr = JSON.stringify(newSessionData);
  localStorage.setItem("sessionData", dataStr);
  console.log("Updated sessionData: ", dataStr);
};

export const joinSession = async (nickname, sessionCode) => {
  let cleanName = nickname?.trim();
  const cleanCode = sessionCode?.trim();

  // Strict Validation
  if (!cleanName) throw new Error("Please choose a nickname first!");
  if (!cleanCode) throw new Error("Please enter a valid session code!");

  //check if the username is available and if not, alter it a bit
  const checkUsernameAvailability = () => {
    const activeSession = sessions.find((s) => s.code.toString() === cleanCode);
    //! maybe alter this to add device id check -- right now we are not even letting the owner in
    if (activeSession?.owner === cleanName)
      throw new Error("Invalid username, please try another one");
    // !-------------------------
    if (activeSession?.nicknames.includes(cleanName))
      cleanName =
        cleanName + "_" + (Math.floor(Math.random() * 90) + 10).toString();
    return cleanName;
  };

  // Check if the user is already in a session
  //const existingDataStr = localStorage.getItem("sessionData");
  let userPrivateHash;
  let newNickname = checkUsernameAvailability(); // what the user typed or the altered version
  const existingData = getLocalStorage;
  if (existingData) {
    //const existingData = JSON.parse(existingDataStr);

    userPrivateHash = await generateSecureHash(cleanName);
    if (
      existingData.activeSessionCode === sessionCode &&
      existingData.name === newNickname
    )
      return existingData;
    if (existingData.activeSessionCode)
      throw new Error(
        `You are already in a session as '${existingData.name}'! You can leave that session if you want to join a new one.`,
      );
  }

  // Check if Crypto API is available
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error(
      "Secure hashing is not supported on this browser/connection.",
    );
  }

  try {
    // Generate secret hash & save

    //store data to local storage
    const sessionData = {
      name: newNickname,
      hash: userPrivateHash,
      activeSessionCode: cleanCode,
      //TODO: maybe track device id?
    };

    localStorage.setItem("sessionData", JSON.stringify(sessionData));

    return sessionData;
  } catch (error) {
    console.error("Session creation failed:", error);
    throw new Error("Could not save session to your device.");
    //throw new Error("Failed to register username.");
  }
};

export const leaveSession = async (sessionCode, userHash) => {
  const existingData = getLocalStorage();
  if (existingData) {
    const newSessionData = {
      ...existingData,
      activeSessionCode: "",
    };
    writeToLocalStorage(newSessionData);
  }
};
