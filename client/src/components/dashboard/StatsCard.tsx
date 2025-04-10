import { StatCard } from "@/lib/types";

interface StatsCardProps {
  stat: StatCard;
}

const StatsCard = ({ stat }: StatsCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{stat.title}</h3>
        <span className={`material-icons ${stat.iconColor}`}>{stat.icon}</span>
      </div>
      <p className="text-2xl font-semibold">{stat.value}</p>
      <div className="flex items-center mt-2 text-xs">
        <span className={`${stat.change >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
          <span className="material-icons text-sm">
            {stat.change >= 0 ? 'arrow_upward' : 'arrow_downward'}
          </span>
          {Math.abs(stat.change)}%
        </span>
        <span className="ml-2 text-text-muted">vs {stat.timeframe}</span>
      </div>
    </div>
  );
};

export default StatsCard;
