import React from "react";
import { useState } from "react";
import { useSession } from "../../Contexts/SessionContext";
import SearchBar from "../../Components/SearchBar/SearchBar";
import Button from "../../Components/SimpleButton/Button";
import { createSession } from "../../utils/sessionUtils";
function HostSession() {
  //const { code: sessionCode } = useSession();
  const [newSession, setNewSession] = useState({
    name: "",
    owner: "",
    code: "",
  });

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
        setQuery={(name) => updateNewSessionName(name)}
      />

      <Button onClick={() => createSession(newSession)}>CREATE SESSION</Button>
    </div>
  );
}

export default HostSession;
