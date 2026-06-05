import Link from 'next/link';

function Logomark() {
  return (
    <span
      aria-hidden
      className='relative inline-flex size-7 items-center justify-center rounded-md'
      style={{ backgroundColor: 'var(--forest)' }}
    >
      <span
        className='block size-3 rounded-[3px]'
        style={{
          background:
            'conic-gradient(from 135deg, var(--bone), var(--bone) 25%, transparent 25%, transparent 50%, var(--bone) 50%, var(--bone) 75%, transparent 75%)',
        }}
      />
    </span>
  );
}

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='relative flex min-h-screen w-full flex-col bg-background text-foreground'>
      <header
        className='sticky top-0 z-10 backdrop-blur-md'
        style={{
          backgroundColor:
            'color-mix(in oklch, var(--background) 78%, transparent)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className='mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-10'>
          <Link href='/' className='flex items-center gap-2.5'>
            <Logomark />
            <span className='text-[16px] font-semibold tracking-[-0.01em]'>
              InterviewPro
            </span>
          </Link>
          <Link
            href='/'
            className='text-[13.5px] font-medium'
            style={{ color: 'var(--muted-foreground)' }}
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className='flex flex-1 items-center justify-center px-6 py-16'>
        {children}
      </main>

      <footer
        className='mx-auto w-full max-w-[1200px] px-6 pb-8 text-center text-[12px] lg:px-10'
        style={{ color: 'var(--muted-foreground)' }}
      >
        © 2026 InterviewPro, Inc. · A quieter way to hire.
      </footer>
    </div>
  );
}
