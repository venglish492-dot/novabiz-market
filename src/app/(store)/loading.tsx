export default function Loading() {
  return (
    <div className="container-page py-12" aria-busy="true" aria-live="polite">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-6 h-12 w-2/3 max-w-xl" />
      <div className="skeleton mt-4 h-5 w-1/2 max-w-md" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}
