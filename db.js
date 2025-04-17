const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Atlas connected!");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1); // optional: stop app if DB fails
  }
};

module.exports = connectDB;
