import { formatAmount } from '@/lib/format'

// One transport plan as a large radio card. It is a real radio input (hidden
// visually), so keyboards and screen readers treat the cards as one choice.
// `has-checked:` styles the card when its radio is selected.
export function PlanOption({ plan, price, registration }) {
  const Icon = plan.icon
  return (
    <label className="relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-colors hover:border-foreground/40 has-checked:border-2 has-checked:border-foreground has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input type="radio" className="peer sr-only" {...registration} />
      <span className="grid size-9 place-items-center rounded-xl bg-muted peer-checked:bg-primary peer-checked:text-primary-foreground">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold">{plan.label}</span>
        <span className="text-sm text-muted-foreground">
          {plan.description}
        </span>
      </span>
      <span className="font-mono text-sm font-semibold">
        KES {formatAmount(price)} / term
      </span>
      <span
        aria-hidden="true"
        className="absolute top-4 right-4 size-5 rounded-full border-2 border-border peer-checked:border-[6px] peer-checked:border-foreground"
      />
    </label>
  )
}
