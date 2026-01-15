import { Skeleton } from "@/components/ui/skeleton";

export function CustomersTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4">
          <Skeleton className="h-6 col-span-2" />
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
          <Skeleton className="h-6" />
        </div>
      ))}
    </div>
  );
}
