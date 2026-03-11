'use client';

interface OptionButtonProps {
  label: string;
  text: string;
  state: 'default' | 'selected' | 'correct' | 'wrong';
  onSelect: () => void;
}

const OptionButton = ({ label, text, state, onSelect }: OptionButtonProps) => {
  const stateClasses = {
    default: 'border-gray-300 hover:border-primary-400 dark:border-gray-600',
    selected: 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
    correct: 'border-success-500 bg-success-50 dark:bg-success-900/20',
    wrong: 'border-danger-500 bg-danger-50 dark:bg-danger-900/20',
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${stateClasses[state]}`}
    >
      <span className="mr-3 font-semibold">{label}.</span>
      {text}
    </button>
  );
};

export default OptionButton;
