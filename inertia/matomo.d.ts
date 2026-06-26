// Adds a _mtm key to the global window object to store the matomo tag manager
interface Window {
  _mtm: Array<Record<string, unknown>>
}
