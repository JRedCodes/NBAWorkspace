// Safely extract a single string from any Express query/param value
export function qs(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0) return qs(value[0])
  return undefined
}

// Assert a route param is a string (params are always strings in practice)
export function param(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0] as string
  return String(value ?? '')
}
