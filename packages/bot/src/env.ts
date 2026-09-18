import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.resolve(packageRoot, "..", "..");

function parseFile(fileName: string) {
  try { return dotenv.parse(readFileSync(path.join(projectRoot, fileName))); } catch { return {}; }
}

const base = parseFile(".env");
const local = parseFile(".env.local");
for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
  if (process.env[key] !== undefined && process.env[key] !== "") continue;
  const value = local[key]?.trim() !== "" ? local[key] : base[key];
  if (value?.trim()) process.env[key] = value;
}
