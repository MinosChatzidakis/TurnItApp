import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchBar from "../../Components/SearchBar/SearchBar";
import {
  getActiveSession,
  updateSession,
  endSession,
  toggleSongAsPlayed,
  removeSong,
  removeParticipantFromSession,
} from "../../utils/sessionUtils";
import { useError } from "../../Contexts/ErrorContext";
import { useRouting } from "../../hooks/useRouting";
import Button from "../../Components/SimpleButton/Button";
import UserProfile from "../../Components/UserDetails/UserProfile";
import {
  FaSpinner,
  FaCopy,
  FaInfoCircle,
  FaUser,
  FaMusic,
  FaCrown,
} from "react-icons/fa";
import ActionMenu from "../../Components/ActionMenu/ActionMenu";
import "./HostDashboard.styles.css";

const HostDashboard = () => {
  const { sessionCode: urlSessionCode } = useParams();
  const savedHostData = JSON.parse(localStorage.getItem("hostData") || "{}");

  const [sessionCode, setSessionCode] = useState(
    urlSessionCode || savedHostData.activeSessionCode || "",
  );

  const { setError } = useError();
  const { gotoPage } = useRouting();

  const [session, setSession] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [showEndPopUp, setShowEndPopUp] = useState(false);

  const [activeTab, setActiveTab] = useState("settings");

  const [selectedPart, setSelectedPart] = useState(null);

  const setSessionName = (newName) => {
    setSession((prev) => ({ ...prev, name: newName }));
  };

  const setSessionOwner = (newNickname) => {
    setSession((prev) => ({
      ...prev,
      host: { ...prev.host, nickname: newNickname },
    }));
  };

  const [isValidSession, setIsValidSession] = useState(null);

  useEffect(() => {
    const verifyCode = async () => {
      if (!sessionCode) {
        setIsValidSession(false);
        return;
      }

      try {
        const sessionData = await getActiveSession(
          sessionCode,
          savedHostData?.token,
        );
        setCurrentSession(sessionData);
        setSession(sessionData);

        if (sessionData && !sessionData.error) {
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
        }
      } catch (err) {
        setIsValidSession(false);
        localStorage.removeItem("hostData");
      }
    };

    verifyCode();
  }, [sessionCode]);

  useEffect(() => {
    const hostData = localStorage.getItem("hostData");
    if (!hostData) {
      setError("Something went wrong.");
      gotoPage("SPLASH");
    }
  }, []);

  if (isValidSession === null) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" size={30} />
        <p>Loading session...</p>
      </div>
    );
  }

  const openSongInSpotify = (id) =>
    window.open(`https://open.spotify.com/track/${id}`, "_blank");

  const removeOrBanSong = async (sessionCode, songId, ban, token) => {
    try {
      const updatedSuggestions = await removeSong(
        sessionCode,
        songId,
        ban,
        token,
      );
      setCurrentSession((prev) => ({
        ...prev,
        suggestions: updatedSuggestions,
      }));
    } catch (error) {
      setError(error);
    }
  };
  return isValidSession ? (
    <div className="host-dashboard-container">
      <h2 className="dashboard-title">SESSION DASHBOARD</h2>

      {/* --- TAB NAVIGATION --- */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
        <button
          className={`tab-btn ${activeTab === "suggestions" ? "active" : ""}`}
          onClick={() => setActiveTab("suggestions")}
        >
          Suggestions
        </button>
        <button
          className={`tab-btn ${activeTab === "participants" ? "active" : ""}`}
          onClick={() => setActiveTab("participants")}
        >
          Participants
        </button>
      </div>

      {/* --- TAB CONTENT: SETTINGS --- */}
      {activeTab === "settings" && (
        <div className="tab-content settings-tab">
          <div className="info-banner">
            <FaInfoCircle className="info-banner-icon" />
            <p style={{ margin: 0 }}>
              <strong>Keep this tab open!</strong> If you clear your browser
              cache or close a private/incognito window, you will lose your host
              controls.
            </p>
          </div>

          <span className="settings-label">Code:</span>
          <SearchBar
            placeholderText={sessionCode}
            query={sessionCode}
            readOnly={true}
          >
            <FaCopy
              className="copy-icon"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(sessionCode);
                  setError("Copied!");
                } catch (err) {
                  setError("Failed to copy text.");
                }
              }}
            />
          </SearchBar>

          <span className="settings-label">Session name:</span>
          <SearchBar
            placeholderText={session.name}
            query={session.name}
            setQuery={setSessionName}
          />

          <span className="settings-label">Owner's nickname:</span>
          <SearchBar
            placeholderText={session?.host?.nickname}
            query={session?.host?.nickname}
            setQuery={setSessionOwner}
          />

          <div className="button-group">
            <Button
              className="full-width-btn"
              onClick={async () => {
                try {
                  const res = await updateSession(
                    sessionCode,
                    session,
                    savedHostData?.token,
                  );
                  const jsonResponse = await res.json();
                  const updatedSession = jsonResponse?.session;
                  setCurrentSession(structuredClone(updatedSession));
                  setSession(structuredClone(updatedSession));
                  setError(jsonResponse?.message);
                } catch (err) {
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

            <Button
              className="full-width-btn"
              onClick={async () => setSession(currentSession)}
              disabled={
                currentSession?.name === session?.name &&
                currentSession?.host?.nickname === session?.host?.nickname
              }
            >
              RESET CHANGES
            </Button>

            <div className="grid-item-span-2">
              <Button
                className="btn-end-session"
                onClick={async () => {
                  try {
                    setShowEndPopUp(true);
                    const hostData = JSON.parse(
                      localStorage.getItem("hostData") || "{}",
                    );
                    if (!hostData.token)
                      throw new Error("No host token found.");

                    await endSession(sessionCode, hostData.token);
                    setError("Session ended successfully.");
                    localStorage.removeItem("hostData");
                    gotoPage("SPLASH");
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                END SESSION
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: SUGGESTIONS --- */}
      {activeTab === "suggestions" && (
        <div className="tab-content">
          <h3>Suggested Songs ({currentSession?.suggestions?.length || 0})</h3>

          {currentSession?.suggestions?.length > 0 ? (
            <div className="fancy-grid">
              {currentSession.suggestions
                .sort((a, b) => (b.score ?? 1) - (a.score ?? 1))
                .map((song, index) => {
                  return (
                    <div
                      key={index}
                      className="fancy-card"
                      onClick={() => {
                        openSongInSpotify(song.songId);
                      }}
                    >
                      <div className="fancy-info-group">
                        <div className="icon-wrapper">
                          {song.thumbnail ? (
                            <img src={song.thumbnail} alt="Cover" />
                          ) : (
                            <FaMusic />
                          )}
                        </div>

                        <div className="card-text-content">
                          <h4
                            className="card-title"
                            title={song.songTitle || song.title}
                          >
                            {song.songTitle || song.title}
                          </h4>
                          <p className="card-subtitle" title={song.artists}>
                            {song.artists || "Unknown Artist"}
                          </p>
                          <p className="card-meta">
                            Suggested by:
                            {" " + song.suggestedByNickname || " Unknown"}
                          </p>
                        </div>
                      </div>

                      <div className="card-actions">
                        <div className="score-badge">{song.score ?? 1} pts</div>

                        {/* --- NEW SONG MENU --- */}
                        <ActionMenu
                          options={[
                            {
                              label: song.isPlayed
                                ? "Mark as unplayed"
                                : "Set as played",
                              onClick: async () => {
                                try {
                                  const newSuggestions =
                                    await toggleSongAsPlayed(
                                      sessionCode,
                                      song.songId,
                                      savedHostData.token,
                                    );

                                  //update local instance
                                  setCurrentSession((prev) => ({
                                    ...prev,
                                    suggestions: newSuggestions,
                                  }));
                                } catch (err) {
                                  setError(err.message);
                                }
                              },
                            },
                            {
                              label: "View on Spotify",
                              onClick: () => {
                                openSongInSpotify(song.songId);
                              },
                            },
                            {
                              label: "Remove suggestion",
                              onClick: async () =>
                                removeOrBanSong(
                                  sessionCode,
                                  song.songId,
                                  false,
                                  savedHostData.token,
                                ),
                              danger: true,
                            },
                            {
                              label: "Ban suggestion",
                              onClick: async () =>
                                removeOrBanSong(
                                  sessionCode,
                                  song.songId,
                                  true,
                                  savedHostData.token,
                                ),
                              danger: true,
                            },
                          ]}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="empty-state">No songs have been suggested yet.</p>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: PARTICIPANTS --- */}
      {activeTab === "participants" && (
        <div className="tab-content">
          <h3>
            Session Participants ({currentSession?.participants?.length || 0})
          </h3>

          <div className="fancy-grid">
            {/* Host Card */}
            <div className="fancy-card host-card">
              <div className="fancy-info-group">
                <div className="icon-wrapper host-icon-wrapper">
                  <FaCrown />
                </div>
                <div className="card-text-content">
                  <h4 className="card-title">{currentSession?.host}</h4>
                  <p className="card-subtitle">Host</p>
                </div>
              </div>
            </div>

            {/* Participants Mapping */}
            {currentSession?.participants?.length > 0 &&
              currentSession.participants.map((participant, index) => {
                return (
                  <div
                    key={index}
                    className="fancy-card"
                    onClick={() => {
                      setSelectedPart(participant);
                    }}
                  >
                    <div className="fancy-info-group">
                      <div className="icon-wrapper">
                        <FaUser />
                      </div>
                      <div className="card-text-content">
                        <h4 className="card-title">{participant}</h4>
                        <p className="card-subtitle">Participant</p>
                      </div>
                    </div>

                    <div className="card-actions">
                      {/* --- NEW PARTICIPANT MENU --- */}
                      <ActionMenu
                        options={[
                          {
                            label: "Kick Participant",
                            onClick: async () => {
                              try {
                                const updatedParticipants =
                                  await removeParticipantFromSession(
                                    sessionCode,
                                    participant,
                                    savedHostData?.token,
                                  );
                                setCurrentSession((prev) => ({
                                  ...prev,
                                  participants: updatedParticipants,
                                }));
                              } catch (e) {
                                setError(e);
                              }
                            },
                            danger: true,
                          },
                        ]}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          {currentSession?.participants?.length === 0 && (
            <p className="empty-state">No participants have joined yet.</p>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="invalid-session-message">
      <h2>Session Not Found</h2>
      <p>This session is invalid or has ended.</p>
    </div>
  );
};

export default HostDashboard;
