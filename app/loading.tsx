// Global loading state — shown on initial page transitions
export default function Loading() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-orange rounded-full animate-spin" />
        <p className="font-mono text-label-sm uppercase tracking-widest text-ink/30">Loading</p>
      </div>
    </div>
  );
}
