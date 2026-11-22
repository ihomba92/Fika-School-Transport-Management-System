const KENYA_COUNTRY_CODE = '254'

// Turns the ways Kenyans write a mobile number into one format: +254XXXXXXXXX.
// Accepts both 07… and 01… numbers, written as 0712 345 678, 0110 123 456,
// 712345678, 254712345678 or +254 712 345 678.
// Returns null when the input is not a Kenyan mobile number.
export function normalizeKenyanPhone(input) {
  const digits = input.replace(/[\s-]/g, '').replace(/^\+/, '')
  const local = digits.startsWith(KENYA_COUNTRY_CODE)
    ? digits.slice(KENYA_COUNTRY_CODE.length)
    : digits.replace(/^0/, '')

  // 9 digits after the country code, starting with 7 (07… numbers) or 1 (01… numbers).
  return /^[71]\d{8}$/.test(local) ? `+${KENYA_COUNTRY_CODE}${local}` : null
}
