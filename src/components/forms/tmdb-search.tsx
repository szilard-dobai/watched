"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TMDBSearchResult } from "@/types";

interface TMDBSearchProps {
  onSelect: (result: TMDBSearchResult) => void;
  className?: string;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w92";

const TMDBSearch = ({ onSelect, className }: TMDBSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelect = (result: TMDBSearchResult) => {
    onSelect(result);
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <Input
          placeholder="Search TMDB..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {hasSearched && (
        <div className="max-h-60 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          {results.length === 0 ? (
            <p className="p-3 text-center text-sm text-zinc-500">
              No results found
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {results.map((result) => {
                const title = result.title || result.name || "Unknown";
                const year = result.release_date?.substring(0, 4) ||
                  result.first_air_date?.substring(0, 4) ||
                  "";
                const type = result.media_type === "movie" ? "Movie" : "TV";

                return (
                  <li key={`${result.media_type}-${result.id}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(result)}
                      className="flex w-full items-center gap-3 p-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                        {result.poster_path ? (
                          <Image
                            src={`${TMDB_IMAGE_BASE}${result.poster_path}`}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-[8px] text-zinc-400">
                              N/A
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {type} {year && `• ${year}`}
                          {result.vote_average > 0 &&
                            ` • ⭐ ${result.vote_average.toFixed(1)}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export { TMDBSearch };
