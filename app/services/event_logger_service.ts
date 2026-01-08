import EventLog from '#models/event_log'

// Service to log significant events in the system for auditing purposes.
export class EventLoggerService {
  /**
   * Logs an event asynchronously. Will never throw errors.
   *
   * @param event Object containing event details.
   * @param event.name Name of the event. Should contain the action performed, e.g., 'user_login'.
   * @param event.step Optional step or phase of the event. E.g., 'started', 'completed'.
   * @param event.userId Optional ID of the user associated with the event.
   * @param event.context Optional additional context for the event.
   * @param event.version Optional version number of the event schema. Defaults to 1.
   */
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
