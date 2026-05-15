export const Skeleton = ({ className = "" }) => <div className={`animate-pulse rounded-2xl bg-black/10 dark:bg-white/10 ${className}`} />;

export const TableSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-12 w-full" />
    {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
  </div>
);
