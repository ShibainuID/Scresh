import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

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

const client = new Client({ connectionString: databaseUrl });

async function run() {
  await client.connect();

  try {
    for (const file of files) {
      const sql = readFileSync(file, "utf8");
      console.log(`Running ${file}...`);
      await client.query(sql);
      console.log(`Finished ${file}`);
    }
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
