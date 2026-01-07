import EventLog from '#models/event_log'

// Service to log significant events in the system for auditing purposes. Will never throw errors.
export class EventLoggerService {
  public logEvent(event: {
    name: string
    step?: string | null
    userId?: string | null
    context?: Object | null
    version?: number
  }) {
    // Use queueMicrotask to avoid blocking the main thread
    queueMicrotask(() => {
      // Create the event log entry asynchronously, we don't catch errors here to avoid polluting logs
      EventLog.create(event).catch(() => {})
    })
  }
}
