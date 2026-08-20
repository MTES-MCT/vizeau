import { createEvent } from 'ics'

type CalendarEvent = {
  date: string | null
  title: string | null
  description: string | null
}

export function downloadCalendarEvent({ date, title, description }: CalendarEvent) {
  const eventDate = date ? new Date(date) : new Date()
  const start: [number, number, number, number, number] = [
    eventDate.getFullYear(),
    eventDate.getMonth() + 1,
    eventDate.getDate(),
    eventDate.getHours(),
    eventDate.getMinutes(),
  ]

  createEvent(
    {
      start,
      duration: { hours: 1 },
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
      link.click()

      URL.revokeObjectURL(url)
    }
  )
}
