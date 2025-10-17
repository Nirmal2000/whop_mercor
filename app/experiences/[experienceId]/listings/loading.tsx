export default function ListingsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2" data-testid="listing-grid-loading">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-48 animate-pulse rounded-2xl bg-white/5"
        />
      ))}
    </div>
  );
}
