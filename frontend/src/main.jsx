import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import '@fontsource-variable/inter'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import '@/i18n'
import { router } from '@/app/router'
import { AuthProvider } from '@/auth/auth-provider'
import { Toaster } from '@/components/feedback/toaster'
import { ThemeProvider } from '@/components/theme/theme-provider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
)
