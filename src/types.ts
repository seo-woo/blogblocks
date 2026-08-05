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
  { key: 'restaurants', label: '음식점', countKey: 'restCount' },
  { key: 'cafes', label: '카페', countKey: 'cafeCount' },
  { key: 'cost', label: '비용' },
  { key: 'tips', label: '꿀팁' },
  { key: 'faq', label: 'FAQ' },
  { key: 'verdict', label: '총평' },
  { key: 'cta', label: 'CTA (구독 유도)' },
]

// 스튜디오에서 직접 작성하는 실제 내용 (HTML을 몰라도 칸만 채우면 됨)
export interface Stop { emoji: string; time: string; place: string; memo: string }

/** 업로드 사진 + 4:3 크롭 위치 (object-position %, 기본 50/50) */
export interface TravelImage {
  src: string
  x: number
  y: number
}

export interface Poi {
  name: string; rating: string; feature: string; review: string
  loc: string; price: string; dur: string; images: TravelImage[]
}
export interface CostRow { item: string; amount: string; memo: string }
export interface Faq { q: string; a: string }

export interface TravelContent {
  heroTitle: string; heroSubtitle: string; heroImages: TravelImage[]
  stops: Stop[]
  spots: Poi[]; restaurants: Poi[]; cafes: Poi[]
  costRows: CostRow[]; costTotal: string; costTotalMemo: string
  tips: string[]
  faq: Faq[]
  verdictScore: string; verdictOne: string; verdictBody: string; verdictTarget: string
  ctaHeading: string; ctaSub: string
}

/** 장소/히어로당 최대 사진 수 (용량·붙여넣기 부담 완화) */
export const MAX_IMAGES = 6

/** 맛집 리뷰 섹션별 사진 한도 */
export const FOOD_MAX = {
  exterior: 1,
  interior: 3,
  dishes: 10,
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
export const emptyTravelContent: TravelContent = {
  heroTitle: '', heroSubtitle: '', heroImages: [],
  stops: [], spots: [], restaurants: [], cafes: [],
  costRows: [], costTotal: '', costTotalMemo: '',
  tips: [], faq: [],
  verdictScore: '', verdictOne: '', verdictBody: '', verdictTarget: '',
  ctaHeading: '', ctaSub: '',
}

/** 구버전(heroImage / image 단일 문자열·string[]) → TravelImage[] 보정 */
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
  return {
    ...emptyTravelContent,
    ...raw,
    heroImages: asImages(raw.heroImages, raw.heroImage),
    stops: Array.isArray(raw.stops) ? raw.stops : [],
    spots: migratePoi(raw.spots),
    restaurants: migratePoi(raw.restaurants),
    cafes: migratePoi(raw.cafes),
    costRows: Array.isArray(raw.costRows) ? raw.costRows : [],
    tips: Array.isArray(raw.tips) ? raw.tips : [],
    faq: Array.isArray(raw.faq) ? raw.faq : [],
  }
}

// ---- 맛집 리뷰 ----
export interface FoodContent {
  title: string
  subtitle: string
  exteriorBody: string
  exteriorImages: TravelImage[]
  interiorBody: string
  interiorImages: TravelImage[]
  dishesBody: string
  dishesImages: TravelImage[]
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
  dishesBody: '',
  dishesImages: [],
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
  return {
    ...emptyFoodContent,
    title: String(raw.title ?? ''),
    subtitle: String(raw.subtitle ?? ''),
    exteriorBody: String(raw.exteriorBody ?? ''),
    exteriorImages: asImages(raw.exteriorImages, FOOD_MAX.exterior),
    interiorBody: String(raw.interiorBody ?? ''),
    interiorImages: asImages(raw.interiorImages, FOOD_MAX.interior),
    dishesBody: String(raw.dishesBody ?? ''),
    dishesImages: asImages(raw.dishesImages, FOOD_MAX.dishes),
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
  spotCount: number
  restCount: number
  cafeCount: number
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
  // product review
  productName: string
  productBrand: string
  productCategory: string
  productChannel: string
  productPrice: string
  productAccent: ProductAccentId
  productContent: ProductContent
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
  travelAccent: 'terracotta',
  travelContent: emptyTravelContent,
  foodName: '',
  foodArea: '',
  foodCuisine: '',
  foodVisit: '',
  foodPrice: '',
  foodAccent: 'wine',
  foodContent: emptyFoodContent,
  productName: '',
  productBrand: '',
  productCategory: '',
  productChannel: '',
  productPrice: '',
  productAccent: 'charcoal',
  productContent: emptyProductContent,
}
