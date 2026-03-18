import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Avatar: React.FC<AvatarProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'relative inline-flex h-10 w-10 select-none items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100 text-gray-900 ring-1 ring-gray-900/5 shadow-md',
      className
    )}
    {...props}
  />
);

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage: React.FC<AvatarImageProps> = ({ className, ...props }) => (
  <img
    className={cn('aspect-square h-full w-full rounded-full object-cover', className)}
    {...props}
  />
);

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full',
      className
    )}
    {...props}
  />
);

export { Avatar, AvatarImage, AvatarFallback };
