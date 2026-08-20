export type Mode = 'lab' | 'travel' | 'food' | 'product'
export type Region = '국내' | '해외'
export type Companion = '혼자' | '짝꿍' | '가족' | '부모님'
export type View = 'draft' | 'prompt'

/** 여행 HTML 포인트 컬러 프리셋 */
export type TravelAccentId =
  | 'terracotta' | 'ocean' | 'forest' | 'wine' | 'charcoal' | 'sand'

export const TRAVEL_ACCENTS: ReadonlyArray<{
  id: TravelAccentId
  label: string
  color: string
}> = [
  { id: 'terracotta', label: '테라코타', color: '#d9633a' },
  { id: 'ocean', label: '오션', color: '#2a6f97' },
  { id: 'forest', label: '포레스트', color: '#3d6b4f' },
  { id: 'wine', label: '와인', color: '#8b3a4a' },
  { id: 'charcoal', label: '차콜', color: '#3d4450' },
  { id: 'sand', label: '샌드', color: '#b08968' },
]

export function travelAccentColor(id: TravelAccentId | string | undefined): string {
  return TRAVEL_ACCENTS.find((a) => a.id === id)?.color ?? TRAVEL_ACCENTS[0].color
}

/** 맛집 리뷰 포인트 컬러 (여행 프리셋 재사용) */
export type FoodAccentId = TravelAccentId
export const FOOD_ACCENTS = TRAVEL_ACCENTS
export const foodAccentColor = travelAccentColor

export type TravelSectionKey =
  | 'hero' | 'summary' | 'toc' | 'schedule' | 'course'
  | 'cost' | 'tips' | 'faq' | 'verdict' | 'cta'

export interface TravelSectionDef {
  key: TravelSectionKey
  label: string
}

// 순서 = 실제 글에 들어가는 순서 (레고 블록)
export const TRAVEL_SECTIONS: TravelSectionDef[] = [
  { key: 'hero', label: '히어로 (제목·대표사진)' },
  { key: 'summary', label: '요약 카드' },
  { key: 'toc', label: '목차' },
  { key: 'schedule', label: '일정 한눈에 보기' },
  { key: 'course', label: '코스 후기 (일정 순)' },
  { key: 'cost', label: '비용' },
  { key: 'tips', label: '꿀팁' },
  { key: 'faq', label: 'FAQ' },
  { key: 'verdict', label: '총평' },
  { key: 'cta', label: 'CTA (구독 유도)' },
]

/** 코스 한 칸의 종류 — 일정 순서대로 섞어 씀 */
export type VisitKind = 'spot' | 'restaurant' | 'cafe' | 'other'

export const VISIT_KINDS: ReadonlyArray<{ id: VisitKind; label: string; emoji: string }> = [
  { id: 'spot', label: '관광지', emoji: '📍' },
  { id: 'restaurant', label: '맛집', emoji: '🍜' },
  { id: 'cafe', label: '카페', emoji: '☕' },
  { id: 'other', label: '기타', emoji: '✨' },
]

/** 업로드 사진 + 4:3 크롭 위치 (object-position %, 기본 50/50) */
export interface TravelImage {
  src: string
  x: number
  y: number
}

/** 일정 순서 한 칸 = 한눈에 보기 + 상세 후기 */
export interface Visit {
  kind: VisitKind
  emoji: string
  time: string
  name: string
  memo: string
  rating: string
  feature: string
  review: string
  loc: string
  price: string
  dur: string
  images: TravelImage[]
}

/** @deprecated 마이그레이션용 */
export interface Stop { emoji: string; time: string; place: string; memo: string }
/** @deprecated 마이그레이션용 */
export interface Poi {
  name: string; rating: string; feature: string; review: string
  loc: string; price: string; dur: string; images: TravelImage[]
}
export interface CostRow { item: string; amount: string; memo: string }
export interface Faq { q: string; a: string }

export interface TravelContent {
  heroTitle: string; heroSubtitle: string; heroImages: TravelImage[]
  /** 일정 순 코스 (맛집·카페·관광지 섞어 씀) */
  visits: Visit[]
  costRows: CostRow[]; costTotal: string; costTotalMemo: string
  tips: string[]
  faq: Faq[]
  verdictScore: string; verdictOne: string; verdictBody: string; verdictTarget: string
  ctaHeading: string; ctaSub: string
  /** @deprecated 마이그레이션용 — visits 로 이전 */
  stops?: Stop[]
  /** @deprecated */
  spots?: Poi[]
  /** @deprecated */
  restaurants?: Poi[]
  /** @deprecated */
  cafes?: Poi[]
}

