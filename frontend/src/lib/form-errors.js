import { toast } from 'sonner'

// A 422 answer names the fields the server didn't accept, with the same
// messages the front end's Zod schemas use; this puts them on the form's
// fields, where FormField shows them (translated). Other errors become one
// toast. `t` translates the message.
export function showServerErrors(error, { setError, t }) {
  const fields = Object.entries(error?.fields ?? {})
  if (fields.length > 0 && setError) {
    for (const [name, message] of fields) {
      setError(name, { type: 'server', message }, { shouldFocus: true })
    }
    return
  }
  toast.error(t(error?.message ?? 'Something went wrong. Try again.'))
}
