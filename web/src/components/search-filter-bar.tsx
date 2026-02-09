"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  TrendingUp,
  TrendingDown,
  Zap,
  Moon,
  Cloud,
  Sparkles,
  Activity,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SearchFilters } from "@/hooks/use-search-filters";

const CATEGORIES = [
  { value: "energy", label: "Energy", icon: Zap },
  { value: "sleep", label: "Sleep", icon: Moon },
  { value: "health", label: "Health", icon: Heart },
  { value: "mental", label: "Mental", icon: Sparkles },
  { value: "mood", label: "Mood", icon: Activity },
];

const CONFIDENCE_LEVELS = [
  { value: "very-high", label: "Very High", className: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
  { value: "high", label: "High", className: "bg-green-500/20 text-green-500 border-green-500/30" },
  { value: "medium", label: "Medium", className: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  { value: "low", label: "Low", className: "bg-red-500/20 text-red-500 border-red-500/30" },
];

const TRENDS = [
  { value: "up", label: "Trending Up", icon: TrendingUp },
  { value: "down", label: "Trending Down", icon: TrendingDown },
];

interface SearchFilterBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  totalCount: number;
}

export function SearchFilterBar({
  filters,
  onFiltersChange,
  onClear,
  hasActiveFilters,
  resultCount,
  totalCount,
}: SearchFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const toggleCategory = (cat: string) => {
    const current = filters.categories;
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    onFiltersChange({ categories: next });
  };

  const toggleConfidence = (conf: string) => {
    const current = filters.confidence;
    const next = current.includes(conf)
      ? current.filter((c) => c !== conf)
      : [...current, conf];
    onFiltersChange({ confidence: next });
  };

  const toggleTrend = (trend: string) => {
    onFiltersChange({ trend: filters.trend === trend ? null : trend });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xl mx-auto">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search predictions, factors, categories..."
            value={filters.query}
            onChange={(e) => onFiltersChange({ query: e.target.value })}
            className="pl-10 pr-10 h-12 text-base bg-card/50 border-border/50 backdrop-blur-sm"
            aria-label="Search predictions"
          />
          {filters.query && (
            <button
              onClick={() => {
                onFiltersChange({ query: "" });
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={filtersOpen ? "secondary" : "outline"}
          size="lg"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="gap-2 h-12 shrink-0"
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {filters.categories.length + filters.confidence.length + (filters.trend ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            id="filter-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm space-y-4">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                  Category
                </h3>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = filters.categories.includes(cat.value);
                    return (
                      <Button
                        key={cat.value}
                        variant={active ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(cat.value)}
                        className={cn("gap-1.5", active && "ring-2 ring-primary/30")}
                        aria-pressed={active}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        {cat.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Confidence */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                  Confidence
                </h3>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Confidence filters">
                  {CONFIDENCE_LEVELS.map((conf) => {
                    const active = filters.confidence.includes(conf.value);
                    return (
                      <Badge
                        key={conf.value}
                        variant="outline"
                        className={cn(
                          "cursor-pointer text-sm px-3 py-1 transition-all",
                          active ? conf.className : "opacity-50 hover:opacity-75",
                          active && "ring-2 ring-offset-1 ring-offset-background"
                        )}
                        onClick={() => toggleConfidence(conf.value)}
                        role="checkbox"
                        aria-checked={active}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleConfidence(conf.value);
                          }
                        }}
                      >
                        {conf.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Trend */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                  Trend
                </h3>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Trend filters">
                  {TRENDS.map((t) => {
                    const Icon = t.icon;
                    const active = filters.trend === t.value;
                    return (
                      <Button
                        key={t.value}
                        variant={active ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleTrend(t.value)}
                        className={cn("gap-1.5", active && "ring-2 ring-primary/30")}
                        aria-pressed={active}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        {t.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Clear + count */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  Showing {resultCount} of {totalCount} predictions
                </p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5">
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter pills (shown when panel is closed) */}
      {!filtersOpen && hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active:</span>
          {filters.categories.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => toggleCategory(cat)}
            >
              {cat}
              <X className="w-3 h-3" aria-hidden="true" />
            </Badge>
          ))}
          {filters.confidence.map((conf) => (
            <Badge
              key={conf}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => toggleConfidence(conf)}
            >
              {conf.replace("-", " ")}
              <X className="w-3 h-3" aria-hidden="true" />
            </Badge>
          ))}
          {filters.trend && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => toggleTrend(filters.trend!)}
            >
              {filters.trend === "up" ? "Trending Up" : "Trending Down"}
              <X className="w-3 h-3" aria-hidden="true" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClear} className="h-6 px-2 text-xs">
            Clear all
          </Button>
          <span className="text-sm text-muted-foreground ml-auto" aria-live="polite">
            {resultCount} / {totalCount}
          </span>
        </div>
      )}
    </div>
  );
}
