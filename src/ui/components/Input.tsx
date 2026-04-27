import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
  children: ReactNode;
}

function FieldShell({ label, hint, error, leading, trailing, children }: FieldShellProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? (
        <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
          {label}
        </span>
      ) : null}
      <span
        className={[
          'glass flex items-center gap-2 rounded-pill border border-border-subtle px-4 py-2.5 transition-colors',
          error ? 'border-danger/60' : 'focus-within:border-accent/60',
        ].join(' ')}
      >
        {leading ? <span className="text-text-muted">{leading}</span> : null}
        <span className="flex-1">{children}</span>
        {trailing ? <span className="text-text-muted">{trailing}</span> : null}
      </span>
      {error ? (
        <span className="text-[11px] text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, trailing, leading, className = '', ...rest },
  ref,
) {
  return (
    <FieldShell
      {...(label !== undefined ? { label } : {})}
      {...(hint !== undefined ? { hint } : {})}
      {...(error !== undefined ? { error } : {})}
      {...(trailing !== undefined ? { trailing } : {})}
      {...(leading !== undefined ? { leading } : {})}
    >
      <input
        ref={ref}
        className={[
          'w-full bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted',
          className,
        ].join(' ')}
        {...rest}
      />
    </FieldShell>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className = '', rows = 3, ...rest },
  ref,
) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? (
        <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
          {label}
        </span>
      ) : null}
      <textarea
        ref={ref}
        rows={rows}
        className={[
          'glass rounded-card border border-border-subtle px-4 py-3 text-base text-text-primary outline-none placeholder:text-text-muted transition-colors focus:border-accent/60',
          error ? 'border-danger/60' : '',
          className,
        ].join(' ')}
        {...rest}
      />
      {error ? (
        <span className="text-[11px] text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-text-muted">{hint}</span>
      ) : null}
    </label>
  );
});

interface SegmentedProps<T extends string> {
  label?: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  hint?: string;
}

/** Pill-segmented control. Used for cadence, tier, difficulty selectors. */
export function Segmented<T extends string>({ label, value, options, onChange, hint }: SegmentedProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span className="display-num text-[11px] uppercase tracking-[0.2em] text-text-muted">
          {label}
        </span>
      ) : null}
      <div className="glass flex gap-1 rounded-pill border border-border-subtle p-1">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'flex-1 rounded-pill px-3 py-2 text-xs font-medium transition-colors',
                active
                  ? 'bg-accent-grad text-white shadow-glow'
                  : 'text-text-secondary hover:text-text-primary',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hint ? <span className="text-[11px] text-text-muted">{hint}</span> : null}
    </div>
  );
}