/** 장소/히어로당 최대 사진 수 (용량·붙여넣기 부담 완화) */
export const MAX_IMAGES = 6

/** 맛집 리뷰 섹션별 사진 한도 */
export const FOOD_MAX = {
  exterior: 1,
  interior: 3,
  dishes: 10, // 메뉴(항목) 개수 상한
  dishImages: 3, // 메뉴당 사진
} as const

/** 제품 리뷰 섹션별 사진 한도 */
export const PRODUCT_MAX = {
  unbox: 3,
  design: 5,
  usage: 10,
} as const

export function clampPos(n: number): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return 50
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function toTravelImage(v: unknown): TravelImage | null {
  if (typeof v === 'string' && v) return { src: v, x: 50, y: 50 }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.src === 'string' && o.src) {
      return { src: o.src, x: clampPos(Number(o.x)), y: clampPos(Number(o.y)) }
    }
  }
  return null
}

export const emptyPoi: Poi = {
  name: '', rating: '', feature: '', review: '', loc: '', price: '', dur: '', images: [],
}
export const emptyStop: Stop = { emoji: '', time: '', place: '', memo: '' }
export const emptyVisit: Visit = {
  kind: 'spot',
  emoji: '', time: '', name: '', memo: '',
  rating: '', feature: '', review: '', loc: '', price: '', dur: '', images: [],
}
export const emptyTravelContent: TravelContent = {
  heroTitle: '', heroSubtitle: '', heroImages: [],
  visits: [],
  costRows: [], costTotal: '', costTotalMemo: '',
  tips: [], faq: [],
  verdictScore: '', verdictOne: '', verdictBody: '', verdictTarget: '',
  ctaHeading: '', ctaSub: '',
}

function asVisitKind(v: unknown): VisitKind {
  return (VISIT_KINDS.some((k) => k.id === v) ? v : 'spot') as VisitKind
}

/** 구버전(heroImage / image / stops·spots·restaurants·cafes) → visits 보정 */
export function migrateTravelContent(raw: Partial<TravelContent> & {
  heroImage?: string
}): TravelContent {
  const asImages = (v: unknown, legacy?: string): TravelImage[] => {
    if (Array.isArray(v)) {
      return v.map(toTravelImage).filter((x): x is TravelImage => !!x)
    }
    if (typeof legacy === 'string' && legacy) return [{ src: legacy, x: 50, y: 50 }]
    return []
  }
  const migratePoi = (list: unknown): Poi[] => {
    if (!Array.isArray(list)) return []
    return list.map((p) => {
      const o = (p && typeof p === 'object') ? p as Record<string, unknown> : {}
      return {
        ...emptyPoi,
        name: String(o.name ?? ''),
        rating: String(o.rating ?? ''),
        feature: String(o.feature ?? ''),
        review: String(o.review ?? ''),
        loc: String(o.loc ?? ''),
        price: String(o.price ?? ''),
        dur: String(o.dur ?? ''),
        images: asImages(o.images, typeof o.image === 'string' ? o.image : undefined),
      }
    })
  }
  const migrateVisit = (list: unknown): Visit[] => {
    if (!Array.isArray(list)) return []
    return list.map((p) => {
      const o = (p && typeof p === 'object') ? p as Record<string, unknown> : {}
      const kind = asVisitKind(o.kind)
      const defEmoji = VISIT_KINDS.find((k) => k.id === kind)?.emoji || '📍'
      return {
        ...emptyVisit,
        kind,
        emoji: String(o.emoji ?? '') || defEmoji,
        time: String(o.time ?? ''),
        name: String(o.name ?? o.place ?? ''),
        memo: String(o.memo ?? ''),
        rating: String(o.rating ?? ''),
        feature: String(o.feature ?? ''),
        review: String(o.review ?? ''),
        loc: String(o.loc ?? ''),
        price: String(o.price ?? ''),
        dur: String(o.dur ?? ''),
        images: asImages(o.images),
      }
    })
  }

  let visits = migrateVisit(raw.visits)
  if (!visits.length) {
    const stops = Array.isArray(raw.stops) ? raw.stops : []
    const spots = migratePoi(raw.spots)
    const restaurants = migratePoi(raw.restaurants)
    const cafes = migratePoi(raw.cafes)
    const hasDetail = spots.length || restaurants.length || cafes.length
    if (hasDetail) {
      const fromPoi = (kind: VisitKind, list: Poi[]): Visit[] =>
        list.map((p) => ({
          ...emptyVisit,
          kind,
          emoji: VISIT_KINDS.find((k) => k.id === kind)?.emoji || '📍',
          name: p.name,
          rating: p.rating,
          feature: p.feature,
          review: p.review,
          loc: p.loc,
          price: p.price,
          dur: p.dur,
          images: p.images,
        }))
      // 구버전은 카테고리별이라 순서를 알 수 없음 → 관광지→맛집→카페 순으로 이어 붙임
      visits = [
        ...fromPoi('spot', spots),
        ...fromPoi('restaurant', restaurants),
        ...fromPoi('cafe', cafes),
      ]
      // 일정표만 있던 시각·메모를 이름 매칭으로 보강
      for (const s of stops) {
        const place = String((s as Stop).place || '')
        const hit = visits.find((v) => v.name && place && v.name === place)
        if (hit) {
          if (!hit.time) hit.time = String((s as Stop).time || '')
          if (!hit.memo) hit.memo = String((s as Stop).memo || '')
          if ((s as Stop).emoji) hit.emoji = String((s as Stop).emoji)
        }
      }
    } else if (stops.length) {
      visits = stops.map((s) => {
        const o = s as Stop
        return {
          ...emptyVisit,
          kind: 'other' as VisitKind,
          emoji: o.emoji || '📍',
          time: o.time || '',
          name: o.place || '',
          memo: o.memo || '',
        }
      })
    }
  }

  return {
    ...emptyTravelContent,
    heroTitle: String(raw.heroTitle ?? ''),
    heroSubtitle: String(raw.heroSubtitle ?? ''),
    heroImages: asImages(raw.heroImages, raw.heroImage),
    visits,
    costRows: Array.isArray(raw.costRows) ? raw.costRows : [],
    costTotal: String(raw.costTotal ?? ''),
    costTotalMemo: String(raw.costTotalMemo ?? ''),
    tips: Array.isArray(raw.tips) ? raw.tips : [],
    faq: Array.isArray(raw.faq) ? raw.faq : [],
    verdictScore: String(raw.verdictScore ?? ''),
    verdictOne: String(raw.verdictOne ?? ''),
    verdictBody: String(raw.verdictBody ?? ''),
    verdictTarget: String(raw.verdictTarget ?? ''),
    ctaHeading: String(raw.ctaHeading ?? ''),
    ctaSub: String(raw.ctaSub ?? ''),
  }
}

