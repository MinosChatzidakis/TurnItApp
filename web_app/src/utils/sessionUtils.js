// get session data from local storage
const getLocalStorage = () => {
  const existingDataStr = localStorage.getItem("sessionData"); //only for participants
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
export const getActiveSession = async (sessionCode, userToken) => {
  if (!sessionCode || !userToken) {
    throw new Error("Missing info, cannot get session details");
  }
  const response = await fetch(
    `http://localhost:3000/sessions/code/${sessionCode}/${userToken}`,
  );
  if (!response.ok)
    throw new Error({
      message: `Something went wrong while searching for session ${sessionCode}`,
    });
  const session = await response.json();
  console.log("Session found: ", session);
  return session;
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
    if (
      existingData?.activeSessionCode &&
      existingData?.activeSessionCode !== sessionCode
    )
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

export const removeParticipantFromSession = async (
  sessionCode,
  targetNickname,
  authToken,
) => {
  if (!sessionCode || !targetNickname || !authToken)
    throw new Error("Missing fields, cannot remove user");

  const response = await fetch(
    `http://localhost:3000/sessions/${sessionCode}/participants/${targetNickname}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  if (!response.ok) {
    const j = await response.json();
    const err = j?.error;
    throw new Error(err || "Failed to remove participant");
  }

  const j = await response.json();
  const newParticipantNicknames = j.participants;
  return newParticipantNicknames;
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

export const endSession = async (sessionCode, hostHash) => {
  const cleanCode = sessionCode?.trim();
  const cleanHash = hostHash?.trim();

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

export const addSuggestion = async (sessionCode, userHash, suggestion) => {
  if (!sessionCode || !userHash || !suggestion) {
    console.log(sessionCode, userHash, suggestion);
    throw new Error("Cannot complete song suggestion. Missing data");
  }
  sessionCode = sessionCode?.trim().toUpperCase();
  const cleanHash = userHash?.trim();
  const response = await fetch(
    `http://localhost:3000/sessions/suggest/${sessionCode}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hash: cleanHash,
        songSuggestion: suggestion, //just the id
      }),
    },
  );
  if (!response?.ok) {
    let error = (await response.json()).error; //extract error message
    throw new Error(
      error || "An error occured - Couldn't complete song suggestion",
    );
    return;
  }

  const jsonResponse = await response.json(); //get the new suggestions
  const updatedSuggestions = jsonResponse.suggestionsList;
  console.log("New suggestions: ", updatedSuggestions);
  if (!updatedSuggestions) throw new Error("Something went wrong");
  console.log("New list retrieved successfully.");
  return updatedSuggestions;
};

export const getSuggestions = async (sessionCode, userHash) => {
  if (!sessionCode || !userHash) {
    throw new Error("Cannot get suggestions, missing fields...");
  }

  const cleanHash = userHash.trim();
  const cleanCode = sessionCode.trim();

  try {
    const response = await fetch(
      `http://localhost:3000/sessions/suggestions/${cleanCode}?hash=${cleanHash}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch suggestions");
    }

    const data = await response.json();
    return data.currentSuggestions; //return the data
  } catch (e) {
    console.error(e);
    throw e; // Always re-throw so the frontend UI knows it failed
  }
};

export const toggleSongAsPlayed = async (sessionCode, songId, hostHash) => {
  if (!sessionCode || !songId || !hostHash) {
    throw new Error("Cannot set as played because fields are missing");
  }
  const trueCode = sessionCode.toUpperCase().trim();
  try {
    const response = await fetch(
      `http://localhost:3000/sessions/${trueCode}/played-suggestions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hostHash}`,
        },
        body: JSON.stringify({
          songId: songId,
        }),
      },
    );
    if (!response.ok) {
      const j = await response.json();
      const error = j.error;
      throw new Error(
        error || "Something went wrong with setting this song as played",
      );
    }
    const data = await response.json();
    console.log("Song toggled as played successfully!");
    return data?.suggestions; //! this needs to be returned

    if (!updatedSuggestions)
      throw new Error("Update fetched but something went wrong");
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const removeSong = async (sessionCode, songId, ban, hostHash) => {
  if (!sessionCode || !songId || !hostHash) {
    throw new Error("Missing info, cannot remove song");
  }
  try {
    // We put the songId in the path, and the ban option in a query parameter (?ban=true)
    const response = await fetch(
      `http://localhost:3000/sessions/${sessionCode}/songs/${songId}?ban=${ban || false}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${hostHash}`,
        },
      },
    );
    if (!response.ok) {
      const jres = await response.json();
      const err = jres.error;
      throw new Error(err || "Something went wrong with removing the song");
    }
    const jres = await response.json();
    const updatedSuggestions = jres?.suggestions;
    console.log(updatedSuggestions);
    const mesg = jres?.message;
    console.log(mesg);
    return updatedSuggestions;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const voteForSong = async (sessionCode, songId, action, token) => {
  // action should be 'like', 'dislike', or 'none'
  const response = await fetch(
    `http://localhost:3000/sessions/${sessionCode}/songs/${songId}/vote`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to vote");
  }

  return await response.json();
};
