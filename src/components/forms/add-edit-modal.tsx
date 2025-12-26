"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { StarRating } from "@/components/ui/star-rating";
import { TMDBSearch } from "./tmdb-search";
import { STATUS_OPTIONS, TYPE_OPTIONS, PLATFORMS } from "@/lib/constants";
import type {
  WatchedItem,
  WatchedItemFormData,
  TMDBSearchResult,
  WatchStatus,
  MediaType,
} from "@/types";

interface AddEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: WatchedItem | null;
  onSave: (data: WatchedItemFormData) => Promise<void>;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w185";

const getInitialFormData = (): WatchedItemFormData => ({
  title: "",
  type: "movie",
  status: "want_to_watch",
  platform: "",
  tmdbId: undefined,
  posterPath: null,
  description: "",
  tmdbRating: undefined,
  genres: [],
  duration: undefined,
  seasons: undefined,
  userRating: undefined,
  startDate: undefined,
  endDate: undefined,
  notes: "",
});

const AddEditModal = ({
  open,
  onOpenChange,
  item,
  onSave,
}: AddEditModalProps) => {
  const [formData, setFormData] = useState<WatchedItemFormData>(
    getInitialFormData()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        type: item.type,
        status: item.status,
        platform: item.platform,
        tmdbId: item.tmdbId,
        posterPath: item.posterPath,
        description: item.description,
        tmdbRating: item.tmdbRating,
        genres: item.genres,
        duration: item.duration,
        seasons: item.seasons,
        userRating: item.userRating,
        startDate: item.startDate,
        endDate: item.endDate,
        notes: item.notes,
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [item, open]);

  const handleTMDBSelect = (result: TMDBSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      title: result.title || result.name || prev.title,
      type: result.media_type === "movie" ? "movie" : "tv_show",
      tmdbId: result.id,
      posterPath: result.poster_path,
      description: result.overview,
      tmdbRating: result.vote_average,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof WatchedItemFormData>(
    field: K,
    value: WatchedItemFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TMDBSearch onSelect={handleTMDBSelect} />

          <div className="flex gap-4">
            {formData.posterPath && (
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded">
                <Image
                  src={`${TMDB_IMAGE_BASE}${formData.posterPath}`}
                  alt={formData.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <Input
                placeholder="Title *"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={formData.type}
                  onValueChange={(v) => updateField("type", v as MediaType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.status}
                  onValueChange={(v) => updateField("status", v as WatchStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Select
            value={formData.platform || ""}
            onValueChange={(v) => updateField("platform", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Your Rating
            </label>
            <StarRating
              rating={formData.userRating || 0}
              onRatingChange={(r) => updateField("userRating", r)}
              size="lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Start Date</label>
              <DatePicker
                date={
                  formData.startDate
                    ? new Date(formData.startDate + "T12:00:00")
                    : undefined
                }
                onDateChange={(d) =>
                  updateField(
                    "startDate",
                    d
                      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                      : undefined
                  )
                }
                placeholder="Start date"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">End Date</label>
              <DatePicker
                date={
                  formData.endDate
                    ? new Date(formData.endDate + "T12:00:00")
                    : undefined
                }
                onDateChange={(d) =>
                  updateField(
                    "endDate",
                    d
                      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                      : undefined
                  )
                }
                placeholder="End date"
              />
            </div>
          </div>

          {formData.type === "tv_show" && (
            <Input
              type="number"
              placeholder="Number of seasons"
              value={formData.seasons || ""}
              onChange={(e) =>
                updateField(
                  "seasons",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              min={1}
            />
          )}

          <textarea
            placeholder="Notes (optional)"
            value={formData.notes || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? "Saving..." : item ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { AddEditModal };
