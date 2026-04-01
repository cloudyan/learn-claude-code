import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

let loaded = false;

export function loadRootEnv() {
  if (loaded) {
    return;
  }

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const rootEnvPath = path.resolve(currentDir, "../../.env");

  if (existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath, override: false });
  }

  loaded = true;
}
