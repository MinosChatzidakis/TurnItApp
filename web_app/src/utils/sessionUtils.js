import { generateSecureHash } from "./hash";

const getLocalStorage = () => {
  const existingDataStr = localStorage.getItem("sessionData");
  let existingData;
  if (existingDataStr) {
    existingData = JSON.parse(existingDataStr);
  }
  return existingData; //return json
};

const writeToLocalStorage = (newSessionData) => {
  const dataStr = JSON.stringify(newSessionData);
  localStorage.setItem("sessionData", dataStr);
  console.log("Updated sessionData: ", dataStr);
};

//check if the username is available and if not, alter it a bit
const checkUsernameAvailability = (selectedSession, cleanName) => {
  //! maybe alter this to add device id check -- right now we are not even letting the owner in!
  if (selectedSession?.owner === cleanName)
    throw new Error("Invalid username (o), please try another one");
  // !-------------------------
  if (selectedSession?.nicknames?.includes(cleanName))
    //check if the name already exists
    cleanName =
      cleanName + "_" + (Math.floor(Math.random() * 90) + 10).toString();
  return cleanName;
};

//get session by session code
export const getActiveSession = async (sessionCode) => {
  const response = await fetch(
    `http://localhost:3000/sessions/code/${sessionCode}`,
  );
  const session = await response.json();
  console.log("Session found: ", session);
  return session;
};

const addNicknameToSession = async (sessionCode, nickname) => {
  await fetch("http://localhost:3000/sessions/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionCode: sessionCode, nickname: nickname }),
  });
};

export const joinSession = async (nickname, sessionCode) => {
  let cleanName = nickname?.trim();
  const cleanCode = sessionCode?.trim();
  const sessionToJoin = await getActiveSession(cleanCode);

  // Strict Validation
  if (!cleanName) throw new Error("Please choose a nickname first!");
  if (!cleanCode) throw new Error("Please enter a valid session code!");

  // Check if the user is already in a session
  let userPrivateHash;
  let newNickname = checkUsernameAvailability(sessionToJoin, cleanName); // what the user typed or the altered version
  const existingData = getLocalStorage();
  if (existingData) {
    userPrivateHash = await generateSecureHash(cleanName);
    if (
      //if user has previously joined this session
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

    localStorage.setItem("sessionData", JSON.stringify(sessionData)); //store in the client the session joined

    addNicknameToSession(sessionCode, nickname);

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

export const createSession = async (newSession) => {
  try {
    const response = await fetch("http://localhost:3000/sessions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionName: newSession.name,
        sessionHost: newSession.owner,
      }),
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const updateSession = async (newSession) => {
  const sessionCode = newSession?.code;
  if (!sessionCode) {
    console.log("No session code inserted. Please try again.");
    return;
  }
  console.log(sessionCode);
  try {
    const response = await fetch(
      `http://localhost:3000/sessions/update/${sessionCode}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newSessionName: newSession.name,
          newHostName: newSession.owner, //pass on the only fields that can be altered
        }),
      },
    );
    console.log("Successfully updated session");
    return response;
  } catch (error) {
    console.log(error);
  }
};

export const deleteSession = async (sessionCode) => {
  const response = await fetch("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionName: newSession.name,
      sessionHost: newSession.owner,
    }),
  });
};
