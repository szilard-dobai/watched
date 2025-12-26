import { ItemCard } from "./item-card";
import { EmptyState } from "./empty-state";
import type { WatchedItem } from "@/types";

interface ItemListProps {
  items: WatchedItem[];
  onEdit: (item: WatchedItem) => void;
  onDelete: (item: WatchedItem) => void;
  onAddClick: () => void;
}

const ItemList = ({ items, onEdit, onDelete, onAddClick }: ItemListProps) => {
  if (items.length === 0) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard
          key={item._id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export { ItemList };
