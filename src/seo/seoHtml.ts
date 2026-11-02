import type { SeoContent, SeoSection, SeoTable, State } from '../types'

export function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** 줄바꿈 하나 = 문단 하나 */
function paras(text: string): string[] {
  return String(text ?? '').split(/\n+/).map((t) => t.trim()).filter(Boolean)
}

function pBlock(text: string): string {
  return paras(text).map((t) => `<p>${esc(t)}</p>`).join('\n')
}

/** "방전: …"처럼 앞 라벨이 있으면 굵게 */
function formatListItem(text: string): string {
  const m = /^([^:]{1,24}):\s*(.+)$/.exec(text)
  if (m) return `<strong>${esc(m[1])}:</strong> ${esc(m[2])}`
  return esc(text)
}

function listBlock(s: SeoSection): string {
  const items = s.list.map((t) => t.trim()).filter(Boolean)
  if (s.listType === 'none' || !items.length) return ''
  const tag = s.listType === 'ol' ? 'ol' : 'ul'
  return `<${tag}>\n${items.map((t) => `<li>${formatListItem(t)}</li>`).join('\n')}\n</${tag}>`
}

function tableBlock(t: SeoTable | null): string {
  if (!t) return ''
  const headers = t.headers.map((h) => h.trim()).filter(Boolean)
  const rows = t.rows.filter((r) => r.some((c) => c.trim()))
  if (!headers.length && !rows.length) return ''
  const width = Math.max(headers.length, ...rows.map((r) => r.length), 1)
  const cell = (v: string | undefined) => esc((v ?? '').trim())
  const head = headers.length
    ? `<thead>\n<tr>${Array.from({ length: width }, (_, i) => `<th>${cell(headers[i])}</th>`).join('')}</tr>\n</thead>\n`
    : ''
  const body = rows.length
    ? `<tbody>\n${rows.map((r) =>
      `<tr>${Array.from({ length: width }, (_, i) => `<td>${cell(r[i])}</td>`).join('')}</tr>`,
    ).join('\n')}\n</tbody>\n`
    : ''
  return `<table>\n${head}${body}</table>`
}

function noteBlock(note: string): string {
  const ps = paras(note)
  if (!ps.length) return ''
  return `<blockquote>\n${ps.map((t) => `<p>${esc(t)}</p>`).join('\n')}\n</blockquote>`
}

/** 티스토리에서 사진으로 바꿔 넣을 자리 */
function markerBlock(no: number, alt: string): string {
  const label = alt.trim() ? ` ${esc(alt.trim())}` : ''
  return `<p><strong>[이미지 ${no}]</strong>${label}</p>`
}

function sectionBlock(s: SeoSection): string {
  const parts = [
    s.heading.trim() ? `<h2>${esc(s.heading.trim())}</h2>` : '',
    pBlock(s.body),
    listBlock(s),
    tableBlock(s.table),
    noteBlock(s.note),
  ].filter(Boolean)
  return parts.join('\n')
}

/** FAQ 질문 — 앞에 붙은 'Q.' 표기를 정리하고 다시 붙인다 */
function faqQuestion(q: string): string {
  return 'Q. ' + q.trim().replace(/^Q[.):\s]+/i, '').trim()
}

/** 슬롯별 이미지 자리표시자 — 슬롯 하나에 여러 장이면 순서대로 */
function markersFor(c: SeoContent, slot: string, on: boolean): string {
  if (!on) return ''
  return c.images
    .map((img, i) => ({ img, no: i + 1 }))
    .filter(({ img }) => (img.slot || '').trim() === slot)
    .map(({ img, no }) => markerBlock(no, img.alt))
    .join('\n')
}

/** 참고자료 한 줄 — URL이 있으면 링크로 */
function refItem(line: string): string {
  const t = line.trim()
  if (!t) return ''
  const m = /^(.*?)\s*[—\-–]?\s*(https?:\/\/\S+)\s*$/i.exec(t)
  if (m) {
    const label = m[1].replace(/[—\-–]\s*$/, '').trim() || m[2]
    return `<li><a href="${esc(m[2])}" rel="noopener noreferrer" target="_blank">${esc(label)}</a></li>`
  }
  return `<li>${esc(t)}</li>`
}

