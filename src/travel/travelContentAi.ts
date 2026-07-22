import {
  emptyPoi,
  emptyTravelContent,
  TRAVEL_SECTIONS,
  type CostRow,
  type Faq,
  type Poi,
  type State,
  type Stop,
  type TravelContent,
} from '../types'
import { companionNote } from '../lib/prompt'

/** 인앱 AI용: TravelContent JSON만 요청 (HTML은 스튜디오가 렌더) */
export function buildTravelFillPrompt(state: State): string {
  const on = state.travelSections
  const enabled = TRAVEL_SECTIONS.filter((s) => on[s.key]).map((s) => s.label).join(', ')
  const fields: string[] = []

  if (on.hero) {
    fields.push(
      '  "heroTitle": "클릭을 부르는 제목",',
      '  "heroSubtitle": "한 줄 소개",',
    )
  }
  if (on.schedule) {
    fields.push(
      '  "stops": [ { "emoji": "☕", "time": "09:30", "place": "장소", "memo": "메모(선택)" } ],',
    )
  }
  if (on.spots) {
    fields.push(
      `  "spots": [ /* ${state.spotCount}개 */ { "name":"", "rating":"4.5", "feature":"", "review":"솔직 후기", "loc":"위치", "price":"입장료", "dur":"소요시간" } ],`,
    )
  }
  if (on.restaurants) {
    fields.push(
      `  "restaurants": [ /* ${state.restCount}개 */ { "name":"", "rating":"4.5", "feature":"대표메뉴", "review":"", "loc":"", "price":"가격대", "dur":"영업시간" } ],`,
    )
  }
  if (on.cafes) {
    fields.push(
      `  "cafes": [ /* ${state.cafeCount}개 */ { "name":"", "rating":"4.5", "feature":"시그니처", "review":"", "loc":"", "price":"가격대", "dur":"영업시간" } ],`,
    )
  }
  if (on.cost) {
    fields.push(
      '  "costRows": [ { "item":"교통", "amount":"10만원", "memo":"" } ],',
      '  "costTotal": "총액",',
      '  "costTotalMemo": "1인 기준 등",',
    )
  }
  if (on.tips) {
    fields.push('  "tips": [ "꿀팁 한 줄", "…" ],')
  }
  if (on.faq) {
    fields.push('  "faq": [ { "q":"질문", "a":"답변" } ],')
  }
  if (on.verdict) {
    fields.push(
      '  "verdictScore": "4.5",',
      '  "verdictOne": "한 줄 총평",',
      '  "verdictBody": "2~3문장 총평",',
      '  "verdictTarget": "이런 분께 추천",',
    )
  }
  if (on.cta) {
    fields.push(
      '  "ctaHeading": "구독/공감 유도 문구",',
      '  "ctaSub": "다음 글 예고",',
    )
  }

  return (
    '여행 블로그 초안용 JSON만 작성해 주세요. 스튜디오가 HTML로 렌더합니다.\n\n' +
    '# 절대 규칙\n' +
    '- 코드펜스·설명 없이 JSON 객체 하나만 출력하세요.\n' +
    '- 아래 스키마 키만 사용하고, 없는 섹션 키는 넣지 마세요.\n' +
    '- images 필드는 넣지 마세요 (사진은 사용자가 직접 올립니다).\n' +
    '- 장소/음식점/카페는 "추천"이 아니라 실제로 다녀온 것처럼 구체적으로 쓰세요.\n' +
    '- rating·verdictScore는 "5","4.5","4","3.5","3","2.5","2","1.5","1" 중 하나.\n' +
    '- 문체: ~어요/~습니다 혼용, 무게감+가벼운 유머, AI 상투적 마무리 금지, 문단 짧게.\n' +
    '- 목표 분량 감각: ' + state.length + '\n' +
    '- 실용 정보(비용·동선·예약) 톤: ' + (state.info ? '포함' : '생략·최소화') + '\n\n' +
    '# 여행 정보\n' +
    '- 여행지: ' + (state.place || '[미입력]') + '\n' +
    '- 지역: ' + state.region + '\n' +
    '- 동행: ' + state.companion + ' → ' + companionNote[state.companion] + '\n' +
    '- 기간/시기: ' + (state.period || '[미입력]') + '\n' +
    '- 한 줄 테마: ' + (state.theme || '[미입력]') + '\n' +
    '- 꼭 넣을 장소/에피소드: ' + (state.tepisode || '[없음]') + '\n' +
    '- 포함 섹션: ' + enabled + '\n\n' +
    '# 스키마 예시\n' +
    '{\n' + fields.join('\n') + '\n}\n'
  )
}

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function str(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function normalizeStop(raw: unknown): Stop {
  const o = asObj(raw)
  return {
    emoji: str(o.emoji).slice(0, 4),
    time: str(o.time),
    place: str(o.place),
    memo: str(o.memo),
  }
}

function normalizePoi(raw: unknown, prev?: Poi): Poi {
  const o = asObj(raw)
  return {
    ...emptyPoi,
    name: str(o.name),
    rating: str(o.rating),
    feature: str(o.feature),
    review: str(o.review),
    loc: str(o.loc),
    price: str(o.price),
    dur: str(o.dur),
    images: prev?.images?.length ? prev.images.map((im) => ({ ...im })) : [],
  }
}

function normalizeCost(raw: unknown): CostRow {
  const o = asObj(raw)
  return { item: str(o.item), amount: str(o.amount), memo: str(o.memo) }
}

function normalizeFaq(raw: unknown): Faq {
  const o = asObj(raw)
  return { q: str(o.q), a: str(o.a) }
}

function arr<T>(v: unknown, map: (x: unknown, i: number) => T): T[] {
  if (!Array.isArray(v)) return []
  return v.map(map)
}

/** AI 응답 → TravelContent. 기존 업로드 이미지는 인덱스 기준으로 유지. */
export function parseTravelContentResponse(
  raw: string,
  prev: TravelContent,
): TravelContent | null {
  let t = (raw || '').trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  let data: unknown
  try {
    data = JSON.parse(t.slice(start, end + 1))
  } catch {
    return null
  }
  const o = asObj(data)
  if (!Object.keys(o).length) return null

  const next: TravelContent = {
    ...emptyTravelContent,
    heroTitle: str(o.heroTitle),
    heroSubtitle: str(o.heroSubtitle),
    heroImages: prev.heroImages?.length ? prev.heroImages.map((im) => ({ ...im })) : [], // 사진·위치 유지
    stops: arr(o.stops, normalizeStop),
    spots: arr(o.spots, (x, i) => normalizePoi(x, prev.spots[i])),
    restaurants: arr(o.restaurants, (x, i) => normalizePoi(x, prev.restaurants[i])),
    cafes: arr(o.cafes, (x, i) => normalizePoi(x, prev.cafes[i])),
    costRows: arr(o.costRows, normalizeCost),
    costTotal: str(o.costTotal),
    costTotalMemo: str(o.costTotalMemo),
    tips: arr(o.tips, (x) => str(x)),
    faq: arr(o.faq, normalizeFaq),
    verdictScore: str(o.verdictScore),
    verdictOne: str(o.verdictOne),
    verdictBody: str(o.verdictBody),
    verdictTarget: str(o.verdictTarget),
    ctaHeading: str(o.ctaHeading),
    ctaSub: str(o.ctaSub),
  }
  return next
}

/** AI가 채운 배열 길이에 맞춰 개수 카운트 동기화 */
export function countsFromContent(content: TravelContent, state: State): Partial<State> {
  const clamp = (n: number) => Math.max(1, Math.min(6, n || 1))
  const patch: Partial<State> = {}
  if (state.travelSections.spots && content.spots.length) {
    patch.spotCount = clamp(content.spots.length)
  }
  if (state.travelSections.restaurants && content.restaurants.length) {
    patch.restCount = clamp(content.restaurants.length)
  }
  if (state.travelSections.cafes && content.cafes.length) {
    patch.cafeCount = clamp(content.cafes.length)
  }
  return patch
}
