const crypto = require("crypto");
const chars = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  //"I", excluded as it's easily confused with another character
  "J",
  "K",
  //"L",
  "M",
  "N",
  //"O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  //"0",
  //"1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];
const characters = chars.join("");

const generateSessionCode = (length = 6) => {
  //308915776 possible combinations
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  return code;
};

const generateSecureHash = (P) => {
  // Generates a truly random, secure 16-character hex string
  const salt = crypto.randomBytes(8).toString("hex");
  const textToHash = `${P}-${salt}`;

  return crypto.createHash("sha256").update(textToHash).digest("hex");
};

module.exports = {
  generateSessionCode,
  generateSecureHash,
};