function referencesBlock(refs: string[]): string {
  const items = refs.map(refItem).filter(Boolean)
  if (!items.length) return ''
  return `<h2>📚 참고자료</h2>\n<ul>\n${items.join('\n')}\n</ul>`
}

/**
 * 티스토리에 붙여넣을 본문 HTML.
 * 제목(h1)은 티스토리 제목 칸에 따로 넣으므로 본문에 넣지 않는다.
 */
export function renderSeoHtml(state: State): string {
  const c = state.content
  const on = state.imageMarkers
  const blocks: string[] = []

  const push = (html: string) => { if (html.trim()) blocks.push(html) }

  push(markersFor(c, 'top', on))
  push(pBlock(c.intro))
  push(markersFor(c, 'intro', on))

  if (c.answerHeading.trim() || c.answerBody.trim()) {
    push([
      c.answerHeading.trim() ? `<h2>${esc(c.answerHeading.trim())}</h2>` : '',
      pBlock(c.answerBody),
    ].filter(Boolean).join('\n'))
    push(markersFor(c, 'answer', on))
  }

  c.sections.forEach((s, i) => {
    push(sectionBlock(s))
    push(markersFor(c, `section${i + 1}`, on))
  })

  const faq = c.faq.filter((f) => f.q.trim() || f.a.trim())
  if (faq.length) {
    push(markersFor(c, 'faq', on))
    push([
      '<h2>🙋 자주 묻는 질문</h2>',
      ...faq.map((f) => [
        f.q.trim() ? `<h3>${esc(faqQuestion(f.q))}</h3>` : '',
        pBlock(f.a),
      ].filter(Boolean).join('\n')),
    ].join('\n'))
  }

  push(markersFor(c, 'end', on))
  push(pBlock(c.closing))
  push(referencesBlock(c.references))

  return blocks.join('\n\n')
}

/** 어느 슬롯에도 안 걸린 이미지 — 자리표시자가 본문에 안 들어간 것들 */
export function strayImages(state: State): number[] {
  const known = new Set(['top', 'intro', 'answer', 'faq', 'end'])
  const max = state.content.sections.length
  return state.content.images
    .map((img, i) => {
      const slot = (img.slot || '').trim()
      if (known.has(slot)) return -1
      const m = /^section(\d+)$/.exec(slot)
      if (m && Number(m[1]) >= 1 && Number(m[1]) <= max) return -1
      return i + 1
    })
    .filter((n) => n > 0)
}

const PREVIEW_CSS =
  'html,body{margin:0;background:#fff;color:#1f2126;-webkit-text-size-adjust:100%;}' +
  "body{padding:22px 16px 40px;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Segoe UI',Roboto,sans-serif;" +
  'font-size:16px;line-height:1.8;word-break:keep-all;overflow-wrap:anywhere;}' +
  'h2{font-size:20px;font-weight:800;letter-spacing:-.02em;margin:34px 0 12px;line-height:1.4;}' +
  'h3{font-size:16.5px;font-weight:700;margin:24px 0 8px;line-height:1.45;}' +
  'p{margin:0 0 14px;}' +
  'ul,ol{margin:0 0 16px;padding-left:22px;}' +
  'li{margin-bottom:7px;}' +
  'strong{font-weight:700;}' +
  'blockquote{margin:0 0 16px;padding:12px 16px;border-left:3px solid #d6d1c6;background:#f7f6f3;}' +
  'blockquote p:last-child{margin-bottom:0;}' +
  'table{width:100%;border-collapse:collapse;margin:0 0 18px;font-size:14.5px;}' +
  'th,td{border:1px solid #e0ddd6;padding:9px 11px;text-align:left;vertical-align:top;}' +
  'th{background:#f5f3ee;font-weight:700;}' +
    'a{color:#1a5fb4;text-decoration:underline;text-underline-offset:2px;}' +
  '@media (max-width:480px){body{padding:16px 12px 32px;font-size:15px;}h2{font-size:18px;}}'

export function wrapPreviewDoc(inner: string): string {
  return (
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>' + PREVIEW_CSS + '</style></head><body>' +
    (inner.trim() || '<p style="color:#9a9ca4;">아직 본문이 없습니다.</p>') +
    '</body></html>'
  )
}
