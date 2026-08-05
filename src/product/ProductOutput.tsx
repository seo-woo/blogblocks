import { useMemo, useState } from 'react'
import type { State } from '../types'
import {
  buildProductPrompt,
  hasProductContent,
  renderProduct,
  wrapProductPreviewDoc,
} from './productTheme'
import { copyText } from '../lib/clipboard'

type OutView = 'preview' | 'prompt'

export default function ProductOutput({ state }: { state: State }) {
  const [view, setView] = useState<OutView>('preview')
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  const prompt = useMemo(() => buildProductPrompt(state), [state])
  const previewHtml = useMemo(() => renderProduct(state, 'preview'), [state])
  const templateHtml = useMemo(() => renderProduct(state, 'template'), [state])
  const filledHtml = useMemo(() => renderProduct(state, 'filled'), [state])
  const hasContent = useMemo(() => hasProductContent(state), [state])

  const shownHtml = hasContent ? filledHtml : previewHtml
  const doc = useMemo(() => wrapProductPreviewDoc(shownHtml), [shownHtml])
  const htmlToCopy = hasContent ? filledHtml : templateHtml

  return (
    <section className="panel out-wrap">
      <div className="panel-head">
        <div className="seg">
          <button aria-pressed={view === 'preview'} onClick={() => setView('preview')}>미리보기</button>
          <button aria-pressed={view === 'prompt'} onClick={() => setView('prompt')}>프롬프트</button>
        </div>
        {view === 'preview' ? (
          <div className="actions">
            <button
              className={'btn primary' + (copiedHtml ? ' copied' : '')}
              onClick={() => copyText(htmlToCopy, () => {
                setCopiedHtml(true)
                setTimeout(() => setCopiedHtml(false), 1600)
              })}
            >
              {copiedHtml ? '복사됨 ✓' : 'HTML 복사'}
            </button>
          </div>
        ) : (
          <div className="actions">
            <button
              className={'btn primary' + (copiedPrompt ? ' copied' : '')}
              onClick={() => copyText(prompt, () => {
                setCopiedPrompt(true)
                setTimeout(() => setCopiedPrompt(false), 1600)
              })}
            >
              {copiedPrompt ? '복사됨 ✓' : '복사'}
            </button>
          </div>
        )}
      </div>

      <div className="panel-body">
        {view === 'preview' ? (
          <div>
            <iframe
              title="제품 리뷰 미리보기"
              className="preview-frame"
              sandbox=""
              srcDoc={doc}
            />
            <p className="preview-note">
              {hasContent
                ? '✅ 작성한 내용으로 렌더된 미리보기예요. ‘HTML 복사’ → 티스토리 HTML 편집기에 붙여넣으세요.'
                : '지금은 예시 미리보기예요. 왼쪽 ‘내용 작성’에서 언박싱·디자인·사용기·총평을 채우면 완성본이 됩니다.'}
            </p>
          </div>
        ) : (
          <div>
            <p className="preview-note" style={{ marginBottom: 12 }}>
              외부 Claude에 붙여 제품 리뷰 내용을 채울 때 쓰는 지시문입니다.
            </p>
            <div className="out">{prompt}</div>
          </div>
        )}
      </div>
    </section>
  )
}
