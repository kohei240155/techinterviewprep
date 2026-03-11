'use client';

interface OptionButtonProps {
  label: string;
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  disabled: boolean;
  onClick: () => void;
}

const OptionButton = ({
  label,
  text,
  isSelected,
  isCorrect,
  isRevealed,
  disabled,
  onClick,
}: OptionButtonProps) => {
  const getStateClasses = (): string => {
    if (isRevealed) {
      if (isCorrect) {
        return 'border-success-500 bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400';
      }
      if (isSelected && !isCorrect) {
        return 'border-danger-500 bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400';
      }
      return 'border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-500';
    }
    if (isSelected) {
      return 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
    }
    return 'border-gray-300 hover:border-primary-400 dark:border-gray-600 dark:hover:border-primary-500';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${getStateClasses()} ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <span className="mr-3 inline-block min-w-[1.5rem] font-semibold">{label}.</span>
      {text}
    </button>
  );
};

export default OptionButton;
