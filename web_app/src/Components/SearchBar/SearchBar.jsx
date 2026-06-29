import "./SearchBar.styles.css";

function SearchBar({
  children,
  placeholderText,
  query = "",
  setQuery = () => {},
  handleKeyDown = () => {},
  onButtonClick = () => {},
  readOnly = false,
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
        readOnly={readOnly}
      />
      {/* only show the OK button if the user can edit the searchfield contents */}
      {!readOnly && (
        <button className="search-button" onClick={onButtonClick}>
          OK
        </button>
      )}
      {children}
    </div>
  );
}

export default SearchBar;
