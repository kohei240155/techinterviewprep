'use client';

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
}

const AnswerInput = ({ value, onChange }: AnswerInputProps) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="回答を入力してください..."
      className="w-full rounded-lg border border-gray-300 p-4 dark:border-gray-600 dark:bg-gray-800"
      rows={6}
    />
  );
};

export default AnswerInput;
