export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between border-b border-base-700 bg-base-900/60 px-8 py-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </header>
  );
}
