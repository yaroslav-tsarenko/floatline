"use client";

import { useState, useTransition, type ReactNode } from "react";

import { loadMoreItems } from "@/app/catalog/actions";
import { Button } from "@/components/ui/button";

export function LoadMore({
  query,
  initialCursor,
}: {
  query: string;
  initialCursor: string | null;
}) {
  const [pages, setPages] = useState<ReactNode[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [pending, startTransition] = useTransition();

  if (!cursor) return null;

  function onClick() {
    const current = cursor;
    if (!current) return;
    startTransition(async () => {
      const { nodes, nextCursor } = await loadMoreItems(query, current);
      setPages((prev) => [...prev, nodes]);
      setCursor(nextCursor);
    });
  }

  return (
    <>
      {pages.length > 0 && (
        <div className="col-span-full grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pages}
        </div>
      )}
      <div className="col-span-full flex justify-center py-6">
        <Button variant="secondary" onClick={onClick} loading={pending}>
          {pending ? "Loading" : "Load more"}
        </Button>
      </div>
    </>
  );
}
