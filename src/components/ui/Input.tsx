import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-[var(--rahmah-text)]">
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${errorId || ''} ${helperId || ''}`.trim() || undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-sm text-[var(--rahmah-muted)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;