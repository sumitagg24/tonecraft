import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Driver adapters do their own pooling, so talk to the DIRECT Neon endpoint
  // (not the -pooler / PgBouncer endpoint). The pooler closes idle sockets and
  // drops connections when the free-tier compute suspends; pg.Pool then hands
  // Prisma a stale socket and it reports P1017 "Server has closed the
  // connection" on the first query after idle.
  const connectionString =
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    (() => {
      throw new Error("DIRECT_URL or DATABASE_URL environment variable is not set");
    })();

  const pool = new Pool({
    connectionString: normalizeSslMode(connectionString),
    max: 5,                       // well under Neon's direct-connection limit
    connectionTimeoutMillis: 10_000, // fail fast instead of hanging forever
    idleTimeoutMillis: 10_000,    // discard idle clients before the server closes them
    maxUses: 1000,                // recycle connections to avoid stale sockets
    // Neon requires SCRAM-SHA-256-PLUS; pg only reads this option at runtime,
    // never the `channel_binding` URL param, and its types don't expose it yet.
    ...({ enableChannelBinding: true } as Record<string, boolean>),
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/**
 * pg emits a noisy deprecation warning for sslmode=prefer|require|verify-ca
 * (it treats them as aliases of verify-full). Normalize to the explicit mode
 * so the warning never fires, regardless of what the shell/CI exports.
 */
function normalizeSslMode(url: string): string {
  return url.replace(/sslmode=(prefer|require|verify-ca)(?=&|$)/gi, "sslmode=verify-full");
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
