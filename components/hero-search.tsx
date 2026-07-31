"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
      }}
      className="flex gap-2"
      role="search"
    >
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search AK-47, Doppler, Asiimov…"
        aria-label="Search skins"
        className="h-11"
      />
      <button
        type="submit"
        className="h-11 shrink-0 rounded-md bg-signal px-5 text-sm font-medium text-white hover:brightness-110 active:brightness-95"
      >
        Search
      </button>
    </form>
  );
}
