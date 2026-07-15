// Minimal markdown → HTML converter for the generated draft.
// Ported verbatim from the original prompt-studio app.
export function mdToHtml(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = md.replace(/\r/g, '').split('\n')
  let html = ''
  let listType: 'ul' | 'ol' | null = null

  function closeList() {
    if (listType) {
      html += '</' + listType + '>'
      listType = null
    }
  }
  function inline(t: string): string {
    t = esc(t)
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/\[사진:\s*([^\]]*)\]/g, '<span class="photo">📷 $1</span>')
    return t
  }

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (/^\s*$/.test(ln)) { closeList(); continue }
    const h = ln.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      closeList()
      html += '<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'
      continue
    }
    if (/^\s*[-*]\s+/.test(ln)) {
      if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul' }
      html += '<li>' + inline(ln.replace(/^\s*[-*]\s+/, '')) + '</li>'
      continue
    }
    if (/^\s*\d+\.\s+/.test(ln)) {
      if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol' }
      html += '<li>' + inline(ln.replace(/^\s*\d+\.\s+/, '')) + '</li>'
      continue
    }
    if (/^\s*---+\s*$/.test(ln)) { closeList(); html += '<hr>'; continue }
    closeList()
    html += '<p>' + inline(ln) + '</p>'
  }
  closeList()
  return html
}
