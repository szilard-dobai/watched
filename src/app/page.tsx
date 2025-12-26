"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/dashboard/header";
import { StatsRow } from "@/components/dashboard/stats-row";
import { SearchFilters } from "@/components/dashboard/search-filters";
import { ItemList } from "@/components/dashboard/item-list";
import { AddEditModal } from "@/components/forms/add-edit-modal";
import type {
  WatchedItem,
  WatchedItemFormData,
  WatchStats,
  FilterState,
} from "@/types";

const MOCK_ITEMS: WatchedItem[] = [];

const Home = () => {
  const [items, setItems] = useState<WatchedItem[]>(MOCK_ITEMS);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    type: "all",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchedItem | null>(null);

  const stats: WatchStats = useMemo(() => {
    const totalMovies = items.filter((i) => i.type === "movie").length;
    const totalTvShows = items.filter((i) => i.type === "tv_show").length;
    const completedCount = items.filter((i) => i.status === "completed").length;
    const watchingCount = items.filter((i) => i.status === "watching").length;
    const ratings = items
      .filter((i) => i.userRating !== undefined && i.userRating > 0)
      .map((i) => i.userRating!);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    return {
      totalMovies,
      totalTvShows,
      completedCount,
      watchingCount,
      averageRating,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        filters.search &&
        !item.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.status !== "all" && item.status !== filters.status) {
        return false;
      }
      if (filters.type !== "all" && item.type !== filters.type) {
        return false;
      }
      return true;
    });
  }, [items, filters]);

  const handleAddClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: WatchedItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: WatchedItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setItems((prev) => prev.filter((i) => i._id !== item._id));
  };

  const handleSave = async (data: WatchedItemFormData) => {
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i._id === editingItem._id
            ? { ...i, ...data, updatedAt: new Date().toISOString() }
            : i
        )
      );
    } else {
      const newItem: WatchedItem = {
        _id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <Header onAddClick={handleAddClick} />
          <StatsRow stats={stats} />
          <SearchFilters filters={filters} onFiltersChange={setFilters} />
          <ItemList
            items={filteredItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddClick={handleAddClick}
          />
        </div>
      </div>

      <AddEditModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={editingItem}
        onSave={handleSave}
      />
    </div>
  );
};

export default Home;
