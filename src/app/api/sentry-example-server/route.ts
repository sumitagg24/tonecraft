/**
 * Sentry verification — plain route handler that throws so the error escapes
 * to Next.js and fires the onRequestError hook (route-handler path).
 */
export async function GET() {
  throw new Error("Sentry Test Error (API route)");
}
