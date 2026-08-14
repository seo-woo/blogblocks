export function extractJsonObject(raw: string): Record<string, unknown> | null {
  let t = (raw || '').trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    const data: unknown = JSON.parse(t.slice(start, end + 1))
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    return data as Record<string, unknown>
  } catch {
    return null
  }
}

export function asStr(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}
