export const generateSecureHash = async (P) => {
  const salt = Math.random().toString(36).substring(2, 15); // add salt to the plaintext
  const textToHash = `${P}-${salt}`; // merge them

  const encoder = new TextEncoder();
  const data = encoder.encode(textToHash); //convert text to bytes -- useful for hashing
  const hashBuffer = await crypto.subtle.digest("SHA-256", data); //convert with SHA-256 algorithm

  const hashArray = Array.from(new Uint8Array(hashBuffer)); //convert memory buffer to numbers

  /* Take that raw memory, chop it up into 8-bit chunks (bytes), and read each chunk as a standard number between 0 and 255. So, instead of looking at 0100100001100101, we now get [72, 101, ... ]*/

  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0")) //convert each character to 2-character hex
    .join(""); //join all characters => 64-character string

  return hashHex;
};
