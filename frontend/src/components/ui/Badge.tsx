import React from 'react';
import { cn } from '../../lib/utils';

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'outline' | 'destructive' }
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border bg-blue-100 text-blue-800': variant === 'default',
          'border bg-gray-100 text-gray-800': variant === 'secondary',
          'text-white': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
