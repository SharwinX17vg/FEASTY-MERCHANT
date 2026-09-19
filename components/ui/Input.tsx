import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hint?: string;
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, hint, id, label, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="block space-y-2" htmlFor={inputId}>
        {label ? (
          <span className="block text-sm font-medium text-foreground">
            {label}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-foreground shadow-inner shadow-black/10 outline-none transition duration-200 placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""} ${className}`}
          {...props}
        />
        {error ? (
          <span id={`${inputId}-error`} className="block text-sm text-red-300">
            {error}
          </span>
        ) : hint ? (
          <span id={`${inputId}-hint`} className="block text-sm text-muted">
            {hint}
          </span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";
