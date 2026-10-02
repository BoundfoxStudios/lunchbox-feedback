const berlinDayFormat = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Berlin',
});

export function formatBerlinDay(date: Date): string {
  return berlinDayFormat.format(date);
}
