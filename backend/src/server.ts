import { createApp } from "./app.js";
import { env } from "./shared/config/env.js";

const server = createApp().listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${env.PORT} is already in use. Start the backend with another port, for example: $env:PORT=3001; npm run dev`);
    process.exit(1);
  }
  throw error;
});
