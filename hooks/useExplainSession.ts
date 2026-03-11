'use client';

import { useReducer } from 'react';
import type { ExplainQuestion, ExplainUserAnswer, SessionResult } from '@/types';

interface ExplainState {
  phase: 'playing' | 'waiting' | 'feedback' | 'results';
  questions: ExplainQuestion[];
  currentIndex: number;
  answers: ExplainUserAnswer[];
  startTime: number;
  totalTime: number;
  result: SessionResult | null;
}

type ExplainAction =
  | { type: 'START_SESSION'; payload: { questions: ExplainQuestion[] } }
  | { type: 'SUBMIT_ANSWER'; payload: { user_answer: string; time_spent_ms: number } }
  | { type: 'RECEIVE_FEEDBACK'; payload: { rating: 1 | 2 | 3 | 4; feedback: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET' };

const initialState: ExplainState = {
  phase: 'playing',
  questions: [],
  currentIndex: 0,
  answers: [],
  startTime: 0,
  totalTime: 0,
  result: null,
};

const explainReducer = (state: ExplainState, action: ExplainAction): ExplainState => {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...initialState,
        phase: 'playing',
        questions: action.payload.questions,
        startTime: Date.now(),
      };
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        phase: 'waiting',
        answers: [
          ...state.answers,
          {
            question_id: state.questions[state.currentIndex].id,
            user_answer: action.payload.user_answer,
            feedback: null,
            result: 'wrong',
            time_spent_ms: action.payload.time_spent_ms,
          },
        ],
      };
    case 'RECEIVE_FEEDBACK': {
      const updatedAnswers = [...state.answers];
      const lastIndex = updatedAnswers.length - 1;
      updatedAnswers[lastIndex] = {
        ...updatedAnswers[lastIndex],
        feedback: { rating: action.payload.rating, feedback: action.payload.feedback },
        result: action.payload.rating >= 3 ? 'correct' : 'wrong',
      };
      return { ...state, phase: 'feedback', answers: updatedAnswers };
    }
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

export const useExplainSession = () => {
  return useReducer(explainReducer, initialState);
};
