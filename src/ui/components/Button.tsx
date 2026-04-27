import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'reserved';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent-grad text-white shadow-glow',
  secondary: 'glass gradient-border text-text-primary',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
  danger: 'bg-danger/15 text-danger border border-danger/30',
  reserved: 'bg-reserved-grad text-base shadow-reserved-glow',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-14 px-5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    fullWidth,
    loading,
    leadingIcon,
    trailingIcon,
    className = '',
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-pill font-medium tracking-tight outline-none transition-opacity',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {trailingIcon}
    </motion.button>
  );
});
