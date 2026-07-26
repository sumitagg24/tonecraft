import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function NotFound() {
  return (
    <ErrorFallback
      title="Page not found"
      message="The page you are looking for does not exist or has been moved."
      showRetry={false}
    />
  );
}
