'use client';
import Header from '@/components/auth/header';
import Social from '@/components/auth/social';
import { Card, CardContent } from '@/components/ui/card';
import React, { FC } from 'react';
import BackButton from './back-button';

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  headerTitle?: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

export const CardWrapper: FC<CardWrapperProps> = ({
  children,
  headerLabel,
  headerTitle,
  backButtonLabel,
  backButtonHref,
  showSocial,
}) => {
  return (
    <Card
      className='w-full max-w-[420px] mx-auto rounded-2xl border-border bg-card p-2 shadow-[0_1px_0_rgba(0,0,0,0.02),0_30px_60px_-30px_rgba(14,59,46,0.16)]'
    >
      <CardContent className='flex flex-col gap-7 p-7'>
        <Header label={headerLabel} title={headerTitle} />
        <div>{children}</div>
        {showSocial && (
          <>
            <div className='relative flex items-center'>
              <div className='h-px flex-1 bg-border' />
              <span className='px-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground'>
                Or continue with
              </span>
              <div className='h-px flex-1 bg-border' />
            </div>
            <Social />
          </>
        )}
        <div className='border-t border-border pt-5 text-center'>
          <BackButton label={backButtonLabel} href={backButtonHref} />
        </div>
      </CardContent>
    </Card>
  );
};
