import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: Readonly<PageHeaderProps>) {
  return (
    <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div className='flex flex-col gap-2'>
        <div
          className='flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em]'
          style={{ color: 'var(--muted-foreground)' }}
        >
          <span
            aria-hidden
            className='inline-block size-1.5 rounded-full'
            style={{ backgroundColor: 'var(--forest)' }}
          />
          {eyebrow}
        </div>
        <h1 className='text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.03em]'>
          {title}
        </h1>
        {description && (
          <p
            className='max-w-[60ch] text-[15px] leading-[1.55]'
            style={{ color: 'var(--muted-foreground)' }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className='shrink-0'>{action}</div>}
    </header>
  );
}
