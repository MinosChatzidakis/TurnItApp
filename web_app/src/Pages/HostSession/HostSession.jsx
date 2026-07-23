import React from "react";
import { useState } from "react";
import { useSession } from "../../Contexts/SessionContext";
import SearchBar from "../../Components/SearchBar/SearchBar";
import Button from "../../Components/SimpleButton/Button";
import { useError } from "../../Contexts/ErrorContext";
import { createSession } from "../../utils/sessionUtils";
import { useRouting } from "../../hooks/useRouting";
function HostSession() {
  //const { code: sessionCode } = useSession();
  const [newSession, setNewSession] = useState({
    name: "",
    owner: "",
    ownerHash: "",
    code: "",
  });

  const { gotoPage } = useRouting();
  const { setError } = useError();

  const createNewSession = async (newSession) => {
    const res = await createSession(newSession);
    if (!res?.ok) {
      // Optional: Parse the error message from the backend to show the user
      const errorData = await res?.json();
      setError(errorData?.error || "Failed to create session.");
      return;
    }
    const data = await res?.json();
    if (!data) {
      console.log("Error in creating session.");
      return;
    }
    if (data.error) {
      setError(data.error);
      return;
    }
    const { code: generatedCode, hostHash } = data;
    console.log("Created session with code: ", generatedCode);
    localStorage.setItem(
      "hostData",
      JSON.stringify({
        //store the newly created session's host data
        code: generatedCode,
        token: hostHash,
      }),
    );
    setNewSession((prev) => ({ ...prev, code: generatedCode }));
    gotoPage("HOST_DASHBOARD", generatedCode); // move to dashboard for this session
  };

  const updateNewSessionName = (newName) =>
    setNewSession((prev) => ({ ...prev, name: newName }));

  const updateNewSessionOwner = (newOwner) =>
    setNewSession((prev) => ({ ...prev, owner: newOwner }));

  const handleKeyDown = (e) => {
    if (e.target.value === "Enter") console.log("Entered");
  };

  return (
    <div className="container">
      {/* session name bar */}
      <h4>Session name:</h4>
      <SearchBar
        placeholderText={"Select a name..."}
        query={newSession.name}
        setQuery={(name) => updateNewSessionName(name)}
      />

      {/* host name bar */}
      <h4>Host nickname:</h4>
      <SearchBar
        placeholderText={"Select a nickname..."}
        query={newSession.owner}
        setQuery={(owner) => updateNewSessionOwner(owner)}
      />

      <Button
        onClick={() => {
          let existingData = localStorage.getItem("hostData");
          if (existingData) {
            existingData = JSON.parse(existingData);
            setError(
              //user is already a host to another session
              `You can only have one active session at a time.\nYou already have session ${existingData.code} running.`,
            );
            return;
          }
          createNewSession(newSession);
        }}
      >
        CREATE SESSION
      </Button>
    </div>
  );
}

export default HostSession;
