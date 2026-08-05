import { useEffect, useMemo, useState } from 'react'
import {
  emptyFoodContent,
  emptyProductContent,
  emptyTravelContent,
  foodAccentColor,
  initialState,
  migrateFoodContent,
  migrateProductContent,
  migrateTravelContent,
  productAccentColor,
  TRAVEL_ACCENTS,
  travelAccentColor,
  type Mode,
  type State,
  type TravelContent,
} from './types'
import LabFields from './lab/LabFields'
import LabOutput from './lab/LabOutput'
import TravelPanel from './travel/TravelPanel'
import TravelOutput from './travel/TravelOutput'
import FoodPanel from './food/FoodPanel'
import FoodOutput from './food/FoodOutput'
import ProductPanel from './product/ProductPanel'
import ProductOutput from './product/ProductOutput'
import { countsFromContent } from './travel/travelContentAi'

const STORE = 'prompt-studio-v1'

const VALID_MODES: Mode[] = ['lab', 'travel', 'food', 'product']

function loadState(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
    if (saved) {
      const mode: Mode = VALID_MODES.includes(saved.mode) ? saved.mode : initialState.mode
      return {
        ...initialState,
        ...saved,
        mode,
        travelSections: { ...initialState.travelSections, ...(saved.travelSections || {}) },
        travelContent: migrateTravelContent({ ...emptyTravelContent, ...(saved.travelContent || {}) }),
        travelAccent: TRAVEL_ACCENTS.some((a) => a.id === saved.travelAccent)
          ? saved.travelAccent
          : initialState.travelAccent,
        foodAccent: TRAVEL_ACCENTS.some((a) => a.id === saved.foodAccent)
          ? saved.foodAccent
          : initialState.foodAccent,
        foodContent: migrateFoodContent(saved.foodContent),
        productAccent: TRAVEL_ACCENTS.some((a) => a.id === saved.productAccent)
          ? saved.productAccent
          : initialState.productAccent,
        productContent: migrateProductContent(saved.productContent),
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

function accentFor(mode: Mode, state: State): string {
  if (mode === 'lab') return 'var(--lab)'
  if (mode === 'food') return foodAccentColor(state.foodAccent)
  if (mode === 'product') return productAccentColor(state.productAccent)
  return travelAccentColor(state.travelAccent)
}

function modeMeta(mode: Mode): { glyph: string; tag: string } {
  if (mode === 'lab') return { glyph: '🧪', tag: 'MODE · AI 작업 실험실' }
  if (mode === 'food') return { glyph: '🍜', tag: 'MODE · 맛집 리뷰' }
  if (mode === 'product') return { glyph: '📦', tag: 'MODE · 제품 리뷰' }
  return { glyph: '✈️', tag: 'MODE · 여행' }
}

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
    document.documentElement.style.setProperty('--accent', accentFor(state.mode, state))
  }, [state.mode, state.travelAccent, state.foodAccent, state.productAccent])

  function set<K extends keyof State>(key: K, value: State[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function applyTravelFill(content: TravelContent) {
    setState((s) => ({
      ...s,
      travelContent: content,
      ...countsFromContent(content, s),
    }))
  }

  function reset() {
    if (!window.confirm('입력한 내용을 모두 지울까요?')) return
    setState((s) => ({
      ...initialState,
      mode: s.mode,
      travelSections: { ...initialState.travelSections },
      travelContent: {
        ...emptyTravelContent,
        stops: [],
        spots: [],
        restaurants: [],
        cafes: [],
        costRows: [],
        tips: [],
        faq: [],
      },
      foodContent: { ...emptyFoodContent, exteriorImages: [], interiorImages: [], dishesImages: [] },
      productContent: {
        ...emptyProductContent,
        unboxImages: [],
        designImages: [],
        usageImages: [],
      },
    }))
  }

  const { glyph, tag: modeTag } = modeMeta(state.mode)

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
        <section className="panel">
          <div className="panel-head">
            <span className="eyebrow">01 · 조절판</span>
            <button className="btn" onClick={reset} style={{ padding: '5px 11px', fontSize: 12 }}>
              초기화
            </button>
          </div>
          <div className="panel-body">
            <div className="modes modes-4">
              <ModeButton active={state.mode === 'lab'} mode="lab"
                label="🧪 AI 실험실" desc="실험 노트 · Before/After" onSelect={set} />
              <ModeButton active={state.mode === 'travel'} mode="travel"
                label="✈️ 여행" desc="섹션 조합 · HTML" onSelect={set} />
              <ModeButton active={state.mode === 'food'} mode="food"
                label="🍜 맛집 리뷰" desc="외관·내부·음식·총점" onSelect={set} />
              <ModeButton active={state.mode === 'product'} mode="product"
                label="📦 제품 리뷰" desc="언박싱·디자인·사용기" onSelect={set} />
            </div>

            {state.mode === 'lab' && <LabFields state={state} set={set} />}
            {state.mode === 'travel' && <TravelPanel state={state} set={set} />}
            {state.mode === 'food' && <FoodPanel state={state} set={set} />}
            {state.mode === 'product' && <ProductPanel state={state} set={set} />}

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

        {state.mode === 'lab' && <LabOutput state={state} hasAI={hasAI} />}
        {state.mode === 'travel' && (
          <TravelOutput state={state} onAiFill={applyTravelFill} hasAI={hasAI} />
        )}
        {state.mode === 'food' && <FoodOutput state={state} />}
        {state.mode === 'product' && <ProductOutput state={state} />}
      </div>

      <p className="foot">
        {state.mode === 'lab'
          ? '완성된 프롬프트를 복사해서 Claude에게 붙여넣으면 초안이 나옵니다.'
          : 'HTML을 복사해 티스토리 글쓰기의 HTML 편집기에 붙여넣으면 그대로 발행됩니다.'}
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
