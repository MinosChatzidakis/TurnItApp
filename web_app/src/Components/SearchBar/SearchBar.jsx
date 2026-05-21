import "./SearchBar.styles.css";

function SearchBar({
  placeholderText,
  query = "",
  setQuery,
  handleKeyDown = () => {},
  onButtonClick = () => {}, // Added a new prop for the button
}) {
  return (
    <div className="search-container">
      <input
        id="song-search"
        type="text"
        placeholder={placeholderText || "Type to search..."}
        value={query}
        onChange={(e) => setQuery?.(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button className="search-button" onClick={onButtonClick}>
        OK
      </button>
    </div>
  );
}

export default SearchBar;
