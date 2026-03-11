'use client';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

const Toast = ({ message, type }: ToastProps) => {
  const typeClasses = {
    success: 'bg-success-500',
    error: 'bg-danger-500',
    info: 'bg-primary-500',
  };

  return (
    <div className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-white shadow-lg ${typeClasses[type]}`}>
      {message}
    </div>
  );
};

export default Toast;
