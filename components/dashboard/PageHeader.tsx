export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-7">
      <h1 className="text-[clamp(1.375rem,1.1rem+1vw,1.75rem)] font-semibold leading-[1.2] tracking-[-0.03em]">
        {title}
      </h1>
      {subtitle && <p className="mt-1.5 text-sm text-mist-400">{subtitle}</p>}
    </header>
  );
}
