'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Question, QuestionType, Difficulty } from '@/types';
import { useCategories } from '@/hooks/queries/useCategories';
import { useLanguage } from '@/hooks/useLanguage';
import QuestionEditor from './QuestionEditor';
import type { GeneratedQuestion } from '@/types';

interface QuestionsResponse {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
}

const QuestionList = () => {
  const { language } = useLanguage();
  const { data: categories } = useCategories();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterTopicId, setFilterTopicId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (filterTopicId) params.set('topic_id', filterTopicId);
      if (filterType) params.set('type', filterType);
      if (filterDifficulty) params.set('difficulty', filterDifficulty);

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to fetch questions');
      }
      const data: QuestionsResponse = await res.json();
      setQuestions(data.questions);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filterTopicId, filterType, filterDifficulty]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleUpdate = async (id: string, updated: GeneratedQuestion) => {
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Update failed');
      }
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ja' ? 'この問題を削除しますか？' : 'Delete this question?')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Delete failed');
      }
      fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const typeLabels: Record<string, string> = {
    multiple: language === 'ja' ? '選択式' : 'MC',
    code: language === 'ja' ? 'コード' : 'Code',
    truefalse: 'T/F',
    explain: language === 'ja' ? '説明' : 'Explain',
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterTopicId}
          onChange={(e) => { setFilterTopicId(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">{language === 'ja' ? '全トピック' : 'All Topics'}</option>
          {categories?.map((cat) =>
            (cat.topics as { id: string; name_ja: string; name_en: string }[])?.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {language === 'ja' ? topic.name_ja : topic.name_en}
              </option>
            ))
          )}
        </select>

        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">{language === 'ja' ? '全タイプ' : 'All Types'}</option>
          {(['multiple', 'code', 'truefalse', 'explain'] as QuestionType[]).map((t) => (
            <option key={t} value={t}>{typeLabels[t]}</option>
          ))}
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => { setFilterDifficulty(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">{language === 'ja' ? '全難易度' : 'All Difficulties'}</option>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {language === 'ja' ? '読み込み中...' : 'Loading...'}
        </div>
      )}

      {/* Questions table */}
      {!isLoading && questions.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {language === 'ja' ? '問題が見つかりません' : 'No questions found'}
        </div>
      )}

      {!isLoading && questions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  {language === 'ja' ? 'タイプ' : 'Type'}
                </th>
                <th className="py-2 pr-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  {language === 'ja' ? '難易度' : 'Diff'}
                </th>
                <th className="py-2 pr-3 text-left font-medium text-gray-600 dark:text-gray-400">
                  {language === 'ja' ? '問題文' : 'Question'}
                </th>
                <th className="py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                  {language === 'ja' ? '操作' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-gray-100 dark:border-gray-800">
                  {editingId === q.id ? (
                    <td colSpan={4} className="py-3">
                      <QuestionEditor
                        question={{
                          type: q.type,
                          difficulty: q.difficulty,
                          question_ja: q.question_ja,
                          question_en: q.question_en,
                          options: q.options,
                          answer: q.answer,
                          explanation_ja: q.explanation_ja,
                          explanation_en: q.explanation_en,
                        }}
                        onChange={(updated) => handleUpdate(q.id, updated)}
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            const editorQ: GeneratedQuestion = {
                              type: q.type,
                              difficulty: q.difficulty,
                              question_ja: q.question_ja,
                              question_en: q.question_en,
                              options: q.options,
                              answer: q.answer,
                              explanation_ja: q.explanation_ja,
                              explanation_en: q.explanation_en,
                            };
                            handleUpdate(q.id, editorQ);
                          }}
                          className="rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                        >
                          {language === 'ja' ? '保存' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          {language === 'ja' ? 'キャンセル' : 'Cancel'}
                        </button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="py-2 pr-3">
                        <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-300">
                          {typeLabels[q.type]}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{q.difficulty}</td>
                      <td className="py-2 pr-3 text-gray-800 dark:text-gray-200 max-w-md truncate">
                        {language === 'ja' ? q.question_ja : q.question_en}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => setEditingId(q.id)}
                          className="mr-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          {language === 'ja' ? '編集' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingId === q.id}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
                        >
                          {language === 'ja' ? '削除' : 'Delete'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'ja'
              ? `${total} 件中 ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} 件`
              : `${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {language === 'ja' ? '前へ' : 'Prev'}
            </button>
            <span className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {language === 'ja' ? '次へ' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionList;
