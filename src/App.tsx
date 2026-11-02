import { useCallback, useEffect, useState } from 'react'
import { emptySeoContent, initialState, intentDef, type State } from './types'
import SeoPanel from './seo/SeoPanel'
import SeoOutput from './seo/SeoOutput'
import DraftsDialog from './components/DraftsDialog'
import { hydrateState } from './lib/state'

const STORE = 'prompt-studio-v1'

function loadState(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
    if (saved) return hydrateState(saved)
  } catch {
    /* ignore */
  }
  return { ...initialState }
}

export default function App() {
  const [state, setState] = useState<State>(loadState)
  const [draftsOpen, setDraftsOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  const set = useCallback(<K extends keyof State>(key: K, value: State[K]) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const openDrafts = useCallback(() => { setDraftsOpen(true) }, [])
  const closeDrafts = useCallback(() => { setDraftsOpen(false) }, [])
  const restoreDraft = useCallback((next: State) => { setState(next) }, [])

  const reset = useCallback(() => {
    if (!window.confirm('이번 글의 내용을 모두 지울까요?')) return
    setState((s) => ({
      ...initialState,
      field: s.field,
      intent: s.intent,
      length: s.length,
      imageMarkers: s.imageMarkers,
      content: { ...emptySeoContent, sections: [], faq: [], images: [], related: [], checks: [], references: [] },
    }))
  }, [])

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="glyph">🔬</div>
          <div>
            <h1>알쏭과학 스튜디오</h1>
            <p className="sub">궁금쓰 — 매일 하나씩 풀어보는 세상의 궁금증</p>
          </div>
        </div>
        <span className="eyebrow">{intentDef(state.intent).label} · {state.field}</span>
      </header>

      <div className="studio">
        <section className="panel">
          <div className="panel-head">
            <span className="eyebrow">01 · 조절판</span>
            <div className="actions panel-head-actions">
              <button type="button" className="btn" onClick={openDrafts}>
                임시 저장
              </button>
              <button type="button" className="btn" onClick={reset}>
                초기화
              </button>
            </div>
          </div>
          <div className="panel-body">
            <SeoPanel state={state} set={set} />

            <div className="tone">
              <span className="eyebrow">항상 지키는 원칙</span>
              <ul>
                <li>쉽게 설명하기</li>
                <li>도입부는 흥미·어그로</li>
                <li>간결하게 · 스캔해서 읽히게</li>
                <li>과학적 근거 확인하기</li>
                <li>확실한 사실과 추정 구분</li>
                <li>사진 비중 높게</li>
                <li>답을 앞에서 먼저</li>
                <li>궁금증이 풀리면 끝</li>
              </ul>
            </div>
          </div>
        </section>

        <SeoOutput state={state} set={set} />
      </div>

      <p className="foot">
        본문 탭에서 <strong>서식 복사</strong>·<strong>영어 서식</strong>·<strong>네이버 말투</strong>로
        복사해 티스토리·블로거·네이버 일반 글쓰기에 붙여넣으세요.
        핸드폰에서 쓴 글은 ‘임시 저장 → 파일로 보내기’로 PC에서 이어 쓸 수 있어요.
      </p>

      <DraftsDialog
        open={draftsOpen}
        state={state}
        onClose={closeDrafts}
        onRestore={restoreDraft}
      />
    </div>
  )
}
