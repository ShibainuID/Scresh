import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

for (const envFile of [".env.local", ".env"]) {
  if (!existsSync(envFile)) {
    continue;
  }

  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

const command = process.argv[2];
const databaseUrl = process.env.DATABASE_URL;

const filesByCommand = {
  migrate: ["db/schema.sql"],
  seed: ["db/seed.sql"],
  reset: ["db/schema.sql", "db/seed.sql"],
};

const files = filesByCommand[command];

if (!files) {
  console.error("Usage: node scripts/db.mjs <migrate|seed|reset>");
  process.exit(1);
}

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

for (const file of files) {
  const result = spawnSync("psql", [databaseUrl, "-f", file], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
