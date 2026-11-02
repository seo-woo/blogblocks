export function fallbackCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try { document.execCommand('copy') } catch { /* ignore */ }
  document.body.removeChild(ta)
}

export function copyText(text: string, done: () => void) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => { fallbackCopy(text); done() })
  } else {
    fallbackCopy(text)
    done()
  }
}

function fallbackCopyRich(html: string): boolean {
  try {
    const div = document.createElement('div')
    div.contentEditable = 'true'
    div.innerHTML = html
    div.style.position = 'fixed'
    div.style.left = '-9999px'
    div.style.opacity = '0'
    document.body.appendChild(div)
    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    const ok = document.execCommand('copy')
    document.body.removeChild(div)
    sel?.removeAllRanges()
    return ok
  } catch {
    return false
  }
}

/** 미리보기 서식 그대로 — 일반 글쓰기 편집기 붙여넣기용 */
export function copyRichHtml(html: string, plain: string, done: () => void) {
  const finishPlain = () => copyText(plain, done)

  if (navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    const blobHtml = new Blob([html], { type: 'text/html' })
    const blobPlain = new Blob([plain], { type: 'text/plain' })
    navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobPlain,
      }),
    ]).then(done, () => {
      if (!fallbackCopyRich(html)) finishPlain()
    })
    return
  }

  if (fallbackCopyRich(html)) {
    done()
    return
  }

  finishPlain()
}
