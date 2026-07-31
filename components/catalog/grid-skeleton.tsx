import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export function GridSkeleton({ count = 15 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <Surface key={i} className="space-y-2 p-3">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-1 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </Surface>
      ))}
    </div>
  );
}
