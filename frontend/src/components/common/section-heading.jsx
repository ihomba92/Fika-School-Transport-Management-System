// The title above a group of cards, such as "My children".
// `id` lets the surrounding <section> point at this heading (aria-labelledby).
export function SectionHeading({ id, title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="font-heading text-lg font-bold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
