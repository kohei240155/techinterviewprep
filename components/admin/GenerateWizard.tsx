'use client';

import { useState, useCallback } from 'react';
import type {
  GenerateWizardState,
  GenerateWizardStep,
  AnalysisPlan,
  GeneratedQuestion,
} from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import InputStep from './InputStep';
import PlanReviewStep from './PlanReviewStep';
import PreviewStep from './PreviewStep';
import SaveStep from './SaveStep';

const initialState: GenerateWizardState = {
  step: 'input',
  input_mode: 'topic',
  topic_id: '',
  content: '',
  plan: null,
  edited_plan: null,
  generated_questions: [],
  selected_question_indices: [],
  is_loading: false,
  error: null,
};

const stepOrder: GenerateWizardStep[] = ['input', 'plan_review', 'generating', 'preview', 'saving', 'done'];

const GenerateWizard = () => {
  const { language } = useLanguage();
  const [state, setState] = useState<GenerateWizardState>(initialState);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, is_loading: false }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    setState((prev) => ({ ...prev, is_loading: true, error: null }));
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: state.topic_id,
          content: state.content || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Analysis failed');
      }

      const data = await res.json();
      const plan: AnalysisPlan = data.plan;

      setState((prev) => ({
        ...prev,
        plan,
        edited_plan: structuredClone(plan),
        step: 'plan_review',
        is_loading: false,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [state.topic_id, state.content, setError]);

  const handleGenerate = useCallback(async () => {
    if (!state.edited_plan) return;
    setState((prev) => ({ ...prev, step: 'generating', is_loading: true, error: null }));
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: state.topic_id,
          plan: state.edited_plan,
          content: state.content || undefined,
          existing_questions: '',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Generation failed');
      }

      const data = await res.json();
      const questions: GeneratedQuestion[] = data.questions;

      setState((prev) => ({
        ...prev,
        generated_questions: questions,
        selected_question_indices: questions.map((_, i) => i),
        step: 'preview',
        is_loading: false,
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, step: 'plan_review' }));
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [state.topic_id, state.content, state.edited_plan, setError]);

  const handleSave = useCallback(async () => {
    setState((prev) => ({ ...prev, step: 'saving', is_loading: true, error: null }));
    try {
      const selectedQuestions = state.selected_question_indices.map(
        (i) => state.generated_questions[i]
      );

      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: state.topic_id,
          questions: selectedQuestions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Save failed');
      }

      const data = await res.json();

      setState((prev) => ({
        ...prev,
        step: 'done',
        is_loading: false,
        selected_question_indices: Array.from(
          { length: data.inserted_count },
          (_, i) => i
        ),
      }));
    } catch (err) {
      setState((prev) => ({ ...prev, step: 'preview' }));
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [state.topic_id, state.generated_questions, state.selected_question_indices, setError]);

  const handleToggleSelect = useCallback((index: number) => {
    setState((prev) => {
      const indices = prev.selected_question_indices.includes(index)
        ? prev.selected_question_indices.filter((i) => i !== index)
        : [...prev.selected_question_indices, index];
      return { ...prev, selected_question_indices: indices };
    });
  }, []);

  const handleQuestionChange = useCallback((index: number, question: GeneratedQuestion) => {
    setState((prev) => {
      const updated = [...prev.generated_questions];
      updated[index] = question;
      return { ...prev, generated_questions: updated };
    });
  }, []);

  const handleGenerateMore = useCallback(() => {
    setState(initialState);
  }, []);

  const currentStepIndex = stepOrder.indexOf(state.step);
  const displaySteps = [
    { key: 'input', label: language === 'ja' ? '1. 入力' : '1. Input' },
    { key: 'plan_review', label: language === 'ja' ? '2. 計画' : '2. Plan' },
    { key: 'preview', label: language === 'ja' ? '3. プレビュー' : '3. Preview' },
    { key: 'done', label: language === 'ja' ? '4. 完了' : '4. Done' },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        {displaySteps.map((s, idx) => {
          const stepIdx = stepOrder.indexOf(s.key as GenerateWizardStep);
          const isActive = currentStepIndex >= stepIdx;
          return (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  isActive
                    ? 'font-medium text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {s.label}
              </span>
              {idx < displaySteps.length - 1 && (
                <div
                  className={`mx-4 h-px w-8 ${
                    isActive ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error display */}
      {state.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      {/* Step content */}
      {state.step === 'input' && (
        <InputStep
          topicId={state.topic_id}
          content={state.content}
          onTopicChange={(id) => setState((prev) => ({ ...prev, topic_id: id }))}
          onContentChange={(content) => setState((prev) => ({ ...prev, content }))}
          onAnalyze={handleAnalyze}
          isLoading={state.is_loading}
        />
      )}

      {state.step === 'plan_review' && state.plan && state.edited_plan && (
        <PlanReviewStep
          plan={state.plan}
          editedPlan={state.edited_plan}
          onPlanChange={(plan) => setState((prev) => ({ ...prev, edited_plan: plan }))}
          onGenerate={handleGenerate}
          isLoading={state.is_loading}
        />
      )}

      {state.step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '問題を生成中...' : 'Generating questions...'}
          </p>
        </div>
      )}

      {state.step === 'preview' && (
        <PreviewStep
          questions={state.generated_questions}
          selectedIndices={state.selected_question_indices}
          onToggleSelect={handleToggleSelect}
          onQuestionChange={handleQuestionChange}
          onSave={handleSave}
          isLoading={state.is_loading}
        />
      )}

      {state.step === 'saving' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'ja' ? '保存中...' : 'Saving...'}
          </p>
        </div>
      )}

      {state.step === 'done' && (
        <SaveStep
          savedCount={state.selected_question_indices.length}
          onGenerateMore={handleGenerateMore}
          language={language}
        />
      )}
    </div>
  );
};

export default GenerateWizard;
