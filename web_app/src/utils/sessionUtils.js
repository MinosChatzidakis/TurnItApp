import { generateSecureHash } from "./hash";
import { useError } from "../Contexts/ErrorContext";

// get session data from local storage
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
  if (!response.ok)
    throw new Error({
      message: `Something went wrong while searching for session ${sessionCode}`,
    });
  const session = await response.json();
  console.log("Session found: ", session);
  return session;
};

const addNicknameToSession = async (sessionCode, nickname) => {
  try {
    await fetch("http://localhost:3000/sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionCode: sessionCode, nickname: nickname }),
    });
  } catch (e) {
    console.log(
      `Could not add nickname ${nickname} to session: ${sessionCode}`,
    );
    return e; //propagate the error
  }
};

export const joinSession = async (nickname, sessionCode) => {
  const cleanName = nickname?.trim();
  const cleanCode = sessionCode?.trim();
  let response;

  try {
    response = await fetch(`http://localhost:3000/sessions/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionCode: cleanCode, nickname: cleanName }),
    });
  } catch (e) {
    console.log(e);
  }
  if (!response?.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData?.message ||
        "Couldn't find session to join. That might be because of an invalid code or because the host has ended the session.",
    );
  }
  const existingData = getLocalStorage();
  //const existingData = localStorage.getItem("sessionData");
  const { hash: userPrivateHash, nickname: newNickname } =
    await response.json();
  if (!userPrivateHash) throw new Error("Couldnt generate response");
  if (existingData) {
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

  try {
    // Generate secret response & save
    //store data to local storage
    const sessionData = {
      name: newNickname,
      token: userPrivateHash,
      activeSessionCode: cleanCode,
    };

    localStorage.setItem("sessionData", JSON.stringify(sessionData)); //store in the client the session joined

    return sessionData;
  } catch (error) {
    console.error("Session creation failed:", error);
    throw new Error("Could not save session to your device.");
  }
};

export const leaveSession = async (sessionCode, userHash) => {
  //let the backend know
  localStorage.removeItem("sessionData"); //remove from the device
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

export const updateSession = async (sessionCode, newSession, hostToken) => {
  if (!sessionCode) {
    console.log("No session code inserted. Please try again.");
    throw new Error("Missing session code.");
  }

  console.log(`Session to update: ${sessionCode}`);

  try {
    const response = await fetch(
      `http://localhost:3000/sessions/update/${sessionCode}`, //req.params
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          //req.body
          newSessionName: newSession?.name,
          newHostName: newSession?.host?.nickname, // Added optional chaining for safety
          hostToken: hostToken,
        }),
      },
    );

    if (!response.ok) {
      console.log("Couldn't update");
      throw new Error("Server responded with an error while updating.");
    }

    console.log("Successfully updated session");
    return response;
  } catch (error) {
    console.error("Update session failed:", error);
    throw error; // Re-throw so HostDashboard knows the save failed!
  }
};

export const endSession = async (sessionCode, userHash) => {
  const cleanCode = sessionCode?.trim();
  const cleanHash = userHash?.trim();

  if (!cleanCode || !cleanHash) {
    throw new Error("Missing session code or host token. Cannot end session.");
  }

  const response = await fetch(
    `http://localhost:3000/sessions/${sessionCode}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: cleanCode,
        hash: cleanHash,
      }),
    },
  );

  // If the server responded with an error status (400, 403, 404, 500)
  if (!response.ok) {
    // Try to read the exact JSON error sent by Express
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Server refused to end the session.");
  }

  return true; // Successfully deleted!
};