// ---- 맛집 리뷰 ----
/** 음식 한 가지 = 사진 + 설명 (추가 버튼으로 반복) */
export interface FoodDish {
  name: string
  body: string
  images: TravelImage[]
}

export const emptyFoodDish: FoodDish = {
  name: '',
  body: '',
  images: [],
}

export interface FoodContent {
  title: string
  subtitle: string
  exteriorBody: string
  exteriorImages: TravelImage[]
  interiorBody: string
  interiorImages: TravelImage[]
  /** @deprecated 마이그레이션용 — dishes 로 이전 */
  dishesBody?: string
  /** @deprecated 마이그레이션용 — dishes 로 이전 */
  dishesImages?: TravelImage[]
  dishes: FoodDish[]
  score: string
  reviewOne: string
  reviewBody: string
}

export const emptyFoodContent: FoodContent = {
  title: '',
  subtitle: '',
  exteriorBody: '',
  exteriorImages: [],
  interiorBody: '',
  interiorImages: [],
  dishes: [],
  score: '',
  reviewOne: '',
  reviewBody: '',
}

export function migrateFoodContent(raw: Partial<FoodContent> | undefined | null): FoodContent {
  if (!raw || typeof raw !== 'object') return { ...emptyFoodContent }
  const asImages = (v: unknown, max: number): TravelImage[] => {
    if (!Array.isArray(v)) return []
    return v.map(toTravelImage).filter((x): x is TravelImage => !!x).slice(0, max)
  }

  let dishes: FoodDish[] = []
  if (Array.isArray(raw.dishes) && raw.dishes.length) {
    dishes = raw.dishes.slice(0, FOOD_MAX.dishes).map((d) => {
      const o = (d && typeof d === 'object') ? d as unknown as Record<string, unknown> : {}
      return {
        name: String(o.name ?? ''),
        body: String(o.body ?? ''),
        images: asImages(o.images, FOOD_MAX.dishImages),
      }
    })
  } else {
    // 구버전: 사진 여러 장 + 공통 본문 → 메뉴별로 쪼갬
    const legacyImgs = asImages(raw.dishesImages, FOOD_MAX.dishes)
    const legacyBody = String(raw.dishesBody ?? '')
    if (legacyImgs.length || legacyBody.trim()) {
      if (legacyImgs.length) {
        dishes = legacyImgs.map((im, i) => ({
          name: '',
          body: i === 0 ? legacyBody : '',
          images: [im],
        }))
      } else {
        dishes = [{ name: '', body: legacyBody, images: [] }]
      }
    }
  }

  return {
    ...emptyFoodContent,
    title: String(raw.title ?? ''),
    subtitle: String(raw.subtitle ?? ''),
    exteriorBody: String(raw.exteriorBody ?? ''),
    exteriorImages: asImages(raw.exteriorImages, FOOD_MAX.exterior),
    interiorBody: String(raw.interiorBody ?? ''),
    interiorImages: asImages(raw.interiorImages, FOOD_MAX.interior),
    dishes,
    score: String(raw.score ?? ''),
    reviewOne: String(raw.reviewOne ?? ''),
    reviewBody: String(raw.reviewBody ?? ''),
  }
}

