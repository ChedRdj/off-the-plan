export default function DevelopmentLoading() {
  return (
    <div className="min-h-screen bg-cream animate-pulse">
      {/* Hero skeleton */}
      <div className="relative h-[70vh] bg-navy/20" />

      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Content skeleton */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="h-4 w-32 bg-ink/10 rounded" />
            <div className="h-10 w-3/4 bg-ink/10 rounded" />
            <div className="h-4 w-full bg-ink/10 rounded" />
            <div className="h-4 w-full bg-ink/10 rounded" />
            <div className="h-4 w-2/3 bg-ink/10 rounded" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-ink/10 rounded" />
              ))}
            </div>
          </div>

          {/* Enquiry card skeleton */}
          <div className="lg:col-span-1">
            <div className="h-96 bg-ink/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
