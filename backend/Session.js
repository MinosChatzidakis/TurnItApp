const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },

    name: { type: String, default: "My Party" },

    host: {
      nickname: { type: String, required: true },
      hash: { type: String, required: true },
    },

    participants: [
      {
        nickname: { type: String, required: true },
        hash: { type: String, required: true },
      },
    ],

    suggestions: [
      {
        songId: { type: String, required: true },
        songTitle: { type: String, required: true },
        artists: { type: String, required: true },
        thumbnail: { type: String, required: true },
        suggestedByHash: { type: String, required: true }, //participant hash
        suggestedAt: { type: Date, default: Date.now }, //automatic timestamp
        score: { type: Number, default: 1 },
      },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Session", sessionSchema);
