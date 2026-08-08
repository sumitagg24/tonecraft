/**
 * Sentry verification — server component that throws during render so the
 * onRequestError → captureRequestError pipeline is exercised end-to-end.
 */
export default function SentryExampleServerErrorPage() {
  throw new Error("Sentry Test Error (server component render)");
}
