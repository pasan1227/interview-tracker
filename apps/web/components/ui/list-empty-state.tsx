interface ListEmptyStateProps {
  title: string;
  description: string;
  /** Set true to render with a bordered card shell (used by hand-rolled
   *  tables that don't sit inside a DataTable's border). */
  bordered?: boolean;
}

export function ListEmptyState({
  title,
  description,
  bordered = false,
}: ListEmptyStateProps) {
  return (
    <div
      className={`flex h-100 flex-col items-center justify-center space-y-2 p-8 text-center${
        bordered ? ' border rounded-md' : ''
      }`}
    >
      <h3 className='text-lg font-semibold'>{title}</h3>
      <p className='text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}
