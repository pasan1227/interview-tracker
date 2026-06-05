interface FormSkeletonProps {
  rows?: number;
}

// Layout-stable placeholder used by every *-form-lazy wrapper while the
// dynamic chunk is in flight. Sized to match the average input height
// plus label so the page doesn't reflow when the real form mounts.
export function FormSkeleton({ rows = 4 }: Readonly<FormSkeletonProps>) {
  return (
    <div className='space-y-5' aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className='space-y-2'>
          <div className='h-3 w-24 rounded-md bg-secondary' />
          <div className='h-10 rounded-md bg-secondary' />
        </div>
      ))}
      <div className='flex justify-end gap-2 pt-2'>
        <div className='h-10 w-24 rounded-md bg-secondary' />
        <div className='h-10 w-28 rounded-md bg-secondary' />
      </div>
    </div>
  );
}
