'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n';
import VoiceRecordButton from '@/components/common/VoiceRecordButton';
import type { Language } from '@/types';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  language: Language;
}

const AnswerInput = ({ onSubmit, disabled, language }: AnswerInputProps) => {
  const [text, setText] = useState('');

  const handleTranscription = (transcription: string) => {
    setText((prev) => (prev ? `${prev} ${transcription}` : transcription));
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            language === 'ja'
              ? '回答を入力してください...'
              : 'Type your answer...'
          }
          disabled={disabled}
          className="w-full rounded-xl border border-gray-300 p-4 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          rows={6}
        />
        <span className="absolute bottom-2 right-3 text-xs text-gray-400 dark:text-gray-500">
          {text.length} {language === 'ja' ? '文字' : 'chars'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <VoiceRecordButton
          onTranscription={handleTranscription}
          disabled={disabled}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="btn-primary px-6 py-2"
        >
          {t('explain.submit', language)}
        </button>
      </div>
    </div>
  );
};

export default AnswerInput;
