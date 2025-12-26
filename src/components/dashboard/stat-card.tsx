import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

const StatCard = ({ title, value, icon, className }: StatCardProps) => {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {value}
            </p>
          </div>
          {icon && (
            <div className="text-zinc-400 dark:text-zinc-500">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { StatCard };
