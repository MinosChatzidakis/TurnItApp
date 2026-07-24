//TODO: maybe add a "now playing feature?"
//TODO when suggestions, likes etc get sent to the backend then we check if the user has joined the session
import React, { useState, useEffect } from "react";
import SearchBar from "../../Components/SearchBar/SearchBar";
import Button from "../../Components/SimpleButton/Button";
import SongCard from "../../Components/SongCard/SongCard";
import LeaderboardCard from "../../Components/SongCard/SongCard_v2";
import "./SuggestSongs.styles.css";
import { useError } from "../../Contexts/ErrorContext";
import AsyncSelect from "react-select/async";
import { leaveSession, getActiveSession } from "../../utils/sessionUtils";
import { useRouting } from "../../hooks/useRouting";
import { useParams } from "react-router-dom";

function SuggestSongs() {
  const [likedSongs, setLikedSongs] = useState([]);
  const [dislikedSongs, setDislikedSongs] = useState([]);
  const [suggestedSongs, setSuggestedSongs] = useState([]);
  const [joinedSession, setJoinedSession] = useState();
  const currStor = localStorage.getItem("sessionData"); //get local storage
  const currStor_JSON = JSON.parse(currStor);
  const { error, setError } = useError();
  const { gotoPage } = useRouting();

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
        return;
      }

      try {
        const sessionData = await getActiveSession(sessionCode); //check if it valid
        if (sessionData && !sessionData?.error) {
          setIsValidSession(true); //it exists => valid
          setJoinedSession(sessionData);
        } else {
          setIsValidSession(false); //it doesn't => invalid
        }
      } catch (err) {
        setIsValidSession(false);
      }
    };

    verifyCode();
  }, [sessionCode]); // run every time sessionCode changes

  const getctiveSessionCodes = () => {};

  const handleSelectSong = (song) => {
    console.log("Added: ", song);
    if (suggestedSongs.some((currentItem) => currentItem.id === song.id)) {
      setError("Song is already suggested. You can vote for it!");
      return;
    }
    setSuggestedSongs((prev) => [...prev, { ...song, score: 0 }]); //initialise score as 0
  };

  // safely fetch spotify songs
  const loadOptions = async (inputValue) => {
    if (!inputValue) return []; // If the box is empty, don't search

    setError(null); // Clear any old errors from the screen

    try {
      // We use encodeURIComponent just like before for safety
      const response = await fetch(
        `http://localhost:3000/songs/search?q=${encodeURIComponent(inputValue)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch songs");
      }

      const data = await response.json();

      // If successful, format the data for react-select and return it
      return data.map((song) => ({
        value: song,
        label: song.title,
      }));
    } catch (err) {
      console.error(`Error in loadOptions for ${inputValue}:`, err);

      //setError(err.message);  dont do this -> error flickers if enabled

      // Return an empty array so react-select doesn't crash,
      // it will just safely show "No options" in the dropdown.
      return [];
    }
  };

  const addToLiked = (songId) => {
    setLikedSongs((prev) => [...prev, songId]); //add liked song
    setSuggestedSongs((prev) =>
      prev.map((song) =>
        song.id === songId ? { ...song, score: song.score + 1 } : song,
      ),
    );
    dislikedSongs?.includes(songId) && removeFromDisliked(songId);
  };

  const removeFromLiked = (songId) => {
    setLikedSongs((prev) => prev.filter((item) => item !== songId)); //remove liked song
    setSuggestedSongs((prev) =>
      prev.map((song) =>
        song.id === songId ? { ...song, score: song.score - 1 } : song,
      ),
    );
  };

  const onLike = (songId) => {
    if (likedSongs?.includes(songId)) {
      // already liked
      removeFromLiked(songId); //remove liked song
    } else {
      addToLiked(songId);
    }
  };

  const addToDisliked = (songId) => {
    setDislikedSongs((prev) => [...prev, songId]); //add disliked song
    setSuggestedSongs((prev) =>
      prev.map((song) =>
        song.id === songId ? { ...song, score: song.score - 1 } : song,
      ),
    );
    likedSongs?.includes(songId) && removeFromLiked(songId);
  };

  const removeFromDisliked = (songId) => {
    setDislikedSongs((prev) => prev.filter((item) => item !== songId)); //remove disliked song
    setSuggestedSongs((prev) =>
      prev.map((song) =>
        song.id === songId ? { ...song, score: song.score + 1 } : song,
      ),
    );
  };

  const onDislike = (songId) => {
    if (dislikedSongs?.includes(songId)) {
      // already disliked
      removeFromDisliked(songId);
    } else {
      addToDisliked(songId);
    }
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
      <h1>{currStor_JSON?.activeSessionCode}</h1>
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
        onChange={(selectedItem) => handleSelectSong(selectedItem.value)} //When they pick a song, runs your function
      />

      {/* render already suggested songs */}
      <h3>SUGGESTED SONGS</h3>

      <div className="songs_grid">
        {suggestedSongs
          .sort((a, b) => b.score - a.score)
          .map((song, index) => {
            //sort by score
            const songIsLiked = likedSongs?.includes(song.id); // check if song is liked
            const songIsDisliked = dislikedSongs?.includes(song.id); // check if song is disliked

            return (
              <LeaderboardCard
                key={`${index}_card`}
                rank={index + 1}
                song={song}
                onClick={() => console.log("Works")}
                onLike={() => onLike(song.id)}
                onDislike={() => onDislike(song.id)}
                liked={songIsLiked || false}
                disliked={songIsDisliked}
              />
            );
          })}
      </div>

      {/* add a check to see if user has joined this session*/}
      <Button
        onClick={() => {
          leaveSession("123" /* replace with context.code */);
          gotoPage("join_session");
        }}
      >
        LEAVE SESSION
      </Button>
    </div>
  ) : (
    <div style={{ textAlign: "center" }}>
      Couldn't find session. This might be due to a wrong code or because the
      host has ended the session
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
