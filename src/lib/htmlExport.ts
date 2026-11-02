export function htmlCharCount(html: string): number {
  return [...html].length
}

export function formatHtmlSize(chars: number): string {
  if (chars < 1000) return `${chars}자`
  if (chars < 1_000_000) return `약 ${(chars / 1000).toFixed(1)}천 자`
  return `약 ${(chars / 1_000_000).toFixed(1)}백만 자`
}

/**
 * 일반 편집기 붙여넣기용.
 * 본문 HTML은 태그만으로 이뤄져 있어 그대로 쓰지만, 혹시 섞여 들어온
 * <style>·<script>는 붙여넣기에서 문제가 되므로 잘라낸다.
 */
export function prepareRichPasteHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim()
}

export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.innerText || el.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
}
