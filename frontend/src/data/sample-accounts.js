// Sample accounts for trying the log in screen before the back end exists.
// Development only: Module 1's back end replaces this file with real accounts.
export const SAMPLE_PASSWORD = 'Fika2026!'

export const SAMPLE_ACCOUNTS = [
  {
    email: 'admin@example.com',
    name: 'Grace Wanjiru',
    role: 'admin',
    emailVerified: true,
  },
  {
    email: 'driver@example.com',
    name: 'Peter Otieno',
    role: 'driver',
    emailVerified: true,
  },
  {
    email: 'parent@example.com',
    name: 'Jane Mwangi',
    role: 'parent',
    emailVerified: true,
  },
  {
    email: 'new.parent@example.com',
    name: 'Esther Mutiso',
    role: 'parent',
    emailVerified: false,
  },
]

// What "Continue with Google" returns until real Google sign-in is connected.
export const SAMPLE_GOOGLE_USER = {
  email: 'jane.mwangi@gmail.com',
  name: 'Jane Mwangi',
}
