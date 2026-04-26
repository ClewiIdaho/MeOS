import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode, forwardRef } from 'react';

type CardProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
  /** When true, the card gets a subtle gradient outline. */
  bordered?: boolean;
  /** When true, the card gets the violet-tinted card shadow. */
  elevated?: boolean;
  className?: string;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, bordered = true, elevated = true, className = '', ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={[
        'glass relative overflow-hidden rounded-card',
        bordered ? 'gradient-border' : '',
        elevated ? 'shadow-card' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </motion.div>
  );
});
