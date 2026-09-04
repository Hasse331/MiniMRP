import process from "node:process";
import {
  findAvailablePort,
  spawnProcess
} from "../desktop/scripts/runtime-helpers.mjs";

const preferredPort = Number(process.env.MINIMRP_WEB_PORT ?? "3000");
const port = await findAvailablePort(preferredPort);
const webUrl = `http://127.0.0.1:${port}`;

if (port !== preferredPort) {
  console.log(`Web dev port ${preferredPort} was busy, using ${port} instead.`);
}

console.log(`MiniMRP SQLite web development: ${webUrl}`);

const nextProcess = spawnProcess(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "dev:next", "--", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    MINIMRP_RUNTIME: "sqlite",
    NEXT_PUBLIC_MINIMRP_RUNTIME: "sqlite"
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
