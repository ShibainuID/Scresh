import "server-only";

import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { screshPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for PostgreSQL access.");
  }

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

export class Database {
  private pool?: Pool;

  constructor(pool = globalForPg.screshPool) {
    this.pool = pool;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ) {
    return this.getPool().query<T>(text, values);
  }

  private getPool() {
    if (!this.pool) {
      this.pool = createPool();

      if (process.env.NODE_ENV !== "production") {
        globalForPg.screshPool = this.pool;
      }
    }

    return this.pool;
  }
}

export const db = new Database();
