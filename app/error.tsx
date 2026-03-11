'use client';

const ErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
      >
        もう一度試す
      </button>
    </div>
  );
};

export default ErrorPage;
