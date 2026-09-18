import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import path from "node:path";

const projectRoot = __dirname;

function parseFile(fileName: string) {
  try {
    return dotenv.parse(readFileSync(path.join(projectRoot, fileName)));
  } catch {
    return {};
  }
}

const base = parseFile(".env");
const local = parseFile(".env.local");

// Existing values supplied by hosting provider always win. Otherwise use a
// non-empty local value, falling back to the non-empty root .env value.
for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
  if (process.env[key] !== undefined && process.env[key] !== "") continue;
  const value = local[key]?.trim() !== "" ? local[key] : base[key];
  if (value?.trim()) process.env[key] = value;
}
