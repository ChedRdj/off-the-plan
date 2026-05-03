function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden bg-cream-alt border border-line animate-pulse">
      <div className="h-56 bg-navy/10" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3 w-24 bg-ink/10 rounded" />
        <div className="h-5 w-3/4 bg-ink/10 rounded" />
        <div className="h-3 w-1/2 bg-ink/10 rounded mt-auto" />
      </div>
    </div>
  );
}

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Filter bar skeleton */}
      <div className="sticky top-16 z-30 bg-white border-b border-line px-6 md:px-10 py-4">
        <div className="flex gap-3 animate-pulse">
          <div className="h-10 w-48 bg-ink/10 rounded" />
          <div className="h-10 w-32 bg-ink/10 rounded" />
          <div className="h-10 w-32 bg-ink/10 rounded" />
          <div className="h-10 w-24 bg-ink/10 rounded" />
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-10">
        {/* Result count skeleton */}
        <div className="h-4 w-32 bg-ink/10 rounded animate-pulse mb-8" />

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
