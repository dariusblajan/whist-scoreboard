/** Locale-formatted rank ordinal, e.g. en "1st"/"2nd"/"3rd"/"4th", ro "Locul 1". */
export function formatOrdinal(locale, rank) {
  if (locale === 'ro') return `Locul ${rank}`
  const mod100 = rank % 100
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`
  switch (rank % 10) {
    case 1:
      return `${rank}st`
    case 2:
      return `${rank}nd`
    case 3:
      return `${rank}rd`
    default:
      return `${rank}th`
  }
}
