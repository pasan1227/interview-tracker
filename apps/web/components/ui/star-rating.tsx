'use client';

import * as React from 'react';
import { StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  /** Accessible label for the rating group. */
  label?: string;
}

const SIZE_CLASS = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

// Rendered as a radio group of buttons so keyboard users can submit a
// rating without a pointer. Arrow keys move focus and update the value;
// Enter/Space activate. The hover preview is mouse-only — keyboard
// focus drives the active state instead.
export function StarRating({
  value,
  onChange,
  className,
  size = 'md',
  readOnly = false,
  label = 'Rating',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState(0);
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const sizeClass = SIZE_CLASS[size];

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    starValue: number
  ) => {
    if (readOnly) return;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(5, starValue + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(1, starValue - 1);
        break;
      case 'Home':
        next = 1;
        break;
      case 'End':
        next = 5;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(next);
    buttonRefs.current[next - 1]?.focus();
  };

  return (
    <div
      role='radiogroup'
      aria-label={label}
      aria-readonly={readOnly || undefined}
      className={cn('flex items-center', className)}
      onMouseLeave={() => !readOnly && setHoverValue(0)}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const isChecked = value === starValue;
        const isActive = (hoverValue || value) >= starValue;
        return (
          <button
            key={index}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type='button'
            role='radio'
            aria-checked={isChecked}
            aria-label={`${starValue} out of 5`}
            tabIndex={isChecked || (!value && starValue === 1) ? 0 : -1}
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onClick={() => !readOnly && onChange(starValue)}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            className={cn(
              'rounded-sm p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              !readOnly && 'cursor-pointer'
            )}
          >
            <StarIcon
              aria-hidden
              className={cn(
                sizeClass,
                'transition-colors',
                isActive
                  ? 'fill-[var(--forest)] text-[var(--forest)]'
                  : 'text-border'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
