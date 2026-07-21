import { useEffect, useMemo, useRef, useState } from 'react'
import type { State } from '../types'
import { buildTravelPrompt, hasTravelContent, renderTravel, wrapPreviewDoc } from './travelTheme'
import { copyText } from '../lib/clipboard'

type OutView = 'preview' | 'prompt'

/** AI 응답에서 순수 HTML(<div class="ps-post"> … </div>)만 추출 */
function extractHtml(raw: string): string {
  let t = (raw || '').trim()
  // 코드펜스 제거
  t = t.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '')
  const start = t.indexOf('<div class="ps-post"')
  const end = t.lastIndexOf('</div>')
  if (start !== -1 && end !== -1 && end > start) return t.slice(start, end + 6)
  return t
}

export default function TravelOutput({ state, hasAI }: { state: State; hasAI: boolean }) {
  const [view, setView] = useState<OutView>('preview')
  const [aiHtml, setAiHtml] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const reqId = useRef(0)

  const prompt = useMemo(() => buildTravelPrompt(state), [state])
  const previewHtml = useMemo(() => renderTravel(state, 'preview'), [state])
  const templateHtml = useMemo(() => renderTravel(state, 'template'), [state])
  const filledHtml = useMemo(() => renderTravel(state, 'filled'), [state])
  const hasContent = useMemo(() => hasTravelContent(state), [state])

  // 입력·섹션이 바뀌면 AI 결과는 더 이상 정확하지 않으므로 초기화 → 미리보기가 항상 현재 선택을 반영
  const signature = JSON.stringify({
    p: state.place, r: state.region, c: state.companion, per: state.period,
    th: state.theme, ep: state.tepisode, len: state.length, info: state.info,
    s: state.travelSections, sc: state.spotCount, rc: state.restCount, cc: state.cafeCount,
    ss: state.scheduleStyle,
  })
  useEffect(() => {
    setAiHtml(null)
    setStatus('idle')
  }, [signature])

  // 우선순위: 직접 작성한 내용 > AI 결과 > 예시(미리보기)/빈 템플릿(복사)
  const shownHtml = hasContent ? filledHtml : (aiHtml ?? previewHtml)
  const doc = useMemo(() => wrapPreviewDoc(shownHtml), [shownHtml])
  const htmlToCopy = hasContent ? filledHtml : (aiHtml ?? templateHtml)

  function generate() {
    if (!hasAI) return
    if (!state.place.trim()) {
      window.alert("먼저 '여행지'를 입력해 주세요.")
      return
    }
    const id = ++reqId.current
    setStatus('loading')
    window.claude!.complete(prompt).then(
      (text) => {
        if (id !== reqId.current) return
        setAiHtml(extractHtml(text))
        setStatus('idle')
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
                {status === 'loading' ? '생성 중…' : aiHtml ? '다시 생성' : 'AI로 채우기'}
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
            <iframe
              title="티스토리 미리보기"
              className="preview-frame"
              sandbox=""
              srcDoc={doc}
            />
            <p className="preview-note">
              {hasContent
                ? '✅ ‘내용 작성’ 탭에 입력한 내용으로 완성된 미리보기예요. ‘HTML 복사’ → 티스토리 HTML 편집기에 붙여넣으세요. (빈 칸은 [ ]로 표시됩니다)'
                : aiHtml
                  ? '✅ AI가 채운 완성본입니다. ‘HTML 복사’ → 티스토리 HTML 편집기에 붙여넣으세요.'
                  : hasAI
                    ? '지금은 디자인 미리보기(예시 문구)예요. ‘내용 작성’ 탭에서 직접 채우거나 ‘AI로 채우기’를 누르세요.'
                    : '‘내용 작성’ 탭에서 칸을 채우면 여기 완성 HTML이 만들어져요. 또는 ‘HTML 복사’로 빈 템플릿을 받거나 ‘프롬프트’ 탭을 Claude에 붙여넣으세요.'}
            </p>
          </div>
        ) : (
          <div className="out">{prompt}</div>
        )}
      </div>
    </section>
  )
}
