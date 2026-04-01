import React from 'react';

interface StatCard {
  title: string;
  value: number | string;
}

interface StatsCardsProps {
  stats: StatCard[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={`${stat.title}-${index}`}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 border-l-4 border-l-green-600"
        >
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            {stat.title}
          </h3>
          <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 leading-none">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
