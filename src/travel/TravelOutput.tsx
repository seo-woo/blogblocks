import { useMemo, useRef, useState } from 'react'
import type { State, TravelContent } from '../types'
import { buildTravelPrompt, hasTravelContent, renderTravel, wrapPreviewDoc } from './travelTheme'
import { buildTravelFillPrompt, parseTravelContentResponse } from './travelContentAi'
import { copyText } from '../lib/clipboard'

type OutView = 'preview' | 'prompt'

export default function TravelOutput({
  state,
  onAiFill,
  hasAI,
}: {
  state: State
  onAiFill: (content: TravelContent) => void
  hasAI: boolean
}) {
  const [view, setView] = useState<OutView>('preview')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'parse-error'>('idle')
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [justFilled, setJustFilled] = useState(false)
  const reqId = useRef(0)

  // 프롬프트 탭 = 외부 Claude용 HTML 채우기 지시문
  const prompt = useMemo(() => buildTravelPrompt(state), [state])
  // 인앱 AI = 내용 작성 칸(JSON) 채우기
  const fillPrompt = useMemo(() => buildTravelFillPrompt(state), [state])
  const previewHtml = useMemo(() => renderTravel(state, 'preview'), [state])
  const templateHtml = useMemo(() => renderTravel(state, 'template'), [state])
  const filledHtml = useMemo(() => renderTravel(state, 'filled'), [state])
  const hasContent = useMemo(() => hasTravelContent(state), [state])

  const shownHtml = hasContent ? filledHtml : previewHtml
  const doc = useMemo(() => wrapPreviewDoc(shownHtml), [shownHtml])
  const htmlToCopy = hasContent ? filledHtml : templateHtml

  function generate() {
    if (!hasAI) return
    if (!state.place.trim()) {
      window.alert("먼저 '여행지'를 입력해 주세요.")
      return
    }
    if (hasContent) {
      const ok = window.confirm(
        'AI가 ‘내용 작성’ 칸을 덮어씁니다. 계속할까요?\n(이미 올린 사진은 유지됩니다)',
      )
      if (!ok) return
    }
    const id = ++reqId.current
    setStatus('loading')
    setJustFilled(false)
    window.claude!.complete(fillPrompt).then(
      (text) => {
        if (id !== reqId.current) return
        const parsed = parseTravelContentResponse(text, state.travelContent)
        if (!parsed) {
          setStatus('parse-error')
          return
        }
        onAiFill(parsed)
        setStatus('idle')
        setJustFilled(true)
        setTimeout(() => setJustFilled(false), 4000)
      },
      () => {
        if (id !== reqId.current) return
        setStatus('error')
      },
    )
  }

  return (
    <section className="panel out-wrap">
      <div className="panel-head">
        <div className="seg">
          <button aria-pressed={view === 'preview'} onClick={() => setView('preview')}>미리보기</button>
          <button aria-pressed={view === 'prompt'} onClick={() => setView('prompt')}>프롬프트</button>
        </div>
        {view === 'preview' ? (
          <div className="actions">
            {hasAI && (
              <button className="btn" onClick={generate} disabled={status === 'loading'}>
                {status === 'loading' ? '생성 중…' : hasContent ? '다시 채우기' : 'AI로 채우기'}
              </button>
            )}
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
            {status === 'error' && (
              <div className="err" style={{ marginBottom: 12 }}>
                <strong>AI 채우기에 실패했어요.</strong><br />
                잠시 후 다시 시도하거나, <strong>프롬프트</strong> 탭에서 복사해 Claude에 붙여넣어 주세요.
              </div>
            )}
            {status === 'parse-error' && (
              <div className="err" style={{ marginBottom: 12 }}>
                <strong>AI 응답을 내용 칸에 넣지 못했어요.</strong><br />
                ‘다시 채우기’를 누르거나, <strong>프롬프트</strong> 탭에서 복사해 Claude에 붙여넣어 주세요.
              </div>
            )}
            {justFilled && (
              <div className="preview-note" style={{ marginBottom: 12 }}>
                ✅ AI가 <strong>내용 작성</strong> 칸을 채웠어요. 왼쪽 탭에서 고치고, 사진은 직접 올리면 됩니다.
              </div>
            )}
            <iframe
              title="티스토리 미리보기"
              className="preview-frame"
              sandbox=""
              srcDoc={doc}
            />
            <p className="preview-note">
              {hasContent
                ? '✅ ‘내용 작성’ 탭 내용으로 렌더된 미리보기예요. 칸을 고치면 바로 반영됩니다. ‘HTML 복사’ → 티스토리 HTML 편집기에 붙여넣으세요.'
                : hasAI
                  ? '지금은 디자인 미리보기(예시 문구)예요. ‘AI로 채우기’로 내용 칸을 채우거나, ‘내용 작성’ 탭에서 직접 입력하세요.'
                  : '‘내용 작성’ 탭에서 칸을 채우면 여기 완성 HTML이 만들어져요. 또는 ‘HTML 복사’로 빈 템플릿을 받거나 ‘프롬프트’ 탭을 Claude에 붙여넣으세요.'}
            </p>
          </div>
        ) : (
          <div>
            <p className="preview-note" style={{ marginBottom: 12 }}>
              외부 Claude에 붙여넣는용이에요. (페이지 안 ‘AI로 채우기’는 내용 작성 칸을 JSON으로 채웁니다)
            </p>
            <div className="out">{prompt}</div>
          </div>
        )}
      </div>
    </section>
  )
}
