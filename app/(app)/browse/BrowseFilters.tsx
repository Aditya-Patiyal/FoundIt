"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { CATEGORY_FILTERS, ZONES } from "@/lib/config";

// Search box + category chips + zone filter (README §8, screen 2).
// Updates the URL query; the server Browse page re-queries from it.
export default function BrowseFilters({
  q,
  category,
  zone,
}: {
  q: string;
  category: string;
  zone: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [text, setText] = useState(q);
  const firstRender = useRef(true);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "All") next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  // Debounce the free-text search so we don't push on every keystroke.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(() => setParam("q", text), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        inputMode="search"
        placeholder="Search found items…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Search found items"
        className="w-full rounded-btn border border-black/10 bg-surface px-3 py-2.5 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORY_FILTERS.map((c) => {
          const active = category === c || (c === "All" && !category);
          return (
            <button
              key={c}
              type="button"
              onClick={() => setParam("category", c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                active
                  ? "bg-primary text-white"
                  : "bg-surface text-muted ring-1 ring-black/10"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <select
        value={zone || "All"}
        onChange={(e) => setParam("zone", e.target.value)}
        aria-label="Filter by location"
        className="w-full rounded-btn border border-black/10 bg-surface px-3 py-2.5 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      >
        <option value="All">All locations</option>
        {ZONES.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>
    </div>
  );
}
