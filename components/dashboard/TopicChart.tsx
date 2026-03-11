'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { TopicAccuracy, Language } from '@/types';
import { t } from '@/lib/i18n';

interface TopicChartProps {
  topicAccuracies: TopicAccuracy[];
  language: Language;
}

const TopicChart = ({ topicAccuracies, language }: TopicChartProps) => {
  const chartData = topicAccuracies.map((ta) => ({
    name: language === 'ja' ? ta.topic_name_ja : ta.topic_name_en,
    accuracy: ta.accuracy_percent,
    total: ta.total,
    correct: ta.correct,
  }));

  return (
    <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {language === 'ja' ? 'トピック別正答率' : 'Accuracy by Topic'}
      </h3>
      {chartData.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'ja' ? 'データがありません' : 'No data available'}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-30}
              textAnchor="end"
              height={80}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{
                value: `${t('quiz.accuracy', language)} (%)`,
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, t('quiz.accuracy', language)]}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Bar
              dataKey="accuracy"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopicChart;
