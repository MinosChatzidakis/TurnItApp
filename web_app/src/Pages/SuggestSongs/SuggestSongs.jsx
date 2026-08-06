//TODO: maybe add a "now playing feature?"
//TODO when suggestions, likes etc get sent to the backend then we check if the user has joined the session
import React, { useState, useEffect, useCallback } from "react";
import SearchBar from "../../Components/SearchBar/SearchBar";
import Button from "../../Components/SimpleButton/Button";
import SongCard from "../../Components/SongCard/SongCard";
import LeaderboardCard from "../../Components/SongCard/SongCard_v2";
import "./SuggestSongs.styles.css";
import { useError } from "../../Contexts/ErrorContext";
import AsyncSelect from "react-select/async";
import {
  removeParticipantFromSession,
  getActiveSession,
  addSuggestion,
  getSuggestions,
  voteForSong,
} from "../../utils/sessionUtils";
import { useRouting } from "../../hooks/useRouting";
import { useParams } from "react-router-dom";

const debouncePromise = (func, delay) => {
  let timeoutId;
  return (...args) => {
    return new Promise((resolve) => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        const result = await func(...args);
        resolve(result);
      }, delay);
    });
  };
};

function SuggestSongs() {
  const [suggestedSongs, setSuggestedSongs] = useState([]);
  const [joinedSession, setJoinedSession] = useState();
  const currStor = localStorage.getItem("sessionData"); //get local storage
  const currStor_JSON = JSON.parse(currStor);
  const { error, setError } = useError();
  const { gotoPage } = useRouting();

  const [fetchSuggestions, setFetchSuggestions] = useState(true);

  const { sessionCode: urlSessionCode } = useParams(); //get the code from the url

  const currStorage = localStorage.getItem("sessionData");
  let jsonStorage;
  if (currStorage) {
    jsonStorage = JSON.parse(currStorage);
  }

  // Initialize your state using the URL code first, then fallback to local storage, then to empty string
  const [sessionCode, setSessionCode] = useState(
    urlSessionCode || jsonStorage?.activeSessionCode || "",
  );

  // null = loading, true = valid, false = invalid
  const [isValidSession, setIsValidSession] = useState(null);

  useEffect(() => {
    const verifyCode = async () => {
      if (!sessionCode) {
        setIsValidSession(false); //no code => invalid
        localStorage.removeItem("sessionData");
        return;
      }

      try {
        const sessionData = await getActiveSession(
          sessionCode,
          jsonStorage?.token,
        ); //check if it valid
        if (sessionData && !sessionData?.error) {
          setIsValidSession(true); //it exists => valid
          setJoinedSession(sessionData);
        } else {
          setIsValidSession(false); //it doesn't => invalid
          localStorage.removeItem("sessionData");
        }
      } catch (err) {
        setIsValidSession(false);
        localStorage.removeItem("sessionData");
      }
    };

    verifyCode();
  }, [sessionCode]); // run every time sessionCode changes

  //update suggested songs
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const suggestions = await getSuggestions(
          sessionCode,
          currStor_JSON?.token,
        );
        setSuggestedSongs(suggestions);
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    // 1. Fetch immediately so the user isn't staring at a blank screen for 5 seconds
    fetchSongs();

    // Creates a random interval between 10 and 15 seconds
    const randomInterval = Math.floor(Math.random() * 10000) + 15000;

    const intervalId = setInterval(() => {
      fetchSongs();
    }, randomInterval);
    setFetchSuggestions(false);
    // If you don't do this, React will create a brand new interval every time the
    // component re-renders, and your app will crash from doing 1,000 fetches a second.
    return () => {
      clearInterval(intervalId);
    };
  }, [sessionCode, currStor_JSON?.token, fetchSuggestions]);

  const suggestSong = async (song) => {
    //check if song has already been suggested
    if (
      suggestedSongs.some((currentItem) => {
        return currentItem.songId === song.id;
      })
    ) {
      setError("Song is already suggested. You can vote for it!");
      return;
    }
    //suggest new song
    try {
      console.log("Suggesting: ", song);
      const newSuggestionList = await addSuggestion(
        sessionCode,
        currStor_JSON?.token,
        song.id || song.songId,
      ); //send only the id back
      //apply changes locally
      setSuggestedSongs(newSuggestionList);
      setFetchSuggestions(true);
      console.log("Added: ", song.id || song.songId);
    } catch (e) {
      console.log("An error occured and we couldn't suggest your song");
      setError(e.message);
    }
  };

  // safely fetch spotify songs
  const loadOptions = useCallback(
    debouncePromise(async (inputValue) => {
      if (!inputValue) return []; // If the box is empty, don't search

      setError(null); // Clear any old errors

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/songs/search?q=${encodeURIComponent(inputValue)}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch songs");
        }

        const data = await response.json();

        return data.map((song) => ({
          value: song,
          label: song.title,
        }));
      } catch (err) {
        console.error(`Error in loadOptions for ${inputValue}:`, err);
        return [];
      }
    }, 500), // <-- 500ms delay. Adjust this number to make it feel faster or slower.
    [], // Empty dependency array ensures the debouncer doesn't reset on re-renders
  );

  const sendVoteToBackend = async (songId, action) => {
    try {
      await voteForSong(sessionCode, songId, action, currStor_JSON?.token);
    } catch (err) {
      setError("Failed to register vote. Please try again.");
      // If you wanted to be perfectly robust, you would revert the local state here,
      // but for a music app, just showing an error toast is usually fine.
    }
  };

  const addToLiked = (songId) => {
    setLikedSongs((prev) => [...prev, songId]); //add liked song
    setSuggestedSongs((prev) =>
      prev.map((song) =>
        song.songId === songId ? { ...song, score: song.score + 1 } : song,
      ),
    );
    dislikedSongs?.includes(songId) && removeFromDisliked(songId);
  };

  const removeFromLiked = (songId) => {
    setLikedSongs((prev) => prev.filter((item) => item !== songId)); //remove liked song
    setSuggestedSongs((prev) =>
      prev.map((song) =>
        song.songId === songId ? { ...song, score: song.score - 1 } : song,
      ),
    );
  };

  const onLike = (songId) => {
    // 1. Find the current state of the song
    const song = suggestedSongs.find((s) => s.songId === songId);
    if (!song) return;

    // 2. Determine what action we are sending to the backend
    const isRemovingLike = song.hasLiked;
    const action = isRemovingLike ? "none" : "like";

    // 3. Optimistically update the UI instantly
    setSuggestedSongs((prev) =>
      prev.map((s) => {
        if (s.songId === songId) {
          let newScore = s.score;
          if (isRemovingLike) {
            newScore -= 1; // They un-liked it
          } else {
            newScore += 1; // They liked it
            if (s.hasDisliked) newScore += 1; // If they switched from dislike to like, refund the dislike penalty too
          }
          return {
            ...s,
            hasLiked: !isRemovingLike,
            hasDisliked: false,
            score: newScore,
          };
        }
        return s;
      }),
    );

    // 4. Send to backend
    sendVoteToBackend(songId, action);
  };

  const addToDisliked = (songId) => {
    setDislikedSongs((prev) => [...prev, songId]); //add disliked song
    setSuggestedSongs((prev) =>
      prev.map((song) =>
        song.songId === songId ? { ...song, score: song.score - 1 } : song,
      ),
    );
    likedSongs?.includes(songId) && removeFromLiked(songId);
  };

  const removeFromDisliked = (songId) => {
    setDislikedSongs((prev) => prev.filter((item) => item !== songId)); //remove disliked song
    setSuggestedSongs((prev) =>
      prev.map((song) =>
        song.songId === songId ? { ...song, score: song.score + 1 } : song,
      ),
    );
  };

  const onDislike = (songId) => {
    // 1. Find the current state of the song
    const song = suggestedSongs.find((s) => s.songId === songId);
    if (!song) return;

    // 2. Determine what action we are sending to the backend
    const isRemovingDislike = song.hasDisliked;
    const action = isRemovingDislike ? "none" : "dislike";

    // 3. Optimistically update the UI instantly
    setSuggestedSongs((prev) =>
      prev.map((s) => {
        if (s.songId === songId) {
          let newScore = s.score;
          if (isRemovingDislike) {
            newScore += 1; // They un-disliked it
          } else {
            newScore -= 1; // They disliked it
            if (s.hasLiked) newScore -= 1; // If they switched from like to dislike, remove the like bonus too
          }
          return {
            ...s,
            hasLiked: false,
            hasDisliked: !isRemovingDislike,
            score: newScore,
          };
        }
        return s;
      }),
    );

    // 4. Send to backend
    sendVoteToBackend(songId, action);
  };
  // This wrapper acts as the translator between react-select and LeaderboardCard
  const CustomLeaderboardOption = (props) => {
    // react-select gives us these three special variables
    const { innerProps, innerRef, data } = props;

    return (
      // We attach innerRef and innerProps to a standard div.
      // This tells react-select exactly where the user is clicking or hovering!
      <div ref={innerRef} {...innerProps} className="dropdown-item-wrapper">
        <LeaderboardCard song={data.value} />
      </div>
    );
  };

  // custom styles for the options in the search component
  const customStyles = {
    container: (provided) => ({
      ...provided,
      width: "100%",
      maxWidth: "700px", // Forces the bar to be nice and wide!
      margin: "0 auto", // Keeps it centered
    }),

    // 1. The main search bar (The "Control")
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "#282828",
      borderColor: state.isFocused ? "#1db954" : "#555",
      minHeight: "64px",
      borderRadius: "30px",
      boxShadow: state.isFocused ? "0 0 0 1px #1db954" : "none",
      cursor: "text",
      "&:hover": {
        borderColor: state.isFocused ? "#1db954" : "#888",
      },
    }),

    input: (provided) => ({
      ...provided,
      color: "white",
      fontSize: "20px", // 🚨 Increased font size
    }),

    placeholder: (provided) => ({
      ...provided,
      color: "#b3b3b3",
      fontSize: "20px", // 🚨 Increased font size
    }),

    menu: (provided) => ({
      ...provided,
      backgroundColor: "#282828",
      borderRadius: "8px",
      marginTop: "8px",
      boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
      // 🚨 DELETE the `width: 500` line entirely!
      // Without it, the menu will automatically match the width of the control bar perfectly.
    }),

    // 5. The individual song rows inside the dropdown (The "Options")
    option: (provided, state) => ({
      ...provided,
      // If the user hovers OR uses keyboard arrows, highlight it lighter gray
      backgroundColor: state.isFocused ? "#3e3e3e" : "transparent",
      color: "white",
      cursor: "pointer",
      padding: "10px 16px", // Breathing room
      // Removes the default blue background when an item is officially "selected"
      "&:active": {
        backgroundColor: "#555",
      },
    }),

    // 6. The loading spinner wrapper
    loadingMessage: (provided) => ({
      ...provided,
      color: "#b3b3b3",
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: "#b3b3b3",
    }),
  };

  return isValidSession ? (
    <div className="container">
      <h1>{joinedSession?.name}</h1>
      <h1>{currStor_JSON?.activeSessionCode?.toUpperCase()}</h1>
      {/* search songs component */}
      <AsyncSelect
        loadOptions={loadOptions}
        components={{
          Option: CustomLeaderboardOption, //render song in the format established
          DropdownIndicator: () => null, //no dropdown
          IndicatorSeparator: () => null, //no separator
        }}
        styles={customStyles}
        placeholder={`What do you want to listen to, ${currStor_JSON?.name}?`}
        value={null}
        cacheOptions // Memorizes searches to save API calls
        onChange={(selectedItem) => suggestSong(selectedItem.value)} //When they pick a song, runs your function
      />
      {/* render already suggested songs */}
      <h3>SUGGESTED SONGS</h3>
      <div className="songs_grid">
        {suggestedSongs
          .sort((a, b) => b.score - a.score)
          .map((song, index) => {
            return (
              <LeaderboardCard
                key={`${index}_card`}
                rank={index + 1}
                song={song}
                onClick={() =>
                  window.open(
                    `https://open.spotify.com/track/${song.songId}`,
                    "_blank",
                  )
                }
                // Use optimistic UI logic for the clicks!
                onLike={() => {
                  const action = song.hasLiked ? "none" : "like";
                  sendVoteToBackend(song.songId, action);
                  setFetchSuggestions(true); // Instantly re-fetch to show new score/color
                }}
                onDislike={() => {
                  const action = song.hasDisliked ? "none" : "dislike";
                  sendVoteToBackend(song.songId, action);
                  setFetchSuggestions(true); // Instantly re-fetch to show new score/color
                }}
                // 👇 Read directly from the backend data!
                liked={song.hasLiked}
                disliked={song.hasDisliked}
                selfSuggested={song.suggestedByNickname === currStor_JSON?.name}
                showSuggestedBy={true}
              />
            );
          })}
      </div>
      <Button
        onClick={async () => {
          try {
            await removeParticipantFromSession(
              sessionCode,
              currStor_JSON?.name,
              currStor_JSON?.token,
            );
            localStorage.removeItem("sessionData"); //remove from the device
            gotoPage("join_session");
          } catch (error) {
            setError(error.message || "Something went wrong");
            console.log(error.message || "Something went wrong");
          }
        }}
      >
        LEAVE SESSION
      </Button>
    </div>
  ) : (
    <div style={{ textAlign: "center" }}>
      Couldn't find session. This might be due to a wrong code or because the
      host has ended the session or kicked you from it:
      <span
        onClick={() => {
          localStorage.removeItem("sessionData"); //so that the user is not prompted to continue
          gotoPage("Splash");
        }}
        style={{
          color: "blue",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        Return to home page
      </span>
    </div>
  );
}
export default SuggestSongs;
