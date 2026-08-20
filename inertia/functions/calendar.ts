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

  createEvent(
    {
      start: [year, month, day],
      duration: { days: 1 },
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
