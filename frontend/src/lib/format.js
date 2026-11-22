// "Jane Wanjiru Mwangi" → "Jane". Used for friendly greetings.
export function firstName(fullName) {
  return fullName.trim().split(/\s+/)[0]
}
