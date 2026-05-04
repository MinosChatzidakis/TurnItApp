import "./SearchBar.styles.css"

function SearchBar({placeholderText, query= '', setQuery, handleKeyDown = () => {}}) {

  return (
      <input 
        id="song-search"
        type="text"
        placeholder= {placeholderText || "Type to search..."}
        value={query}
        onChange={(e) => setQuery?.(e.target.value)}
        onKeyDown={handleKeyDown} //handle enter key press
      />
  );
}
export default SearchBar