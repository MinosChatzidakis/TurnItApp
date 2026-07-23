//change session name, change owner nickname, view code, view participants, view suggestions, view leaderboard, view playing now in spotify and up next, add suggestions to playlist, end session
//!find a way to only allow one host in here
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchBar from "../../Components/SearchBar/SearchBar";
import {
  getActiveSession,
  updateSession,
  endSession,
} from "../../utils/sessionUtils";
import { useError } from "../../Contexts/ErrorContext";
import { useRouting } from "../../hooks/useRouting";
import Button from "../../Components/SimpleButton/Button";
import { FaLock, FaSpinner, FaCopy, FaInfoCircle } from "react-icons/fa";
const HostDashboard = () => {
  const { sessionCode: urlSessionCode } = useParams(); //get code given in the url

  const savedHostData = JSON.parse(localStorage.getItem("hostData") || "{}");

  const [sessionCode, setSessionCode] = useState(
    urlSessionCode || savedHostData.activeSessionCode || "",
  );

  const { setError } = useError();

  const { gotoPage } = useRouting();

  const [session, setSession] = useState(null); //changes can be made here

  const [currentSession, setCurrentSession] = useState(null); //this is the starting state of the session

  const [showEndPopUp, setShowEndPopUp] = useState(false);

  //change the session's name

  const setSessionName = (newName) => {
    setSession((prev) => ({
      ...prev,

      name: newName,
    }));
  };

  //change the owner's nickname

  const setSessionOwner = (newNickname) => {
    setSession((prev) => ({
      ...prev,

      host: {
        ...prev.host,

        nickname: newNickname,
      },
    }));
  };

  // null = loading, true = valid, false = invalid

  const [isValidSession, setIsValidSession] = useState(null);

  //handle change in the url

  useEffect(() => {
    const verifyCode = async () => {
      if (!sessionCode) {
        setIsValidSession(false);

        return;
      }

      try {
        const sessionData = await getActiveSession(sessionCode); //check if it valid

        setCurrentSession(sessionData);

        setSession(sessionData); //store the object

        console.log("Session data= ", sessionData);

        if (sessionData && !sessionData.error) {
          setIsValidSession(true); //it exists => valid
        } else {
          setIsValidSession(false); //it doesn't => invalid
        }
      } catch (err) {
        console.log("Got an error", err);

        setIsValidSession(false);
        localStorage.removeItem("hostData"); // ** hsot is trying to continue in a session that does not exist => remove it from their localstorage so they can create a new one **
      }
    };

    verifyCode();
  }, [sessionCode]); // run every time sessionCode changes

  //make sure that host credentials are present

  useEffect(() => {
    const hostData = localStorage.getItem("hostData");

    if (!hostData) {
      console.log("no token");

      setError("Something went wrong.");

      gotoPage("SPLASH");
    }
  }, []);

  if (isValidSession === null) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />

        <p>Loading session...</p>
      </div>
    );
  }

  return isValidSession ? (
    <div className="container">
      <h2>SESSION DASHBOARD</h2>
      {/* Informational Banner */}
      <div
        style={{
          backgroundColor: "rgba(255, 204, 0, 0.2)",
          border: "1px solid #ffcc00",
          padding: "10px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "15px 0",
          fontSize: "0.9rem",
        }}
      >
        <FaInfoCircle style={{ color: "#ffcc00", flexShrink: 0 }} />
        <p style={{ margin: 0 }}>
          <strong>Keep this tab open!</strong> If you clear your browser cache
          or close a private/incognito window, you will lose your host controls.
        </p>
      </div>
      {/* session code */}
      Code:
      <SearchBar
        placeholderText={sessionCode}
        query={sessionCode}
        readOnly={true}
      >
        <FaCopy
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(sessionCode); //copy text to clipboard

              setError("Copied!");

              console.log("Copied!");
            } catch (err) {
              setError("Failed to copy text.");

              console.error("Failed to copy text: ", err);
            }
          }}
        />
      </SearchBar>
      {/* session name */}
      Session name:
      <SearchBar
        placeholderText={session.name}
        query={session.name}
        setQuery={setSessionName}
      />
      {/* owner's nickname */}
      Owner's nickname:
      <SearchBar
        placeholderText={session?.host?.nickname}
        query={session?.host?.nickname}
        setQuery={setSessionOwner}
      />
      {/* save changes */}
      <Button
        onClick={async () => {
          try {
            const res = await updateSession(
              sessionCode,
              session,
              savedHostData?.token,
            );

            const jsonResponse = await res.json();

            const updatedSession = jsonResponse?.session; //it also includes a message

            setCurrentSession(structuredClone(updatedSession)); //the one used for reseting
            setSession(structuredClone(updatedSession)); //the one used for editing

            setError(jsonResponse?.message);
          } catch (err) {
            console.error("Save failed:", err);
            setError(err.message || "Failed to save changes.");
          }
        }}
        disabled={
          currentSession?.name === session?.name &&
          currentSession?.host?.nickname === session?.host?.nickname
        }
      >
        SAVE CHANGES
      </Button>
      {/* cancel changes */}
      <Button
        onClick={async () => {
          setSession(currentSession);
        }}
        disabled={
          currentSession?.name === session?.name &&
          currentSession?.host?.nickname === session?.host?.nickname
        } // only be able to save if changes have been made
      >
        RESET CHANGES
      </Button>
      {/* END SESSION */}
      <Button
        onClick={async () => {
          try {
            setShowEndPopUp(true);

            const hostData = JSON.parse(
              localStorage.getItem("hostData") || "{}",
            );

            if (!hostData.token) {
              throw new Error("No host token found.");
            }

            // If endSession fails, it will jump straight to the catch block below

            await endSession(sessionCode, hostData.token);

            // If we reach this line, deletion was successful!

            setError("Session ended successfully.");

            localStorage.removeItem("hostData");

            gotoPage("SPLASH"); //back to splash screen
          } catch (e) {
            // Pass e.message so React receives a clean string instead of an object!

            console.error("End session failed:", e.message);

            setError(e.message);
          }
        }}
      >
        END SESSION
      </Button>
    </div>
  ) : (
    <div>invalid session</div>
  );
};

export default HostDashboard;
