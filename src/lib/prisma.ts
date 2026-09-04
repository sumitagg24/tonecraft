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
    process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    // Deferred: the client is only created on first use (see the lazy proxy
    // below), so merely importing this module never throws — even on builds
    // that run without the DB vars (Vercel Preview, GitHub Actions CI).
    throw new Error("DIRECT_URL or DATABASE_URL environment variable is not set");
  }

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

let localPrisma: PrismaClient | undefined;

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma ?? localPrisma;
  if (cached) return cached;
  const created = createPrismaClient();
  localPrisma = created;
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = created;
  return created;
}

/**
 * Lazy proxy — the PrismaClient (and its pg Pool) is only constructed on the
 * first property access, so module-scope imports never throw when the
 * database env vars are absent. `next build` evaluates route modules during
 * page-data collection; a hard throw at import used to break builds in
 * env-starved environments (Vercel Preview, CI). Runtime still fails fast on
 * the first real query. Method `this` binding is preserved via .bind().
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrisma();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
