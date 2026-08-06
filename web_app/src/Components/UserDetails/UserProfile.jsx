import React, { useState } from "react";
import "./UserProfile.styles.css";

const UserProfile = () => {
  // Dummy data simulating a user and their suggestions
  const [userData] = useState({
    name: "Alex",
    suggestions: [
      { id: 1, title: "Bohemian Rhapsody - Queen", likes: 12 },
      { id: 2, title: "Stairway to Heaven - Led Zeppelin", likes: 8 },
      { id: 3, title: "Hotel California - The Eagles", likes: 15 },
      { id: 4, title: "Everlong - Foo Fighters", likes: 5 },
    ],
  });

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">{userData.name.charAt(0)}</div>
        <h2 className="profile-username">{userData.name}'s Suggestions</h2>
      </div>

      <div className="profile-list-container">
        {userData.suggestions.length > 0 ? (
          userData.suggestions.map((song) => (
            <div key={song.id} className="profile-card">
              <div className="profile-song-info">
                <h4 className="profile-song-title">{song.title}</h4>
              </div>
              <div className="profile-like-badge">
                <span className="profile-heart-icon">❤️</span>
                <span className="profile-like-count">{song.likes}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="profile-empty-state">No suggestions yet.</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
