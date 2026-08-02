"use client";
export default function Error() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Failed to load notifications</h2>
        <p className="text-sm text-muted-foreground mb-4">Something went wrong while loading your notifications.</p>
      </div>
    </div>
  );
}