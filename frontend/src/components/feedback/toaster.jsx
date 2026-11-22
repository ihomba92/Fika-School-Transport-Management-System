import { CircleAlert, CircleCheck, Info, Loader2 } from 'lucide-react'
import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from '@/components/theme/theme-context'

const TOAST_DURATION_MS = 4000

// Sonner reads its colours from these CSS variables, so we point them at
// Fika's design tokens. Toasts then match the app in light and dark mode.
const FIKA_TOAST_STYLE = {
  '--normal-bg': 'var(--card)',
  '--normal-text': 'var(--card-foreground)',
  '--normal-border': 'var(--border)',
  '--border-radius': 'var(--radius)',
}

// The one place toasts appear. Pages call toast.success('…') from 'sonner';
// this component decides where toasts sit and how they look.
export function Toaster() {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      duration={TOAST_DURATION_MS}
      closeButton
      style={FIKA_TOAST_STYLE}
      icons={{
        success: <CircleCheck className="size-5 text-success" />,
        error: <CircleAlert className="size-5 text-danger" />,
        info: <Info className="size-5" />,
        loading: <Loader2 className="size-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: 'gap-3 shadow-lg',
          title: 'font-semibold',
          description: 'text-muted-foreground!',
        },
      }}
    />
  )
}
