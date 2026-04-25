import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.MINIMRP_DESKTOP_PORT ?? "3001");
const desktopUrl = `http://127.0.0.1:${port}`;

function spawnProcess(command, args, extraEnv = {}) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      ...extraEnv
    }
  });
}

async function waitForServer(url, attempts = 120) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

const nextProcess = spawnProcess(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    MINIMRP_RUNTIME: "sqlite"
  }
);

const shutdown = () => {
  if (!nextProcess.killed) {
    nextProcess.kill();
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

nextProcess.on("exit", (code) => {
  process.exit(code ?? 0);
});

await waitForServer(`${desktopUrl}/login`);

const electronProcess = spawnProcess(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["electron", "desktop/electron/main.mjs"],
  {
    MINIMRP_RUNTIME: "sqlite",
    MINIMRP_DESKTOP_URL: desktopUrl
  }
);

electronProcess.on("exit", (code) => {
  shutdown();
  process.exit(code ?? 0);
});
