import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

// A person's photo, or their initials if there is no photo or it fails to load.
// Drivers' photos matter: parents use them to recognise who is driving (FR-2.6),
// so the photo has real alt text rather than being decorative.
export function PersonPhoto({ name, src, className }) {
  const [hasFailed, setHasFailed] = useState(false)

  if (!src || hasFailed) return <Avatar name={name} className={className} />

  return (
    <img
      src={src}
      alt={`Photo of ${name}`}
      onError={() => setHasFailed(true)}
      className={cn(
        'size-10 shrink-0 rounded-full bg-muted object-cover',
        className,
      )}
    />
  )
}
