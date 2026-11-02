import type { SeoTable } from '../types'

/**
 * 표를 사람이 고치기 쉬운 텍스트로 주고받는다.
 * 첫 줄 = 머리글, 칸 구분 = |
 */
export function tableToText(t: SeoTable | null): string {
  if (!t) return ''
  const lines: string[] = []
  if (t.headers.length) lines.push(t.headers.join(' | '))
  for (const r of t.rows) lines.push(r.join(' | '))
  return lines.join('\n')
}

export function textToTable(text: string): SeoTable | null {
  const lines = String(text ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return null
  const cells = lines.map((l) => l.split('|').map((c) => c.trim()))
  const [headers, ...rows] = cells
  return { headers, rows }
}
