import { memo, useCallback, useMemo, useState } from 'react'
import {
  formatHtmlSize,
  htmlCharCount,
  htmlToPlainText,
  prepareRichPasteHtml,
} from '../lib/htmlExport'
import { copyRichHtml } from '../lib/clipboard'
import { AiError } from '../lib/ai'
import { rewriteHtmlVariant, type FormatVariant } from '../lib/formatVariants'

type Props = {
  html: string
}

function copyPrepared(html: string, done: () => void) {
  const rich = prepareRichPasteHtml(html)
  copyRichHtml(rich, htmlToPlainText(rich), done)
}

export const HtmlCopyButtons = memo(function HtmlCopyButtons({ html }: Props) {
  const [copied, setCopied] = useState<'ko' | FormatVariant | null>(null)
  const [busy, setBusy] = useState<FormatVariant | null>(null)
  const [err, setErr] = useState('')

  const flash = useCallback((kind: 'ko' | FormatVariant) => {
    setCopied(kind)
    setTimeout(() => setCopied(null), 1600)
  }, [])

  const handleCopyKo = useCallback(() => {
    if (!html.trim()) return
    setErr('')
    copyPrepared(html, () => flash('ko'))
  }, [flash, html])

  const handleVariant = useCallback(async (variant: FormatVariant) => {
    if (!html.trim() || busy) return
    setBusy(variant)
    setErr('')
    try {
      const next = await rewriteHtmlVariant(html, variant)
      copyPrepared(next, () => flash(variant))
    } catch (e) {
      if (e instanceof AiError && e.code === 'NO_KEY') {
        setErr('왼쪽 ‘API 키’에서 Gemini 키를 먼저 저장해 주세요.')
      } else {
        setErr(e instanceof Error ? e.message : '서식 만들기에 실패했어요.')
      }
    } finally {
      setBusy(null)
    }
  }, [busy, flash, html])

  const handleEn = useCallback(() => {
    void handleVariant('en')
  }, [handleVariant])

  return (
    <div className="body-copy-bar">
      <div className="actions body-copy-actions">
        <button
          type="button"
          className={'btn primary' + (copied === 'ko' ? ' copied' : '')}
          onClick={handleCopyKo}
          disabled={!!busy || !html.trim()}
        >
          {copied === 'ko' ? '복사됨 ✓' : '서식 복사'}
        </button>
        <button
          type="button"
          className={'btn' + (copied === 'en' ? ' copied' : '')}
          onClick={handleEn}
          disabled={!!busy || !html.trim()}
        >
          {busy === 'en' ? '번역 중…' : copied === 'en' ? '복사됨 ✓' : '영어 서식'}
        </button>
      </div>
      {err ? <p className="preview-note warn body-copy-err">{err}</p> : null}
    </div>
  )
})

export const HtmlCopySizeNote = memo(function HtmlCopySizeNote({ html }: Props) {
  const chars = useMemo(() => htmlCharCount(html), [html])

  return (
    <div className="html-copy-notes">
      <p className="preview-note html-copy-hint-main">
        <strong>서식 복사</strong>는 원문 그대로, <strong>영어 서식</strong>은 블로거용 영어로 바꿔 복사합니다.
        일반 글쓰기(티스토리·블로거)에 붙여넣으면 됩니다.
      </p>
      <p className="preview-note html-size-note">원문 {formatHtmlSize(chars)}</p>
    </div>
  )
})
