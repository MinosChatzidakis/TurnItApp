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

  const [nickname, setNickname] = useState(jsonStorage?.name || ""); //fetch it if it exists

  const handleKeyDown = (event) => {
    // handle enter press
    if (event.key === "Enter") {
      if (sessionCode !== "" && nickname !== "") {
        console.log("Searching for:", sessionCode);
      }

      joinSessionWithCode(); // Search database for code
    }
  };

  const joinSessionWithCode = async () => {
    if (!sessionCode) return setError("Enter a session code to proceed!");
    if (!nickname) return setError("Enter a nickname to proceed!");

    const existingSession = JSON.parse(localStorage.getItem("sessionData"));
    //rejoin previously joined session with the same nickname
    if (
      existingSession &&
      existingSession.activeSessionCode === sessionCode &&
      existingSession.name === nickname
    ) {
      setError(`Welcome back, ${nickname}!`);
      gotoPage("Suggest_Songs", sessionCode); // Success! Enter session.
      return;
    }
    //rejoin previously joined session with a different nickname
    if (
      existingSession &&
      existingSession.activeSessionCode === sessionCode &&
      existingSession.name !== nickname
    ) {
      setError(
        `You have already joined this session with a different nickname! (${existingSession?.name})`,
      );
      return;
    }
    //join a different session
    if (existingSession && existingSession.activeSessionCode !== sessionCode) {
      return setError(
        `You have already joined session: ${existingSession.activeSessionCode}`,
      );
    }
    try {
      // joinSession throws an error if it fails, so we don't need to check res.ok
      await joinSession(nickname, sessionCode);
      gotoPage("Suggest_Songs", sessionCode); // Success! Enter session.
    } catch (e) {
      setError(e.message); // Failure! Show error.
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
        <Button
          onClick={joinSessionWithCode}
          disabled={!sessionCode || !nickname || sessionCode.length < 6}
        >
          GO
        </Button>
        <Button onClick={() => gotoPage("Splash")}>BACK</Button>
      </div>
    </div>
  );
}
export default JoinSession;
