function ArticleCardSkeleton({ large }: { large?: boolean }) {
  return (
    <div className={`flex flex-col gap-3 animate-pulse ${large ? "md:col-span-1" : ""}`}>
      <div className={`bg-ink/10 ${large ? "h-64" : "h-40"}`} />
      <div className="h-3 w-20 bg-ink/10 rounded" />
      <div className="h-5 w-3/4 bg-ink/10 rounded" />
      <div className="h-3 w-full bg-ink/10 rounded" />
      <div className="h-3 w-2/3 bg-ink/10 rounded" />
    </div>
  );
}

export default function JournalLoading() {
  return (
    <div className="min-h-screen bg-cream-alt pt-24 pb-20">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10">
        {/* Header skeleton */}
        <div className="mb-12 animate-pulse">
          <div className="h-3 w-32 bg-ink/10 rounded mb-4" />
          <div className="h-10 w-2/3 bg-ink/10 rounded" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ArticleCardSkeleton large />
          <div className="md:col-span-2 flex flex-col gap-6">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
