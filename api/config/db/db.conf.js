const mongoose = require("mongoose");

const db = mongoose.connection;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// disable buffering commands, why ? because we want to send the commands to the server immediately instead of waiting for the buffer to be full
mongoose.set("bufferCommands", false);

// connection event listeners to handle connection errors, disconnected and reconnected events
db.on("error", (err) => console.error("Database connection error: " + err));
db.on("disconnected", () => console.warn("Database disconnected"));
db.on("reconnected", () => console.log("Database reconnected"));

const connectDb = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) throw new Error("MONGODB_URI is not set");

  const maxRetries = 10;
  const retryDelay = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      console.log("Connected to MongoDB");
      return;
    } catch (error) {
      console.error(
        `Attempt ${attempt}/${maxRetries} failed: ${error.message}`,
      );

      if (attempt === maxRetries) {
        throw new Error(
          "Failed to connect to MongoDB after " + maxRetries + " attempts",
          { cause: error },
        );
      }
    }

    console.log("Retrying MongoDB connection in 5 seconds...");
    await sleep(retryDelay);
  }
};

module.exports = connectDb;
