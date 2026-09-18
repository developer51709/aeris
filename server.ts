import "./load-env.js";
import { spawn } from "node:child_process";
import { once } from "node:events";

const NODE_ENV = process.env.NODE_ENV ?? "development";
const PROD = NODE_ENV === "production";

function startProcess(name: string, args: string[]) {
  const child = spawn(process.execPath, args, {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, NODE_ENV },
    detached: false,
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start:`, error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    console.log(
      `[${name}] exited with code ${code ?? "null"}, signal ${signal ?? "null"}`,
    );
  });

  return child;
}

async function boot() {
  console.log(`Booting Aeris ${PROD ? "production" : "development"} server...`);

  if (PROD) {
    console.log("Starting API server...");
    const api = startProcess("api", ["dist/index.js"]);
    console.log("Starting Discord bot...");
    const bot = startProcess("bot", ["packages/bot/dist/index.js"]);

    // Keep the host process alive while either service is running. If one
    // service exits, terminate the other so the platform can restart both
    // together instead of leaving a dashboard without its bot.
    await Promise.race([once(api, "exit"), once(bot, "exit")]);
    console.log("Aeris service stopped; shutting down remaining services");
    api.kill("SIGTERM");
    bot.kill("SIGTERM");
    process.exit(1);
  } else {
    console.log("Starting API server (via tsx)...");
    const api = startProcess("api", ["--import", "tsx/esm", "./packages/api/src/index.ts"]);
    console.log("Starting Discord bot (via tsx)...");
    const bot = startProcess("bot", ["--import", "tsx/esm", "./packages/bot/src/index.ts"]);

    await Promise.race([once(api, "exit"), once(bot, "exit")]);
    console.log("Aeris service stopped; shutting down remaining services");
    api.kill("SIGTERM");
    bot.kill("SIGTERM");
    process.exit(1);
  }
}

boot().catch((error) => {
  console.error("Failed to boot server:", error);
  process.exit(1);
});
