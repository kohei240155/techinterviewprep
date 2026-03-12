'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useQuizSession } from '@/hooks/useQuizSession';
import { useMultiTopicQuestions } from '@/hooks/queries/useMultiTopicQuestions';
import { useReviewItems } from '@/hooks/queries/useReviewItems';
import { useProgress, useProgressUpsert } from '@/hooks/queries/useProgress';
import { useFSRS } from '@/hooks/useFSRS';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import { quizResultToRating } from '@/types';
import type { Question, QuizMode, QuestionCount, ProgressResult, SessionResult, Difficulty, QuizQuestionType } from '@/types';
import QuestionCard from './QuestionCard';
import ResultsSummary from './ResultsSummary';

interface QuizSessionProps {
  topicIds: string[];
  initialMode?: QuizMode;
  initialCount?: QuestionCount;
  difficulties?: Difficulty[];
  questionTypes?: QuizQuestionType[];
  unansweredOnly?: boolean;
  skipSetup?: boolean;
}

const QUESTION_COUNTS: QuestionCount[] = [5, 10, 15, 20, 'all'];

const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const QuizSession = ({ topicIds, initialMode, initialCount, difficulties, questionTypes, unansweredOnly, skipSetup }: QuizSessionProps) => {
  const [state, dispatch] = useQuizSession();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { data: allQuestions, isLoading: questionsLoading, error: questionsError } = useMultiTopicQuestions(topicIds);
  const { data: reviewItems } = useReviewItems(user?.id);
  const { data: progressData } = useProgress(unansweredOnly ? user?.id : undefined);
  const progressUpsert = useProgressUpsert();
  const { schedule } = useFSRS();

  const [selectedMode, setSelectedMode] = useState<QuizMode>(initialMode ?? 'new');
  const [selectedCount, setSelectedCount] = useState<QuestionCount>(initialCount ?? 10);
  const questionStartTime = useRef<number>(Date.now());
  const hasAutoStarted = useRef(false);

  const handleStart = useCallback((): void => {
    let pool: Question[];
    if (selectedMode === 'review' && reviewItems) {
      const topicIdSet = new Set(topicIds);
      const reviewQuestionIds = new Set(
        reviewItems
          .filter((item) => {
            const q = item.questions as unknown as Question | null;
            return q && (topicIds.length === 0 || topicIdSet.has(q.topic_id));
          })
          .map((item) => {
            const q = item.questions as unknown as Question;
            return q.id;
          })
      );
      // For review mode, use questions from reviewItems directly
      const reviewQuestions = reviewItems
        .filter((item) => {
          const q = item.questions as unknown as Question | null;
          return q && reviewQuestionIds.has(q.id);
        })
        .map((item) => item.questions as unknown as Question);
      pool = reviewQuestions;
    } else {
      if (!allQuestions) return;
      const diffSet = difficulties ? new Set(difficulties) : null;
      const typeSet = questionTypes ? new Set(questionTypes) : null;
      const answeredIds = unansweredOnly && progressData
        ? new Set(progressData.map((p) => p.question_id))
        : null;
      pool = allQuestions.filter((q: Question) => {
        if (q.type === 'explain') return false;
        if (diffSet && !diffSet.has(q.difficulty)) return false;
        if (typeSet && !typeSet.has(q.type as QuizQuestionType)) return false;
        if (answeredIds && answeredIds.has(q.id)) return false;
        return true;
      });
    }

    const shuffled = shuffleArray(pool);
    const count = selectedCount === 'all' ? shuffled.length : Math.min(selectedCount, shuffled.length);
    const selected = shuffled.slice(0, count);

    if (selected.length === 0) return;

    dispatch({ type: 'START_SESSION', payload: { mode: selectedMode, questions: selected } });
    questionStartTime.current = Date.now();
  }, [allQuestions, reviewItems, selectedMode, selectedCount, topicIds, difficulties, questionTypes, unansweredOnly, progressData, dispatch]);

  // Auto-start when skipSetup is true and data is ready
  useEffect(() => {
    if (skipSetup && !hasAutoStarted.current && state.phase === 'setup') {
      const questionsReady = selectedMode === 'review' ? !!reviewItems : !!allQuestions;
      const progressReady = !unansweredOnly || !!progressData;
      if (questionsReady && progressReady) {
        hasAutoStarted.current = true;
        handleStart();
      }
    }
  }, [skipSetup, allQuestions, reviewItems, selectedMode, unansweredOnly, progressData, state.phase, handleStart]);

  const handleAnswer = useCallback(
    (selectedIndex: number | null, result: ProgressResult): void => {
      const timeSpent = Date.now() - questionStartTime.current;
      const currentQuestion = state.questions[state.currentIndex];

      dispatch({
        type: 'ANSWER',
        payload: { selected_index: selectedIndex, result, time_spent_ms: timeSpent },
      });

      // FSRS upsert for logged-in users
      if (user && currentQuestion) {
        const rating = quizResultToRating(result);
        const fsrsData = schedule(null, rating);
        progressUpsert.mutate({
          user_id: user.id,
          question_id: currentQuestion.id,
          result,
          answered_at: new Date().toISOString(),
          rating,
          ...fsrsData,
        });
      }
    },
    [state.questions, state.currentIndex, user, dispatch, schedule, progressUpsert]
  );

  const handleNext = useCallback((): void => {
    dispatch({ type: 'NEXT_QUESTION' });
    questionStartTime.current = Date.now();
  }, [dispatch]);

  const handleRetry = useCallback((): void => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const sessionResult: SessionResult | null = useMemo(() => {
    if (state.phase !== 'results') return null;

    const correct = state.answers.filter((a) => a.result === 'correct').length;
    const wrong = state.answers.filter((a) => a.result === 'wrong').length;
    const skipped = state.answers.filter((a) => a.result === 'skipped').length;
    const total = state.answers.length;

    return {
      topic_id: topicIds[0] ?? '',
      total_questions: total,
      correct_count: correct,
      wrong_count: wrong,
      skipped_count: skipped,
      accuracy_percent: total > 0 ? Math.round((correct / total) * 100) : 0,
      total_time_ms: state.totalTime,
      per_question: state.answers.map((answer, i) => {
        const q = state.questions[i];
        return {
          question_id: answer.question_id,
          question_ja: q.question_ja,
          question_en: q.question_en,
          type: q.type,
          difficulty: q.difficulty,
          result: answer.result,
          time_spent_ms: answer.time_spent_ms,
          selected_index: answer.selected_index,
        };
      }),
    };
  }, [state.phase, state.answers, state.questions, state.totalTime, topicIds]);

  // -- Loading / Error states --
  if (questionsLoading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading', language)}</p>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-danger-600 dark:text-danger-400">{t('common.error', language)}</p>
      </div>
    );
  }

  // -- Setup phase --
  if (state.phase === 'setup') {
    const quizPool = allQuestions?.filter((q: Question) => q.type !== 'explain') ?? [];
    const hasQuestions = quizPool.length > 0;

    return (
      <div className="mx-auto max-w-md space-y-6">
        {/* Mode selector */}
        <div>
          <label className="mb-2 block text-sm font-medium dark:text-gray-200">
            {language === 'ja' ? 'モード' : 'Mode'}
          </label>
          <div className="flex gap-2">
            {(['new', 'review'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSelectedMode(mode)}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  selectedMode === mode
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                {t(`mode.${mode}`, language)}
              </button>
            ))}
          </div>
        </div>

        {/* Question count selector */}
        <div>
          <label className="mb-2 block text-sm font-medium dark:text-gray-200">
            {language === 'ja' ? '問題数' : 'Question Count'}
          </label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setSelectedCount(count)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCount === count
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                {count === 'all' ? (language === 'ja' ? '全問' : 'All') : count}
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={handleStart}
          disabled={!hasQuestions}
          className={`w-full rounded-lg px-6 py-3 text-lg font-semibold text-white transition-colors ${
            hasQuestions
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'cursor-not-allowed bg-gray-400'
          }`}
        >
          {t('quiz.start', language)}
        </button>

        {!hasQuestions && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {language === 'ja'
              ? 'このトピックにはクイズ問題がありません'
              : 'No quiz questions available for this topic'}
          </p>
        )}
      </div>
    );
  }

  // -- Playing phase --
  if (state.phase === 'playing') {
    const currentQuestion = state.questions[state.currentIndex];

    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            {state.currentIndex + 1} / {state.questions.length}
          </span>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
            {t(`mode.${state.mode}`, language)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${((state.currentIndex + 1) / state.questions.length) * 100}%` }}
          />
        </div>

        <QuestionCard
          question={currentQuestion}
          language={language}
          phase="playing"
          selectedIndex={null}
          onAnswer={handleAnswer}
        />
      </div>
    );
  }

  // -- Review phase --
  if (state.phase === 'review') {
    const currentQuestion = state.questions[state.currentIndex];
    const currentAnswer = state.answers[state.answers.length - 1];

    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            {state.currentIndex + 1} / {state.questions.length}
          </span>
          <span className={`font-medium ${
            currentAnswer.result === 'correct'
              ? 'text-success-600 dark:text-success-400'
              : currentAnswer.result === 'wrong'
              ? 'text-danger-600 dark:text-danger-400'
              : 'text-gray-500'
          }`}>
            {t(
              currentAnswer.result === 'correct'
                ? 'quiz.correct'
                : currentAnswer.result === 'wrong'
                ? 'quiz.wrong'
                : 'quiz.skipped',
              language
            )}
          </span>
        </div>

        <QuestionCard
          question={currentQuestion}
          language={language}
          phase="review"
          selectedIndex={currentAnswer.selected_index}
          onAnswer={() => {}}
        />

        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
        >
          {state.currentIndex + 1 < state.questions.length
            ? t('quiz.next', language)
            : t('quiz.results', language)}
        </button>
      </div>
    );
  }

  // -- Results phase --
  if (state.phase === 'results' && sessionResult) {
    return (
      <ResultsSummary
        result={sessionResult}
        topicId={topicIds[0] ?? ''}
        onRetry={handleRetry}
        language={language}
      />
    );
  }

  return null;
};

export default QuizSession;
