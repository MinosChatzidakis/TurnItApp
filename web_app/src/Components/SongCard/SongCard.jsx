import React from 'react';
import './SongCard.styles.css';
import { FaThumbsDown as ThumbsDown } from 'react-icons/fa';
import { FaThumbsUp as ThumbsUp } from 'react-icons/fa';
import { RiGhost2Fill } from 'react-icons/ri';

const SongCard= ({ song, onClick, onLike, onDislike, liked, disliked }) => {
  const artistNames = song.artists ? song.artists.join(', ') : 'Unknown Artist';

  return (
    <div className="song-card" onClick={onClick}>
      
      
        <div className="song-image-container">
        <img src={song.thumbnail} alt={`${song.title} cover`} className="song-card-image" />
        
        {/*         
            <div className="play-btn">
            ▶
            </div>
        */}       
        </div>
      
      <div className="song-card-info">
        <h4 className="song-card-title">{song.title}</h4>
        <p className="song-card-artist">{artistNames}</p>
        <div className="icons-container">
           <h4 className="score">
                {song.score}
           </h4>
           <ThumbsUp color={ liked ? "blue" : "grey" } style={{ marginRight: '10px' }} 
            onClick={
                (e) => {
                e.stopPropagation()
                onLike?.()}
            }    
            />

           <ThumbsDown color={ disliked ? "blue" : "grey" } style={{ marginLeft: '5px' }}
            onClick={
                (e) => {
                e.stopPropagation(); 
                onDislike?.()}
            }
            />

        </div>
      </div>
    </div>
  );
}

export default SongCard
