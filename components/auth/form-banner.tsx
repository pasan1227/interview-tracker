import { FC } from 'react';

type Variant = 'error' | 'success' | 'info';

const TOKEN: Record<Variant, string> = {
  error: 'var(--destructive)',
  success: 'var(--forest)',
  info: 'var(--forest)',
};

export const FormBanner: FC<{ children: React.ReactNode; variant: Variant }> = ({
  children,
  variant,
}) => {
  const color = TOKEN[variant];
  return (
    <div
      className='rounded-md border px-3 py-2 text-[13px]'
      role={variant === 'error' ? 'alert' : 'status'}
      style={{
        borderColor: `color-mix(in oklch, ${color} 30%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 8%, transparent)`,
        color,
      }}
    >
      {children}
    </div>
  );
};
