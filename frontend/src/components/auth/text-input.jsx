import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// The tall, rounded input used on the auth screens.
export function TextInput({ className, ...props }) {
  return (
    <Input
      className={cn('h-12 rounded-xl bg-card px-4 text-base', className)}
      {...props}
    />
  )
}
