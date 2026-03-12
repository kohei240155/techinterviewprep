'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useQuestions } from '@/hooks/queries/useQuestions';
import { useExplainSession } from '@/hooks/useExplainSession';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useProgress, useProgressUpsert } from '@/hooks/queries/useProgress';
import { useFSRS } from '@/hooks/useFSRS';
import { t } from '@/lib/i18n';
import { feedbackRatingToResult } from '@/types';
import type { ExplainQuestion, SessionResult, PerQuestionResult, Progress } from '@/types';
import PromptCard from '@/components/explain/PromptCard';
import AnswerInput from '@/components/explain/AnswerInput';
import FeedbackPanel from '@/components/explain/FeedbackPanel';
import ResultsSummary from '@/components/explain/ResultsSummary';

interface ExplainSessionProps {
  topicId: string;
  questionIds?: string[];
}

const ExplainSession = ({ topicId, questionIds }: ExplainSessionProps) => {
  const { data: questions, isLoading, error } = useQuestions(topicId);
  const [state, dispatch] = useExplainSession();
  const { language } = useLanguage();
  const { user } = useAuth();
  const progressUpsert = useProgressUpsert();
  const { schedule } = useFSRS();
  const { data: progressData } = useProgress(user?.id);
  const questionStartRef = useRef<number>(Date.now());
  const [isFetching, setIsFetching] = useState(false);

  const progressMap = useMemo(() => {
    const map = new Map<string, Progress>();
    if (progressData) {
      for (const p of progressData as Progress[]) map.set(p.question_id, p);
    }
    return map;
  }, [progressData]);

  const explainQuestions = (questions ?? [])
    .filter((q): q is ExplainQuestion => q.type === 'explain')
    .filter((q) => !questionIds || questionIds.includes(q.id));

  useEffect(() => {
    if (explainQuestions.length > 0 && state.phase === 'playing' && state.questions.length === 0) {
      dispatch({ type: 'START_SESSION', payload: { questions: explainQuestions } });
    }
  }, [explainQuestions.length, state.phase, state.questions.length, dispatch]);

  useEffect(() => {
    if (state.phase === 'playing') {
      questionStartRef.current = Date.now();
    }
  }, [state.phase, state.currentIndex]);

  const handleSubmit = useCallback(
    (userAnswer: string) => {
      const timeSpent = Date.now() - questionStartRef.current;
      dispatch({
        type: 'SUBMIT_ANSWER',
        payload: { user_answer: userAnswer, time_spent_ms: timeSpent },
      });
    },
    [dispatch]
  );

  useEffect(() => {
    if (state.phase !== 'waiting') return;

    const currentQuestion = state.questions[state.currentIndex];
    const currentAnswer = state.answers[state.answers.length - 1];
    if (!currentQuestion || !currentAnswer) return;

    let cancelled = false;
    setIsFetching(true);

    const fetchFeedback = async () => {
      try {
        const response = await fetch('/api/ai/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: currentQuestion.id,
            user_answer: currentAnswer.user_answer,
            language,
          }),
        });

        if (!response.ok) throw new Error('Feedback request failed');

        const data = await response.json();
        if (!cancelled) {
          dispatch({
            type: 'RECEIVE_FEEDBACK',
            payload: { rating: data.rating, feedback: data.feedback },
          });
        }
      } catch (err) {
        console.error('Failed to fetch feedback:', err);
        if (!cancelled) {
          dispatch({
            type: 'RECEIVE_FEEDBACK',
            payload: { rating: 1, feedback: language === 'ja' ? 'フィードバックの取得に失敗しました。' : 'Failed to get feedback.' },
          });
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchFeedback();
    return () => { cancelled = true; };
  }, [state.phase, state.currentIndex, state.answers, state.questions, language, dispatch]);

  const handleNext = useCallback(() => {
    const lastAnswer = state.answers[state.answers.length - 1];
    if (lastAnswer?.feedback && user) {
      const rating = lastAnswer.feedback.rating;
      const result = feedbackRatingToResult(rating);
      const existingProgress = progressMap.get(lastAnswer.question_id) ?? null;
      const fsrsData = schedule(existingProgress, rating);

      progressUpsert.mutate({
        user_id: user.id,
        question_id: lastAnswer.question_id,
        result,
        answered_at: new Date().toISOString(),
        rating,
        ...fsrsData,
      });
    }

    dispatch({ type: 'NEXT_QUESTION' });
  }, [state.answers, user, schedule, progressUpsert, dispatch, progressMap]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RESET' });
    if (explainQuestions.length > 0) {
      dispatch({ type: 'START_SESSION', payload: { questions: explainQuestions } });
    }
  }, [dispatch, explainQuestions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading', language)}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">{t('common.error', language)}</p>
      </div>
    );
  }

  if (explainQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'ja'
            ? '口頭説明の問題がありません。'
            : 'No explanation questions available.'}
        </p>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentIndex];

  if (state.phase === 'results') {
    const perQuestion: PerQuestionResult[] = state.answers.map((a, i) => {
      const q = state.questions[i];
      return {
        question_id: a.question_id,
        question_ja: q.question_ja,
        question_en: q.question_en,
        type: q.type,
        difficulty: q.difficulty,
        result: a.result,
        time_spent_ms: a.time_spent_ms,
        user_answer: a.user_answer,
        feedback: a.feedback,
      };
    });

    const correctCount = perQuestion.filter((q) => q.result === 'correct').length;
    const wrongCount = perQuestion.filter((q) => q.result === 'wrong').length;

    const sessionResult: SessionResult = {
      topic_id: topicId,
      total_questions: state.questions.length,
      correct_count: correctCount,
      wrong_count: wrongCount,
      accuracy_percent: Math.round((correctCount / state.questions.length) * 100),
      total_time_ms: state.totalTime,
      per_question: perQuestion,
    };

    return (
      <ResultsSummary
        result={sessionResult}
        topicId={topicId}
        onRetry={handleRetry}
        language={language}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {state.currentIndex + 1} / {state.questions.length}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('explain.start', language)}
        </p>
      </div>

      {currentQuestion && (
        <PromptCard question={currentQuestion} language={language} />
      )}

      {state.phase === 'playing' && (
        <AnswerInput
          onSubmit={handleSubmit}
          disabled={false}
          language={language}
        />
      )}

      {state.phase === 'waiting' && (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <svg className="h-8 w-8 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'ja' ? 'AI がフィードバックを生成中...' : 'AI is generating feedback...'}
          </p>
        </div>
      )}

      {state.phase === 'feedback' && currentQuestion && (
        <>
          {state.answers[state.answers.length - 1]?.feedback && (
            <FeedbackPanel
              feedback={state.answers[state.answers.length - 1].feedback!}
              question={currentQuestion}
              language={language}
            />
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary px-6"
            >
              {state.currentIndex + 1 < state.questions.length
                ? t('quiz.next', language)
                : (language === 'ja' ? '結果を見る' : 'View Results')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExplainSession;
