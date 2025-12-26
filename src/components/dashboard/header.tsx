import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onAddClick: () => void;
}

const Header = ({ onAddClick }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Watch List
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track your movies and TV shows
        </p>
      </div>
      <Button onClick={onAddClick}>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </header>
  );
};

export { Header };
