import { auth } from '@/auth';
import { cache } from 'react';

export const getSession = cache(async () => auth());

export const getCurrentUser = async () => {
  const session = await getSession();
  return session?.user;
};

export const currentRole = async () => {
  const session = await getSession();
  return session?.user.role;
};
