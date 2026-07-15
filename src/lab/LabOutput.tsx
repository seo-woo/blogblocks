import { useMemo, useRef, useState } from 'react'
import type { State } from '../types'
import { build } from '../lib/prompt'
import { mdToHtml } from '../lib/markdown'
import { copyText } from '../lib/clipboard'

type OutView = 'draft' | 'prompt'

export default function LabOutput({ state, hasAI }: { state: State; hasAI: boolean }) {
  const [view, setView] = useState<OutView>('draft')
  const [status, setStatus] = useState<'empty' | 'loading' | 'result' | 'error'>('empty')
  const [draftHtml, setDraftHtml] = useState('')
  const lastDraft = useRef('')
  const [copiedDraft, setCopiedDraft] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  const prompt = useMemo(() => build(state), [state])

  function generate() {
    if (!hasAI) return
    if (!state.topic.trim()) {
      window.alert("먼저 '실험 주제'를 입력해 주세요.")
      return
    }
    setView('draft')
    setStatus('loading')
    const full =
      build(state) +
      '\n\n결과는 마크다운으로, 제목(#)부터 시작해서 본문·마감 요소까지 한 번에 작성해 주세요.'
    window.claude!.complete(full).then(
      (text) => {
        lastDraft.current = text || ''
        setDraftHtml(mdToHtml(lastDraft.current))
        setStatus('result')
      },
      () => setStatus('error'),
    )
  }

  return (
    <section className="panel out-wrap">
      <div className="panel-head">
        <div className="seg">
          <button aria-pressed={view === 'draft'} onClick={() => setView('draft')}>초안</button>
          <button aria-pressed={view === 'prompt'} onClick={() => setView('prompt')}>프롬프트</button>
        </div>
        {view === 'draft' ? (
          <div className="actions">
            {status === 'result' && (
              <>
                <button className="btn" onClick={generate}>다시 생성</button>
                <button
                  className={'btn primary' + (copiedDraft ? ' copied' : '')}
                  onClick={() => copyText(lastDraft.current, () => {
                    setCopiedDraft(true)
                    setTimeout(() => setCopiedDraft(false), 1600)
                  })}
                >
                  {copiedDraft ? '복사됨 ✓' : '초안 복사'}
                </button>
              </>
            )}
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
        {view === 'draft' ? (
          <div>
            {status === 'empty' && (
              <div className="empty-state">
                <div className="big">✨</div>
                <p>입력을 채운 뒤 아래 버튼을 누르면<br />이 페이지 안에서 바로 초안이 완성됩니다.</p>
                <button className="btn primary big-gen" disabled={!hasAI} onClick={generate}>
                  초안 생성하기
                </button>
                {!hasAI && (
                  <div className="hint">
                    이 환경에선 페이지 내 생성이 지원되지 않아요. <strong>프롬프트</strong> 탭에서 복사해 Claude에 붙여넣어 주세요.
                  </div>
                )}
              </div>
            )}
            {status === 'loading' && (
              <div className="loading">
                <span className="spinner" /> 초안을 쓰는 중입니다… 잠시만요
              </div>
            )}
            {status === 'result' && (
              <div className="draft" dangerouslySetInnerHTML={{ __html: draftHtml }} />
            )}
            {status === 'error' && (
              <div className="err">
                <strong>초안 생성에 실패했어요.</strong><br />
                잠시 후 다시 시도하거나, <strong>프롬프트</strong> 탭에서 복사해 Claude에 붙여넣어 주세요.
              </div>
            )}
          </div>
        ) : (
          <div className="out">{prompt}</div>
        )}
      </div>
    </section>
  )
}
