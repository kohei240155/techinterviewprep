'use client';

import { useCategories } from '@/hooks/queries/useCategories';
import { useLanguage } from '@/hooks/useLanguage';
import type { Language } from '@/types';

interface InputStepProps {
  topicId: string;
  content: string;
  onTopicChange: (id: string) => void;
  onContentChange: (content: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const getLocalizedName = (item: { name_ja: string; name_en: string }, language: Language) => {
  return language === 'ja' ? item.name_ja : item.name_en;
};

const InputStep = ({
  topicId,
  content,
  onTopicChange,
  onContentChange,
  onAnalyze,
  isLoading,
}: InputStepProps) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="topic-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {language === 'ja' ? 'トピックを選択' : 'Select Topic'}
        </label>
        {categoriesLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'ja' ? '読み込み中...' : 'Loading...'}
          </div>
        ) : (
          <select
            id="topic-select"
            value={topicId}
            onChange={(e) => onTopicChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">
              {language === 'ja' ? '-- トピックを選択 --' : '-- Select a topic --'}
            </option>
            {categories?.map((category) => (
              <optgroup
                key={category.id}
                label={getLocalizedName(category, language)}
              >
                {(category.topics as { id: string; name_ja: string; name_en: string }[])?.map(
                  (topic) => (
                    <option key={topic.id} value={topic.id}>
                      {getLocalizedName(topic, language)}
                    </option>
                  )
                )}
              </optgroup>
            ))}
          </select>
        )}
      </div>

      <div>
        <label
          htmlFor="content-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {language === 'ja'
            ? '補足コンテンツ (任意)'
            : 'Additional Content (optional)'}
        </label>
        <textarea
          id="content-input"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={6}
          placeholder={
            language === 'ja'
              ? '問題生成の参考にしたいテキストを入力してください...'
              : 'Enter text to use as reference for question generation...'
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      <button
        onClick={onAnalyze}
        disabled={!topicId || isLoading}
        className="w-full rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? language === 'ja'
            ? '分析中...'
            : 'Analyzing...'
          : language === 'ja'
            ? '分析する'
            : 'Analyze'}
      </button>
    </div>
  );
};

export default InputStep;
