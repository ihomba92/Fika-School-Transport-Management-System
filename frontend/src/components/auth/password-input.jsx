import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { TextInput } from './text-input'

export function PasswordInput(props) {
  const [isVisible, setIsVisible] = useState(false)
  const Icon = isVisible ? EyeOff : Eye

  return (
    <div className="relative">
      <TextInput
        type={isVisible ? 'text' : 'password'}
        className="pr-12"
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-1 grid w-11 place-items-center text-muted-foreground hover:text-foreground"
      >
        <Icon className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}
