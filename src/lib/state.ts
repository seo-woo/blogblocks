import {
  emptyTravelContent,
  initialState,
  migrateFoodContent,
  migrateProductContent,
  migrateTravelContent,
  TRAVEL_ACCENTS,
  type Mode,
  type State,
} from '../types'

const VALID_MODES: Mode[] = ['lab', 'travel', 'food', 'product']

export function hydrateState(raw: unknown): State {
  if (!raw || typeof raw !== 'object') return { ...initialState }
  const saved = raw as Record<string, unknown>
  const modeRaw = saved.mode as Mode
  const mode: Mode = VALID_MODES.includes(modeRaw) ? modeRaw : initialState.mode
  const oldSecs = (saved.travelSections && typeof saved.travelSections === 'object')
    ? saved.travelSections as Record<string, boolean>
    : {}
  const courseOn = typeof oldSecs.course === 'boolean'
    ? oldSecs.course
    : (oldSecs.spots || oldSecs.restaurants || oldSecs.cafes) !== false
  return {
    ...initialState,
    ...saved,
    mode,
    travelSections: {
      ...initialState.travelSections,
      hero: oldSecs.hero ?? true,
      summary: oldSecs.summary ?? true,
      toc: oldSecs.toc ?? true,
      schedule: oldSecs.schedule ?? true,
      course: courseOn,
      cost: oldSecs.cost ?? true,
      tips: oldSecs.tips ?? true,
      faq: oldSecs.faq ?? true,
      verdict: oldSecs.verdict ?? true,
      cta: oldSecs.cta ?? true,
    },
    travelContent: migrateTravelContent({ ...emptyTravelContent, ...(saved.travelContent as object || {}) }),
    travelAccent: TRAVEL_ACCENTS.some((a) => a.id === saved.travelAccent)
      ? saved.travelAccent as State['travelAccent']
      : initialState.travelAccent,
    foodAccent: TRAVEL_ACCENTS.some((a) => a.id === saved.foodAccent)
      ? saved.foodAccent as State['foodAccent']
      : initialState.foodAccent,
    foodContent: migrateFoodContent(saved.foodContent as State['foodContent']),
    productAccent: TRAVEL_ACCENTS.some((a) => a.id === saved.productAccent)
      ? saved.productAccent as State['productAccent']
      : initialState.productAccent,
    productContent: migrateProductContent(saved.productContent as State['productContent']),
  }
}

export function suggestDraftName(s: State): string {
  if (s.mode === 'product') {
    return s.productContent.title.trim() || s.productName.trim() || '제품 리뷰'
  }
  if (s.mode === 'food') {
    return s.foodContent.title.trim() || s.foodName.trim() || '맛집 리뷰'
  }
  if (s.mode === 'travel') {
    return s.travelContent.heroTitle.trim() || s.place.trim() || '여행'
  }
  return s.topic.trim() || 'AI 실험실'
}

export const MODE_LABEL: Record<Mode, string> = {
  lab: 'AI 실험실',
  travel: '여행',
  food: '맛집',
  product: '제품',
}
