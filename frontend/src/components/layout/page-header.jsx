// A page's title block. `actions` (buttons or links) sit on the right on
// wide screens and below the text on phones.
export function PageHeader({ eyebrow, title, description, actions }) {
  const text = (
    <div className="flex flex-col gap-1.5">
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
    </div>
  )
  if (!actions) return <header>{text}</header>
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      {text}
      <div className="flex flex-wrap gap-2">{actions}</div>
    </header>
  )
}
