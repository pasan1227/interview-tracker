import { FC } from 'react';

interface HeaderProps {
  label: string;
  title?: string;
}

const Header: FC<HeaderProps> = ({ label, title = 'Welcome back' }) => {
  return (
    <div className='flex flex-col gap-2'>
      <h1 className='text-[26px] font-semibold leading-[1.1] tracking-[-0.02em]'>
        {title}
      </h1>
      <p className='text-[14px] leading-[1.5] text-muted-foreground'>
        {label}
      </p>
    </div>
  );
};

export default Header;
