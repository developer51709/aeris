import "dotenv/config";
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

    await once(api, "exit");
    console.log("API process stopped");
    process.exit(0);
  } else {
    console.log("Starting API server (via tsx)...");
    const api = startProcess("api", ["--import", "tsx/esm", "./packages/api/src/index.ts"]);

    await once(api, "exit");
    console.log("API process stopped");
    process.exit(0);
  }
}

boot().catch((error) => {
  console.error("Failed to boot server:", error);
  process.exit(1);
});
