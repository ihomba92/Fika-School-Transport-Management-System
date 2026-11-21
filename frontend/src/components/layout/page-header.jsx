export function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="flex flex-col gap-1.5">
      {eyebrow && (
        <p className="font-mono text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-heading text-3xl font-extrabold tracking-tight">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-muted-foreground">{description}</p>
      )}
    </header>
  )
}
