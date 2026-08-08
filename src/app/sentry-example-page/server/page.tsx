/**
 * Sentry verification — server component that throws during render so the
 * onRequestError → captureRequestError pipeline is exercised end-to-end.
 *
 * `force-dynamic` opts this route out of static prerendering — otherwise the
 * throw would fail `next build` during export (it must throw at request time,
 * not at build time).
 */
export const dynamic = "force-dynamic";

export default function SentryExampleServerErrorPage() {
  throw new Error("Sentry Test Error (server component render)");
}
