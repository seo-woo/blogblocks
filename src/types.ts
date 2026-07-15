export type Mode = 'lab' | 'travel'
export type Region = '국내' | '해외'
export type Companion = '혼자' | '짝꿍' | '가족' | '부모님'
export type View = 'draft' | 'prompt'

export type TravelSectionKey =
  | 'hero' | 'summary' | 'toc' | 'schedule' | 'spots'
  | 'restaurants' | 'cafes' | 'cost' | 'tips' | 'faq' | 'verdict' | 'cta'

export interface TravelSectionDef {
  key: TravelSectionKey
  label: string
  countKey?: 'spotCount' | 'restCount' | 'cafeCount'
}

// 순서 = 실제 글에 들어가는 순서 (레고 블록)
export const TRAVEL_SECTIONS: TravelSectionDef[] = [
  { key: 'hero', label: '히어로 (제목·대표사진)' },
  { key: 'summary', label: '요약 카드' },
  { key: 'toc', label: '목차' },
  { key: 'schedule', label: '일정표' },
  { key: 'spots', label: '관광지 / 장소', countKey: 'spotCount' },
  { key: 'restaurants', label: '맛집', countKey: 'restCount' },
  { key: 'cafes', label: '카페', countKey: 'cafeCount' },
  { key: 'cost', label: '비용' },
  { key: 'tips', label: '꿀팁' },
  { key: 'faq', label: 'FAQ' },
  { key: 'verdict', label: '총평' },
  { key: 'cta', label: 'CTA (구독 유도)' },
]

export interface State {
  mode: Mode
  region: Region
  companion: Companion
  length: string
  // lab fields
  topic: string
  tools: string
  before: string
  after: string
  result: string
  episode: string
  // travel fields
  place: string
  period: string
  theme: string
  tepisode: string
  info: boolean
  // travel HTML template — section composition
  travelSections: Record<TravelSectionKey, boolean>
  spotCount: number
  restCount: number
  cafeCount: number
  scheduleStyle: 'table' | 'timeline' | 'grid'
}

export const initialState: State = {
  mode: 'lab',
  region: '해외',
  companion: '부모님',
  length: '보통 (약 1,500~2,000자)',
  topic: '', tools: '', before: '', after: '', result: '', episode: '',
  place: '', period: '', theme: '', tepisode: '', info: true,
  travelSections: {
    hero: true, summary: true, toc: true, schedule: true, spots: true,
    restaurants: true, cafes: true, cost: true, tips: true, faq: true,
    verdict: true, cta: true,
  },
  spotCount: 3,
  restCount: 2,
  cafeCount: 1,
  scheduleStyle: 'grid',
}
