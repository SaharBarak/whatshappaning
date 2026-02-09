"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface SearchFilters {
  query: string;
  categories: string[];
  confidence: string[];
  trend: string | null;
}

const EMPTY_FILTERS: SearchFilters = {
  query: "",
  categories: [],
  confidence: [],
  trend: null,
};

/**
 * URL-persisted search filters.
 * Reads/writes ?q=&cat=&conf=&trend= query params.
 */
export function useSearchFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: SearchFilters = useMemo(() => ({
    query: searchParams.get("q") ?? "",
    categories: searchParams.getAll("cat"),
    confidence: searchParams.getAll("conf"),
    trend: searchParams.get("trend"),
  }), [searchParams]);

  const setFilters = useCallback(
    (next: Partial<SearchFilters>) => {
      const merged = { ...filters, ...next };
      const params = new URLSearchParams();

      if (merged.query) params.set("q", merged.query);
      merged.categories.forEach((c) => params.append("cat", c));
      merged.confidence.forEach((c) => params.append("conf", c));
      if (merged.trend) params.set("trend", merged.trend);

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [filters, router, pathname]
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters = filters.query !== "" || filters.categories.length > 0 || filters.confidence.length > 0 || filters.trend !== null;

  return { filters, setFilters, clearFilters, hasActiveFilters, EMPTY_FILTERS };
}

/**
 * Filter a list of predictions client-side.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters<T extends Record<string, any>>(items: T[], filters: SearchFilters): T[] {
  let result = items;

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (Array.isArray(p.factors) ? p.factors : []).some((f: { name: string }) => f.name.toLowerCase().includes(q))
    );
  }

  if (filters.categories.length > 0) {
    result = result.filter((p) => filters.categories.includes(p.category as string));
  }

  if (filters.confidence.length > 0) {
    result = result.filter((p) => filters.confidence.includes(p.confidence as string));
  }

  if (filters.trend) {
    result = result.filter((p) => p.trend === filters.trend);
  }

  return result;
}
