export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex items-center justify-center mx-auto min-h-screen min-w-screen bg-gray-100 dark:bg-gray-900'>
      {children}
    </div>
  );
}
