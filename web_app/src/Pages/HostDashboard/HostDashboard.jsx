//change session name, change owner nickname, view code, view participants, view suggestions, view leaderboard, view playing now in spotify and up next, add suggestions to playlist, end session
//!find a way to only allow one host in here
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchBar from "../../Components/SearchBar/SearchBar";
import { getActiveSession, updateSession } from "../../utils/sessionUtils";
import Button from "../../Components/SimpleButton/Button";
import { FaLock, FaSpinner } from "react-icons/fa";

const HostDashboard = () => {
  const { sessionCode: urlSessionCode } = useParams(); //get code given in the url
  const [sessionCode, setSessionCode] = useState(
    urlSessionCode || jsonStorage?.activeSessionCode || "",
  );
  const [session, setSession] = useState(null); //changes can be made here
  const [currentSession, setCurrentSession] = useState(null); //this is the starting state of the session

  //change the session's name
  const setSessionName = (newName) => {
    setSession((prev) => ({
      ...prev,
      name: newName,
    }));
  };

  //change the owner's nickname
  const setSessionOwner = (newOwner) => {
    setSession((prev) => ({
      ...prev,
      owner: newOwner,
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
      }
    };

    verifyCode();
  }, [sessionCode]); // run every time sessionCode changes

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
      SESSION DASHBOARD
      {/* session code */}
      Code:
      <SearchBar
        placeholderText={sessionCode}
        query={sessionCode}
        //setQuery={setSessionCode}
        //handleKeyDown={handleKeyDown}
        readOnly={true}
      >
        <FaLock />
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
        placeholderText={session.owner}
        query={session.owner}
        setQuery={setSessionOwner}
      />
      {/* save changes */}
      <Button
        onClick={async () => {
          const res = await updateSession(session);
          const newSess = await res.json();
          setCurrentSession(newSess);
        }}
        disabled={
          currentSession?.name === session?.name &&
          currentSession?.owner === session?.owner
        }
      >
        SAVE CHANGES
      </Button>
      {/* cancel changes */}
      <Button
        onClick={() => {
          setSession(currentSession);
        }}
        disabled={
          currentSession?.name === session?.name &&
          currentSession?.owner === session?.owner
        } // only be able to save if changes have been made
      >
        RESET CHANGES
      </Button>
      {/* END SESSION */}
      {/* <Button
        onClick={() => {
          endSession(sessionCode);
        }}
      >
        END SESSION
      </Button> */}
    </div>
  ) : (
    <div>goodbye</div>
  );
};
export default HostDashboard;
