export default function AccountLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="skeleton h-10 w-64" />
      <div className="skeleton h-4 w-40" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
      <div className="skeleton mt-6 h-48" />
    </div>
  );
}
