'use client';

interface StatsOverviewProps {
  totalAnswered: number;
  accuracy: number;
  streak: number;
}

const StatsOverview = ({ totalAnswered, accuracy, streak }: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <p className="text-sm text-gray-500">総回答数</p>
        <p className="text-2xl font-bold">{totalAnswered}</p>
      </div>
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <p className="text-sm text-gray-500">正答率</p>
        <p className="text-2xl font-bold">{accuracy}%</p>
      </div>
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <p className="text-sm text-gray-500">連続学習日数</p>
        <p className="text-2xl font-bold">{streak}</p>
      </div>
    </div>
  );
};

export default StatsOverview;
