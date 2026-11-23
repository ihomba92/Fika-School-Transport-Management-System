// What the admin sets in Fee settings (FR-6): each term's dates, fee and
// instalment due dates. Terms 1 and 2 are paid in thirds, Term 3 in halves.
// Dates are written as YYYY-MM-DD, in Nairobi time.
export const TERMS = [
  {
    id: '2026-1',
    name: 'Term 1',
    opens: '2026-01-05',
    closes: '2026-04-02',
    fee: 15000,
    dueDates: ['2026-01-01', '2026-02-01', '2026-03-01'],
  },
  {
    id: '2026-2',
    name: 'Term 2',
    opens: '2026-04-27',
    closes: '2026-07-31',
    fee: 15000,
    dueDates: ['2026-05-01', '2026-06-01', '2026-07-01'],
  },
  {
    id: '2026-3',
    name: 'Term 3',
    opens: '2026-08-31',
    closes: '2026-10-23',
    fee: 15000,
    dueDates: ['2026-09-01', '2026-10-01'],
  },
]

export const CURRENT_TERM_ID = '2026-3'
