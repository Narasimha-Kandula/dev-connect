export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <div className="space-y-8">
        <div className="mx-auto h-12 w-3/4 animate-pulse rounded-lg bg-muted/30" />
        <div className="mx-auto h-6 w-1/2 animate-pulse rounded-lg bg-muted/20" />
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/20" />
          ))}
        </div>
      </div>
    </div>
  );
}
