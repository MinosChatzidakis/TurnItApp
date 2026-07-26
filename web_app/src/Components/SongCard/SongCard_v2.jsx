import React from "react";
import "./SongCard_v2.styles.css";
import {
  FaThumbsDown as ThumbsDown,
  FaThumbsUp as ThumbsUp,
} from "react-icons/fa";

const LeaderboardCard = ({
  song = {},
  onClick = () => console.log("no event handler given"),
  onLike = () => console.log("no event handler given"),
  onDislike = () => console.log("no event handler given"),
  liked = null,
  disliked = null,
  rank,
}) => {
  return (
    <div className="leaderboard-card" onClick={onClick}>
      {/* 1. Optional Rank Number on the far left */}
      {rank && <h3 className="leaderboard-rank">#{rank}</h3>}

      {/* 2. Smaller thumbnail image */}
      <img
        src={song.thumbnail}
        alt={`${song.title} cover`}
        className="leaderboard-image"
      />

      {/* 3. Song Info (This will stretch to push the icons to the right) */}
      <div className="leaderboard-info">
        <h4 className="leaderboard-title">{song.title || song.songTitle}</h4>{" "}
        {/* take both naming possibilities into consideration */}
        <p className="leaderboard-artist">{song.artists}</p>
      </div>

      {/* 4. Score and Icons grouped on the far right */}
      <div className="leaderboard-actions">
        {typeof song.score === "number" && (
          <h4 className="leaderboard-score">{song.score}</h4>
        )}

        {liked !== null && (
          <ThumbsUp
            color={
              liked ? "#1DB954" : "grey"
            } /* Changed to Spotify Green for fun! */
            className="action-icon"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
          />
        )}

        {disliked !== null && (
          <ThumbsDown
            color={disliked ? "#e22134" : "grey"} /* Red for dislike */
            className="action-icon"
            onClick={(e) => {
              e.stopPropagation();
              onDislike?.();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default LeaderboardCard;
