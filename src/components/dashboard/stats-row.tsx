import { Film, Tv, CheckCircle, PlayCircle, Star } from "lucide-react";
import { StatCard } from "./stat-card";
import type { WatchStats } from "@/types";

interface StatsRowProps {
  stats: WatchStats;
}

const StatsRow = ({ stats }: StatsRowProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        title="Movies"
        value={stats.totalMovies}
        icon={<Film className="h-5 w-5" />}
      />
      <StatCard
        title="TV Shows"
        value={stats.totalTvShows}
        icon={<Tv className="h-5 w-5" />}
      />
      <StatCard
        title="Completed"
        value={stats.completedCount}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatCard
        title="Watching"
        value={stats.watchingCount}
        icon={<PlayCircle className="h-5 w-5" />}
      />
      <StatCard
        title="Avg Rating"
        value={stats.averageRating !== null ? stats.averageRating.toFixed(1) : "-"}
        icon={<Star className="h-5 w-5" />}
        className="col-span-2 sm:col-span-1"
      />
    </div>
  );
};

export { StatsRow };
