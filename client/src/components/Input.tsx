import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-coral mb-2">
        {label}
      </label>
      <input
        className={`w-full px-3 py-2 border border-citron rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-citron focus:border-citron ${
          error ? 'border-red' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red">{error}</p>
      )}
    </div>
  );
};

export default Input;
