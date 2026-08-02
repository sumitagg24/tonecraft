"use client";
export default function Error() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Failed to load analytics</h2>
        <p className="text-sm text-muted-foreground">Something went wrong while loading your analytics data.</p>
      </div>
    </div>
  );
}