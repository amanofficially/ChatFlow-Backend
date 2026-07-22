// ============================================================
// server.js — the actual process entry point.
// Order matters: env config loads first (it validates and exits
// early if something required is missing), then everything else.
// ============================================================
import "./config/env.js";

import { createServer } from "http";
import { Server } from "socket.io";

import { env } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { setupSocket } from "./socket/index.js";
import { registerIO } from "./socket/ioRegistry.js";

async function start() {
  await connectDB();

  const app = createApp();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: corsOptions,
    // Client starts on polling and upgrades — avoids the "WebSocket closed
    // before connection established" race on slow/cold-starting hosts.
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 15000,
    allowUpgrades: true,
    maxHttpBufferSize: 1e7, // generous buffer for slow connections
  });

  registerIO(io);
  setupSocket(io);

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

start();
