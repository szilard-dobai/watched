import { Film, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

const EmptyState = ({ onAddClick }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
      <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
        <Film className="h-6 w-6 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        No items yet
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Start tracking your movies and TV shows
      </p>
      <Button onClick={onAddClick} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Add Your First Item
      </Button>
    </div>
  );
};

export { EmptyState };
