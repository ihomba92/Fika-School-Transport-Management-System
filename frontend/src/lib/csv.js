// Turns rows of values into CSV text that Excel and Google Sheets open
// correctly. Values with commas, quotes or line breaks are quoted, and
// quotes inside them are doubled, as the CSV format requires.
export function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
