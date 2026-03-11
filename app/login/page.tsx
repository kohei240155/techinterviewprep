'use client';

const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold">ログイン</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Google アカウントでログインしてください
      </p>
      {/* TODO: Google OAuth ログインボタン */}
    </div>
  );
};

export default LoginPage;
