'use client';

interface ReviewBadgeProps {
  count: number;
}

const ReviewBadge = ({ count }: ReviewBadgeProps) => {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-danger-100 px-3 py-1 text-sm font-medium text-danger-600 dark:bg-danger-900/30 dark:text-danger-400">
      {count} 問復習
    </span>
  );
};

export default ReviewBadge;
