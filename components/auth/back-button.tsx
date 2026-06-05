'use client';

import Link from 'next/link';
import { FC } from 'react';

interface BackButtonProps {
  label: string;
  href: string;
}

const BackButton: FC<BackButtonProps> = ({ label, href }) => {
  return (
    <Link
      href={href}
      className='text-[13.5px] text-muted-foreground transition-colors hover:text-foreground'
    >
      {label}
    </Link>
  );
};

export default BackButton;
