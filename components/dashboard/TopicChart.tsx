'use client';

import type { TopicAccuracy } from '@/types';

interface TopicChartProps {
  topicStats: TopicAccuracy[];
}

const TopicChart = ({ topicStats }: TopicChartProps) => {
  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold">トピック別正答率</h3>
      {/* TODO: Recharts BarChart */}
      <p className="text-gray-500">{topicStats.length} topics</p>
    </div>
  );
};

export default TopicChart;
