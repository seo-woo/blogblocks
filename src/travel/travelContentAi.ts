import {
  emptyTravelContent,
  emptyVisit,
  VISIT_KINDS,
  TRAVEL_SECTIONS,
  type CostRow,
  type Faq,
  type State,
  type TravelContent,
  type Visit,
  type VisitKind,
} from '../types'
import { companionNote } from '../lib/prompt'
import { asStr, extractJsonObject } from '../lib/parseJson'

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
  if (on.schedule || on.course) {
    fields.push(
      '  "visits": [',
      '    { "kind":"cafe", "emoji":"☕", "time":"09:30", "name":"카페 이름", "memo":"일정 한줄", "rating":"4.5", "feature":"시그니처", "review":"솔직 후기", "loc":"위치", "price":"가격대", "dur":"영업시간" },',
      '    { "kind":"spot", "emoji":"📍", "time":"11:00", "name":"관광지", "memo":"", "rating":"4.5", "feature":"", "review":"솔직 후기", "loc":"위치", "price":"입장료", "dur":"소요시간" },',
      '    { "kind":"restaurant", "emoji":"🍜", "time":"13:00", "name":"맛집", "memo":"점심", "rating":"4.5", "feature":"대표메뉴", "review":"솔직 후기", "loc":"", "price":"가격대", "dur":"영업시간" }',
      '  ],',
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
    '- visits는 카테고리별이 아니라 실제 방문 시간 순서로 나열하세요. 맛집·카페·관광지를 섞어도 됩니다.\n' +
    '- kind는 "spot"(관광지), "restaurant"(맛집), "cafe"(카페), "other"(기타) 중 하나.\n' +
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

function asKind(v: unknown): VisitKind {
  return (VISIT_KINDS.some((k) => k.id === v) ? v : 'spot') as VisitKind
}

function normalizeVisit(raw: unknown, prev?: Visit): Visit {
  const o = asObj(raw)
  const kind = asKind(o.kind)
  const defEmoji = VISIT_KINDS.find((k) => k.id === kind)?.emoji || '📍'
  return {
    ...emptyVisit,
    kind,
    emoji: asStr(o.emoji).slice(0, 4) || defEmoji,
    time: asStr(o.time),
    name: asStr(o.name || o.place),
    memo: asStr(o.memo),
    rating: asStr(o.rating),
    feature: asStr(o.feature),
    review: asStr(o.review),
    loc: asStr(o.loc),
    price: asStr(o.price),
    dur: asStr(o.dur),
    images: prev?.images?.length ? prev.images.map((im) => ({ ...im })) : [],
  }
}

function normalizeCost(raw: unknown): CostRow {
  const o = asObj(raw)
  return { item: asStr(o.item), amount: asStr(o.amount), memo: asStr(o.memo) }
}

function normalizeFaq(raw: unknown): Faq {
  const o = asObj(raw)
  return { q: asStr(o.q), a: asStr(o.a) }
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
  const o = extractJsonObject(raw)
  if (!o) return null

  let visits = arr(o.visits, (x, i) => normalizeVisit(x, prev.visits[i]))
  // 구 스키마(spots/restaurants/cafes/stops)로 온 경우 보정
  if (!visits.length) {
    const fromList = (kind: VisitKind, list: unknown): Visit[] =>
      arr(list, (x) => normalizeVisit({ ...asObj(x), kind }, undefined))
    visits = [
      ...fromList('spot', o.spots),
      ...fromList('restaurant', o.restaurants),
      ...fromList('cafe', o.cafes),
    ]
    if (!visits.length && Array.isArray(o.stops)) {
      visits = arr(o.stops, (x) => {
        const s = asObj(x)
        return normalizeVisit({
          kind: 'other',
          emoji: s.emoji,
          time: s.time,
          name: s.place,
          memo: s.memo,
        })
      })
    }
  }

  const next: TravelContent = {
    ...emptyTravelContent,
    heroTitle: asStr(o.heroTitle),
    heroSubtitle: asStr(o.heroSubtitle),
    heroImages: prev.heroImages?.length ? prev.heroImages.map((im) => ({ ...im })) : [],
    visits,
    costRows: arr(o.costRows, normalizeCost),
    costTotal: asStr(o.costTotal),
    costTotalMemo: asStr(o.costTotalMemo),
    tips: arr(o.tips, (x) => asStr(x)),
    faq: arr(o.faq, normalizeFaq),
    verdictScore: asStr(o.verdictScore),
    verdictOne: asStr(o.verdictOne),
    verdictBody: asStr(o.verdictBody),
    verdictTarget: asStr(o.verdictTarget),
    ctaHeading: asStr(o.ctaHeading),
    ctaSub: asStr(o.ctaSub),
  }
  return next
}

/** @deprecated 카운트 동기화는 visits 자유 개수라 더 이상 필요 없음 */
export function countsFromContent(_content: TravelContent, _state: State): Partial<State> {
  return {}
}
