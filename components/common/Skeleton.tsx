interface SkeletonProps {
  variant?: 'card' | 'row' | 'text';
  width?: string;
  height?: string;
}

const Skeleton = ({ variant = 'text', width, height }: SkeletonProps) => {
  const variantClasses = {
    card: 'h-32 w-full rounded-lg',
    row: 'h-12 w-full rounded-md',
    text: 'h-4 w-3/4 rounded',
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${variantClasses[variant]}`}
      style={{ width, height }}
    />
  );
};

export default Skeleton;
