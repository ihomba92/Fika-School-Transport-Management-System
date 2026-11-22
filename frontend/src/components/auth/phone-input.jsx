import { TextInput } from './text-input'

export function PhoneInput(props) {
  return (
    <div className="flex gap-2">
      <span className="grid h-12 w-20 shrink-0 place-items-center rounded-xl border bg-muted font-mono text-sm">
        +254
      </span>
      <TextInput
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="712 345 678"
        {...props}
      />
    </div>
  )
}
