'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, XIcon } from 'lucide-react';

interface ResourceSearchProps {
  placeholder: string;
}

const DEBOUNCE_MS = 300;

// URL-driven search box for any paginated list page. Reads/writes the
// `search` query param and resets `page` to 1 on change so the user
// doesn't end up on page 47 of two results. Was duplicated as
// CandidatesSearch + InterviewsSearch (byte-identical except placeholder).
//
// Debounces user input so each keystroke doesn't fire a server request
// — the previous Enter-only flow was crisper but trained users to wait
// for a beat after each query change.
export function ResourceSearch({ placeholder }: Readonly<ResourceSearchProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') ?? '';
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const lastApplied = useRef(currentSearch);

  const apply = (next: string) => {
    if (next === lastApplied.current) return;
    lastApplied.current = next;
    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set('search', next);
    } else {
      params.delete('search');
    }
    params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  useEffect(() => {
    const t = setTimeout(() => apply(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(t);
    // searchParams / pathname are stable per-route; we want the timer to
    // restart only when the typed query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <div className='relative w-full max-w-sm'>
      <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
      <Input
        type='search'
        placeholder={placeholder}
        className='pl-8 pr-10'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') apply(searchQuery);
        }}
      />
      {searchQuery && (
        <Button
          variant='ghost'
          size='sm'
          className='absolute right-0 top-0 h-9 w-9 rounded-l-none'
          onClick={() => {
            setSearchQuery('');
            apply('');
          }}
          disabled={isPending}
        >
          <XIcon className='h-4 w-4' />
          <span className='sr-only'>Clear search</span>
        </Button>
      )}
    </div>
  );
}
