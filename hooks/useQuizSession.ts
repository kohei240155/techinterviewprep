'use client';

import { useReducer } from 'react';
import type { Question, QuizAnswer, QuizMode, SessionResult } from '@/types';

interface QuizState {
  phase: 'setup' | 'playing' | 'review' | 'results';
  mode: QuizMode;
  questions: Question[];
  currentIndex: number;
  answers: QuizAnswer[];
  startTime: number;
  totalTime: number;
  result: SessionResult | null;
}

type QuizAction =
  | { type: 'START_SESSION'; payload: { mode: QuizMode; questions: Question[] } }
  | { type: 'ANSWER'; payload: { selected_index: number | null; result: 'correct' | 'wrong' | 'skipped'; time_spent_ms: number } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET' };

const initialState: QuizState = {
  phase: 'setup',
  mode: 'new',
  questions: [],
  currentIndex: 0,
  answers: [],
  startTime: 0,
  totalTime: 0,
  result: null,
};

const quizReducer = (state: QuizState, action: QuizAction): QuizState => {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...initialState,
        phase: 'playing',
        mode: action.payload.mode,
        questions: action.payload.questions,
        startTime: Date.now(),
      };
    case 'ANSWER':
      return {
        ...state,
        phase: 'review',
        answers: [
          ...state.answers,
          {
            question_id: state.questions[state.currentIndex].id,
            selected_index: action.payload.selected_index,
            result: action.payload.result,
            time_spent_ms: action.payload.time_spent_ms,
          },
        ],
      };
    case 'NEXT_QUESTION':
      if (state.currentIndex + 1 >= state.questions.length) {
        return { ...state, phase: 'results', totalTime: Date.now() - state.startTime };
      }
      return { ...state, phase: 'playing', currentIndex: state.currentIndex + 1 };
    case 'FINISH_SESSION':
      return { ...state, phase: 'results', totalTime: Date.now() - state.startTime };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const useQuizSession = () => {
  return useReducer(quizReducer, initialState);
};
