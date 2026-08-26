import { createEvent } from 'ics'

type CalendarEvent = {
  date: string | null
  title: string | null
  description: string | null
}

export function downloadCalendarEvent({ date, title, description }: CalendarEvent) {
  // `date` is a plain YYYY-MM-DD string from a date input: parse it manually
  // to avoid `new Date(date)` shifting the day/time due to UTC interpretation.
  const [year, month, day] = date
    ? date.split('-').map(Number)
    : (() => {
        const now = new Date()
        return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      })()

  // Compute the following calendar day for DTEND. Using `duration: { days: 1 }`
  // instead produces a malformed `DURATION:P1DT` (trailing empty time part) that
  // some calendar clients mishandle, so an explicit end date is used instead.
  // UTC arithmetic keeps this immune to the browser's local timezone.
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1))

  createEvent(
    {
      start: [year, month, day],
      end: [nextDay.getUTCFullYear(), nextDay.getUTCMonth() + 1, nextDay.getUTCDate()],
      title: title ?? undefined,
      description: description ?? '',
    },
    (error, value) => {
      if (error) {
        console.error(error)
        return
      }

      const blob = new Blob([value], {
        type: 'text/calendar;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `${title ?? 'evenement'}.ics`
      link.style.visibility = 'hidden'
      document.body.append(link)
      link.click()
      link.remove()

      setTimeout(() => URL.revokeObjectURL(url), 0)
    }
  )
}
