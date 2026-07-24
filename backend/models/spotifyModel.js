require("dotenv").config();

let cachedToken = null;
let tokenExpirationTime = null;

const getSpotifyToken = async () => {
  // 2. Check if we already have a token AND if the current time is before it expires
  if (cachedToken && Date.now() < tokenExpirationTime) {
    console.log("Using existing spotify token!");
    return cachedToken; // Skip the network request and instantly return the token!
  }

  console.log("Token expired or missing. Fetching a new one... ⏳");

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  // 3. Update our memory with the new token
  cachedToken = data.access_token;

  // 4. Calculate the expiration time.
  // We multiply by 1000 to get milliseconds, and subtract 1 minute (60,000ms) just to be safe!
  tokenExpirationTime = Date.now() + data.expires_in * 1000 - 60000;

  return cachedToken;
};

// 2. Search Tracks
const searchTracks = async (query) => {
  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) throw new Error("Spotify API error");

  return await response.json();
};

module.exports = {
  searchTracks,
};
