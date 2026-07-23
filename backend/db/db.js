const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // This will now pull your local URI from the .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Local MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
