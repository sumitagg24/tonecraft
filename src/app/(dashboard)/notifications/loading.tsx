export default function Loading() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="h-12 bg-muted/20 rounded-lg animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}