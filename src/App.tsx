import { useEffect, useMemo, useState } from 'react'
import { emptyTravelContent, initialState, type Mode, type State } from './types'
import LabFields from './lab/LabFields'
import LabOutput from './lab/LabOutput'
import TravelPanel from './travel/TravelPanel'
import TravelOutput from './travel/TravelOutput'

const STORE = 'prompt-studio-v1'

function loadState(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
    if (saved) {
      return {
        ...initialState,
        ...saved,
        // 중첩 객체는 기본값 위에 병합 (구버전 저장분에 없는 섹션 키 보정)
        travelSections: { ...initialState.travelSections, ...(saved.travelSections || {}) },
        travelContent: { ...emptyTravelContent, ...(saved.travelContent || {}) },
      }
    }
  } catch {
    /* ignore */
  }
  return { ...initialState }
}

const LENGTHS = [
  '짧게 (약 1,000~1,300자)',
  '보통 (약 1,500~2,000자)',
  '길게 (약 2,500자 이상)',
]

export default function App() {
  const [state, setState] = useState<State>(loadState)

  const hasAI = useMemo(
    () => !!(window.claude && typeof window.claude.complete === 'function'),
    [],
  )

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--accent',
      state.mode === 'lab' ? 'var(--lab)' : 'var(--travel)',
    )
  }, [state.mode])

  function set<K extends keyof State>(key: K, value: State[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function reset() {
    if (!window.confirm('입력한 내용을 모두 지울까요?')) return
    setState((s) => ({
      ...s,
      topic: '', tools: '', before: '', after: '', result: '', episode: '',
      place: '', period: '', theme: '', tepisode: '', info: true,
    }))
  }

  const glyph = state.mode === 'lab' ? '🧪' : '✈️'
  const modeTag = 'MODE · ' + (state.mode === 'lab' ? 'AI 작업 실험실' : '여행')

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="glyph">{glyph}</div>
          <div>
            <h1>프롬프트 스튜디오</h1>
            <p className="sub">입력을 채우면 붙여넣기용 초안·HTML이 완성됩니다</p>
          </div>
        </div>
        <span className="eyebrow">{modeTag}</span>
      </header>

      <div className="studio">
        {/* LEFT: controls */}
        <section className="panel">
          <div className="panel-head">
            <span className="eyebrow">01 · 조절판</span>
            <button className="btn" onClick={reset} style={{ padding: '5px 11px', fontSize: 12 }}>
              초기화
            </button>
          </div>
          <div className="panel-body">
            <div className="modes">
              <ModeButton active={state.mode === 'lab'} mode="lab"
                label="🧪 AI 작업 실험실" desc="실험 노트 · Before/After · 실전 팁" onSelect={set} />
              <ModeButton active={state.mode === 'travel'} mode="travel"
                label="✈️ 여행" desc="HTML 테마 · 섹션 조합 · 티스토리 붙여넣기" onSelect={set} />
            </div>

            {state.mode === 'lab'
              ? <LabFields state={state} set={set} />
              : <TravelPanel state={state} set={set} />}

            {/* Common: length */}
            <div className="field" style={{ marginTop: 16 }}>
              <label>목표 분량</label>
              <select value={state.length} onChange={(e) => set('length', e.target.value)}>
                {LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="tone">
              <span className="eyebrow">항상 적용되는 톤 규칙</span>
              <ul>
                <li>~어요 / ~습니다 혼용</li>
                <li>무게감 + 유머 한 방울</li>
                <li>AI 티 나는 마무리 금지</li>
                <li>문단 3~4줄, 모바일 우선</li>
                <li>이모지 소제목</li>
              </ul>
            </div>
          </div>
        </section>

        {/* RIGHT: output */}
        {state.mode === 'lab'
          ? <LabOutput state={state} hasAI={hasAI} />
          : <TravelOutput state={state} hasAI={hasAI} />}
      </div>

      <p className="foot">
        {state.mode === 'travel'
          ? 'HTML을 복사해 티스토리 글쓰기의 HTML 편집기에 붙여넣으면 그대로 발행됩니다.'
          : '완성된 프롬프트를 복사해서 Claude에게 붙여넣으면 초안이 나옵니다.'}
      </p>
    </div>
  )
}

function ModeButton(props: {
  active: boolean
  mode: Mode
  label: string
  desc: string
  onSelect: <K extends keyof State>(key: K, value: State[K]) => void
}) {
  return (
    <button className="mode-btn" aria-pressed={props.active} onClick={() => props.onSelect('mode', props.mode)}>
      <span className="m-label">{props.label}</span>
      <span className="m-desc">{props.desc}</span>
    </button>
  )
}