// ---- 제품 리뷰 ----
export type ProductAccentId = TravelAccentId
export const PRODUCT_ACCENTS = TRAVEL_ACCENTS
export const productAccentColor = travelAccentColor

export interface ProductContent {
  title: string
  subtitle: string
  unboxBody: string
  unboxImages: TravelImage[]
  designBody: string
  designImages: TravelImage[]
  usageBody: string
  usageImages: TravelImage[]
  score: string
  reviewOne: string
  reviewBody: string
  pros: string
  cons: string
}

export const emptyProductContent: ProductContent = {
  title: '',
  subtitle: '',
  unboxBody: '',
  unboxImages: [],
  designBody: '',
  designImages: [],
  usageBody: '',
  usageImages: [],
  score: '',
  reviewOne: '',
  reviewBody: '',
  pros: '',
  cons: '',
}

export function migrateProductContent(raw: Partial<ProductContent> | undefined | null): ProductContent {
  if (!raw || typeof raw !== 'object') return { ...emptyProductContent }
  const asImages = (v: unknown, max: number): TravelImage[] => {
    if (!Array.isArray(v)) return []
    return v.map(toTravelImage).filter((x): x is TravelImage => !!x).slice(0, max)
  }
  return {
    ...emptyProductContent,
    title: String(raw.title ?? ''),
    subtitle: String(raw.subtitle ?? ''),
    unboxBody: String(raw.unboxBody ?? ''),
    unboxImages: asImages(raw.unboxImages, PRODUCT_MAX.unbox),
    designBody: String(raw.designBody ?? ''),
    designImages: asImages(raw.designImages, PRODUCT_MAX.design),
    usageBody: String(raw.usageBody ?? ''),
    usageImages: asImages(raw.usageImages, PRODUCT_MAX.usage),
    score: String(raw.score ?? ''),
    reviewOne: String(raw.reviewOne ?? ''),
    reviewBody: String(raw.reviewBody ?? ''),
    pros: String(raw.pros ?? ''),
    cons: String(raw.cons ?? ''),
  }
}

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
  scheduleStyle: 'table' | 'timeline' | 'grid'
  travelAccent: TravelAccentId
  // 직접 작성한 내용 (비어 있으면 예시/자리표시자로 렌더)
  travelContent: TravelContent
  // food review
  foodName: string
  foodArea: string
  foodCuisine: string
  foodVisit: string
  foodPrice: string
  foodAccent: FoodAccentId
  foodContent: FoodContent
  /** 자동 작성에 참고할 실제 후기 포인트 */
  foodMemo: string
  // product review
  productName: string
  productBrand: string
  productCategory: string
  productChannel: string
  productPrice: string
  productAccent: ProductAccentId
  productContent: ProductContent
  productMemo: string
}

export const initialState: State = {
  mode: 'lab',
  region: '해외',
  companion: '부모님',
  length: '보통 (약 1,500~2,000자)',
  topic: '', tools: '', before: '', after: '', result: '', episode: '',
  place: '', period: '', theme: '', tepisode: '', info: true,
  travelSections: {
    hero: true, summary: true, toc: true, schedule: true, course: true,
    cost: true, tips: true, faq: true, verdict: true, cta: true,
  },
  scheduleStyle: 'grid',
  travelAccent: 'terracotta',
  travelContent: emptyTravelContent,
  foodName: '',
  foodArea: '',
  foodCuisine: '',
  foodVisit: '',
  foodPrice: '',
  foodAccent: 'wine',
  foodContent: emptyFoodContent,
  foodMemo: '',
  productName: '',
  productBrand: '',
  productCategory: '',
  productChannel: '',
  productPrice: '',
  productAccent: 'charcoal',
  productContent: emptyProductContent,
  productMemo: '',
}
