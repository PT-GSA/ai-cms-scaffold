'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * ScrollArea component untuk membuat area yang dapat di-scroll
 * @param className - CSS class tambahan
 * @param children - Konten yang akan di-scroll
 * @param props - Props HTML div lainnya
 */
export function ScrollArea({ 
  className, 
  children, 
  ...props 
}: ScrollAreaProps) {
  return (
    <div
      className={cn(
        "relative overflow-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}