require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const mongoose = require("mongoose");
const app = require("./app");
const { connectDb } = require("./config/index");

const PORT = process.env.PORT || 3000;

let server;
let shuttingDown = false;
const SHUTDOWN_TIMEOUT = 25000;

const startServer = async () => {
  try {
    await connectDb();

    server = app.listen(PORT, () =>
      console.log(`Server is running on port ${PORT}`),
    );
  } catch (error) {
    console.error("Error starting server: ", error);
    process.exit(1);
  }
};

const shutDown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}. Shutting down...`);

  // Force exit if graceful shutdown hangs
  const timeout = setTimeout(() => {
    console.error("Graceful shutdown timed out. Force exiting...");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  timeout.unref();

  try {
    if (server) {
      console.log("[1] Closing HTTP server...");
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      console.log("[2] HTTP server closed");
    }

    console.log("[3] Disconnecting MongoDB...");
    await mongoose.disconnect();
    console.log("[4] MongoDB disconnected");


    clearTimeout(timeout);
    console.log("[5] Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error shutting down server: ", error);
    process.exit(1);
  }
};

process.on("SIGINT", async () => await shutDown("SIGINT"));
process.on("SIGTERM", async () => await shutDown("SIGTERM"));
process.on("SIGQUIT", async () => await shutDown("SIGQUIT"));

startServer();
