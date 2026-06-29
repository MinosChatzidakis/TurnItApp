import React from "react";
import SearchBar from "../../Components/SearchBar/SearchBar";
import Button from "../../Components/SimpleButton/Button";
import { useState } from "react";
import "./JoinSession.styles.css";
import { useRouting } from "../../hooks/useRouting";
import { useError } from "../../Contexts/ErrorContext";
import { joinSession } from "../../utils/sessionUtils";
import { useParams } from "react-router-dom";

function JoinSession() {
  const { gotoPage } = useRouting();
  const { setError } = useError();

  const { sessionCode: urlSessionCode } = useParams(); //if given in the url, we store it in the normal state variable and just auto-fill the field

  const currStorage = localStorage.getItem("sessionData");
  let jsonStorage;
  if (currStorage) {
    jsonStorage = JSON.parse(currStorage);
  }

  // Initialize your state using the URL code first, then fallback to local storage, then to empty string
  const [sessionCode, setSessionCode] = useState(
    urlSessionCode || jsonStorage?.activeSessionCode || "",
  );

  /*   const [sessionCode, setSessionCode] = useState(
    jsonStorage?.activeSessionCode || "",
  ); */
  const [nickname, setNickname] = useState(jsonStorage?.name || ""); //fetch it if it exists

  const handleKeyDown = (event) => {
    // handle enter press
    if (event.key === "Enter") {
      if (sessionCode !== "" && nickname !== "") {
        console.log("Searching for:", sessionCode);
      }

      searchForSessionCode(); // Search database for code
    }
  };

  const getActiveSessions = async (codesOnly = false) => {
    const response = await fetch(
      `http://localhost:3000/sessions/active?codesOnly=${codesOnly}`,
    );
    const activeSessionCodes = await response.json();
    if (!activeSessionCodes) {
      console.log("No session found.");
      return null;
    }
    console.log("active sessions codes:", activeSessionCodes);
    return activeSessionCodes;
  };

  const searchForSessionCode = async () => {
    if (!sessionCode) {
      setError("Enter a session code to proceed!");
      return;
    }
    if (!nickname) {
      setError("Enter a username to proceed!");
      return;
    }
    const activeSessionCodes = await getActiveSessions(true);
    if (activeSessionCodes?.includes(sessionCode.toString().trim())) {
      // checks if the code is active
      try {
        const res = await joinSession(nickname, sessionCode); //hash the nickname and store it into localStorage
      } catch (e) {
        setError(e.message);
        return;
      }
      gotoPage("Suggest_Songs", sessionCode); //enter session
    } else {
      setError("Session code not found");
      console.log("Session not found in database");
    }
  };
  return (
    <div className="container">
      <h1>Join an active session</h1>

      <h3>Enter the code of the session</h3>

      <div className="inputs-container">
        <SearchBar
          placeholderText={
            jsonStorage?.activeSessionCode || "Type a session code..."
          }
          query={sessionCode}
          setQuery={setSessionCode}
          handleKeyDown={handleKeyDown}
        />

        <SearchBar
          placeholderText={jsonStorage?.name || "Choose a nickname..."}
          query={nickname}
          setQuery={setNickname}
          handleKeyDown={handleKeyDown}
        />

        <Button onClick={searchForSessionCode}>GO</Button>
        <Button onClick={() => gotoPage("Splash")}>BACK</Button>
      </div>
    </div>
  );
}
export default JoinSession;
