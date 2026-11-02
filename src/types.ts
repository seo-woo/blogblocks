/**
 * 「매일매일 과학이야기」 글 한 편의 데이터 모델.
 * 하루 1편 원칙 — 모드 구분 없이 "오늘의 궁금증" 하나만 다룬다.
 */

/** 궁금증 유형 — 제목 틀과 본문 뼈대를 결정한다 */
export type IntentId =
  | 'why' | 'what' | 'whatif' | 'how' | 'body' | 'compare' | 'truth' | 'daily'

export interface IntentDef {
  id: IntentId
  label: string
  /** 제목 틀 예시 */
  suffix: string
  /** AI에게 줄 본문 뼈대 힌트 */
  outline: string
}

export const INTENTS: ReadonlyArray<IntentDef> = [
  {
    id: 'why',
    label: '왜 그럴까',
    suffix: '왜 ~할까?',
    outline: '한 줄 답 → 실제로 벌어지는 일 → 왜 그렇게 됐는지 → 흔한 오해 하나',
  },
  {
    id: 'what',
    label: '무엇일까',
    suffix: '~은 무엇일까? / 가장 ~한 것은?',
    outline:
      '후보를 고르는 기준 한 줄 → 가장 유력한 답과 이유 → 다른 후보와 비교 → ' +
      '아직 사람마다 갈리는 지점(취향·정의·관측 한계)',
  },
  {
    id: 'whatif',
    label: '만약 ~한다면',
    suffix: '만약 ~하면 어떻게 될까?',
    outline: '한 줄 답 → 순서대로 벌어지는 일 → 그 이유 → 영화와 다른 점',
  },
  {
    id: 'how',
    label: '원리 · 작동 방식',
    suffix: '~는 어떻게 작동할까?',
    outline: '한 줄 요약 → 작동 순서 → 핵심이 되는 부분 → 여기까지가 한계',
  },
  {
    id: 'body',
    label: '몸에서 일어나는 일',
    suffix: '~할 때 몸에서는 무슨 일이?',
    outline: '언제 그런지 → 몸속에서 벌어지는 순서 → 왜 이렇게 진화했는지 → 걱정 안 해도 되는 선',
  },
  {
    id: 'compare',
    label: '차이 · 비교',
    suffix: 'A와 B는 왜 다를까?',
    outline: '결론 한 줄 → 비교표 → 차이가 생기는 이유 → 헷갈리는 지점',
  },
  {
    id: 'truth',
    label: '정말일까 (속설 검증)',
    suffix: '~하면 정말 ~될까?',
    outline: '사실/부분 사실/오해 판정 → 근거 → 이 말이 퍼진 이유 → 정리',
  },
  {
    id: 'daily',
    label: '생활 속 과학',
    suffix: '평소 지나쳤던 ~의 과학',
    outline: '익숙한 장면 → 숨어 있는 원리 → 집에서 확인하는 법 → 같은 원리가 쓰이는 곳',
  },
]

export function intentDef(id: IntentId | string | undefined): IntentDef {
  return INTENTS.find((i) => i.id === id) ?? INTENTS[0]
}

/** 분야 — 프롬프트 맥락과 사실 확인 강도에 쓰임 */
export const FIELDS: ReadonlyArray<string> = [
  '인체 · 몸', '우주 · 천문', '동물 · 생명', '지구 · 자연',
  '물리 · 화학', '생활 속 과학', '과학 · 기술',
]

/** 목표 분량 — 짧은 호흡이 기본 */
export const LENGTHS: ReadonlyArray<string> = [
  '아주 짧게 — 한 줄로 끝나는 궁금증 (800자 안팎)',
  '보통 — 원리를 두세 단계로 푸는 글 (1,200자 안팎)',
  '조금 길게 — 오해까지 바로잡는 글 (1,800자 안팎)',
]

// ---------- 본문 구조 ----------

export interface SeoTable {
  headers: string[]
  rows: string[][]
}

export type ListType = 'none' | 'ol' | 'ul'

/** H2 한 덩어리 */
export interface SeoSection {
  heading: string
  /** 문단 — 빈 줄로 구분 */
  body: string
  listType: ListType
  list: string[]
  table: SeoTable | null
  /** 주의할 점 등 — blockquote */
  note: string
}

export interface SeoFaq { q: string; a: string }

/** 이미지가 붙는 자리 */
export type ImageSlot = 'top' | 'intro' | 'answer' | 'faq' | 'end' | string

export interface SeoImage {
  /** 대표 이미지 1장 + 본문 이미지 4~6장 */
  role: 'cover' | 'body'
  slot: ImageSlot
  purpose: string
  prompt: string
  alt: string
}

export interface SeoPlan {
  mainKeyword: string
  subKeywords: string[]
  /** 티스토리·네이버·블로거 태그칸용 — 유입을 노리는 검색 태그 */
  tags: string[]
  intent: string
  audience: string
  edge: string
  titles: string[]
  meta: string
}

export interface SeoContent {
  plan: SeoPlan
  title: string
  /** 도입부 2~4문단 (빈 줄 구분) */
  intro: string
  answerHeading: string
  answerBody: string
  sections: SeoSection[]
  faq: SeoFaq[]
  closing: string
  /**
   * 참고자료 — 본문 맨 아래 목록.
   * 예: "Nature, How snakes lost their legs — https://www.nature.com/..."
   */
  references: string[]
  /** 발행 전 직접 확인해야 할 항목 (수치·연구·기관 발표 등) */
  checks: string[]
  images: SeoImage[]
  related: string[]
}

export const emptyPlan: SeoPlan = {
  mainKeyword: '', subKeywords: [], tags: [], intent: '', audience: '', edge: '',
  titles: [], meta: '',
}

export const emptySection: SeoSection = {
  heading: '', body: '', listType: 'none', list: [], table: null, note: '',
}

export const emptyImage: SeoImage = {
  role: 'body', slot: 'section1', purpose: '', prompt: '', alt: '',
}

export const emptySeoContent: SeoContent = {
  plan: emptyPlan,
  title: '',
  intro: '',
  answerHeading: '',
  answerBody: '',
  sections: [],
  faq: [],
  closing: '',
  references: [],
  checks: [],
  related: [],
  images: [],
}

export interface State {
  /** 오늘의 궁금증 — 독자가 검색할 법한 질문 한 줄 */
  topic: string
  intent: IntentId
  field: string
  /** 글의 전제·범위 (지구 대기 기준, 성인 기준 등) */
  target: string
  /** 이 질문을 검색할 사람 */
  reader: string
  /** 이미 확인한 사실 · 참고 자료 (지어내기 방지) */
  facts: string
  length: string
  /** 본문에 [이미지 N] 자리표시자를 넣을지 */
  imageMarkers: boolean
  content: SeoContent
}

export const initialState: State = {
  topic: '',
  intent: 'why',
  field: '인체 · 몸',
  target: '',
  reader: '',
  facts: '',
  length: LENGTHS[1],
  imageMarkers: true,
  content: emptySeoContent,
}

// ---------- 보정 ----------

function str(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function strList(v: unknown, max = 20): string[] {
  if (!Array.isArray(v)) return []
  return v.map(str).filter((s) => s.trim()).slice(0, max)
}

function asListType(v: unknown): ListType {
  return v === 'ol' || v === 'ul' ? v : 'none'
}

export function migrateTable(v: unknown): SeoTable | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  const headers = strList(o.headers, 6)
  const rowsRaw = Array.isArray(o.rows) ? o.rows : []
  const rows = rowsRaw
    .map((r) => (Array.isArray(r) ? r.map(str).slice(0, 6) : []))
    .filter((r) => r.length > 0)
    .slice(0, 20)
  if (!headers.length && !rows.length) return null
  return { headers, rows }
}

export function migrateSection(v: unknown): SeoSection {
  const o = (v && typeof v === 'object') ? v as Record<string, unknown> : {}
  return {
    heading: str(o.heading),
    body: str(o.body),
    listType: asListType(o.listType),
    list: strList(o.list, 30),
    table: migrateTable(o.table),
    note: str(o.note),
  }
}

export function migrateImage(v: unknown): SeoImage {
  const o = (v && typeof v === 'object') ? v as Record<string, unknown> : {}
  return {
    role: o.role === 'cover' ? 'cover' : 'body',
    slot: str(o.slot) || 'section1',
    purpose: str(o.purpose),
    prompt: str(o.prompt),
    alt: str(o.alt),
  }
}

export function migrateSeoContent(raw: unknown): SeoContent {
  if (!raw || typeof raw !== 'object') return { ...emptySeoContent }
  const o = raw as Record<string, unknown>
  const p = (o.plan && typeof o.plan === 'object') ? o.plan as Record<string, unknown> : {}
  return {
    plan: {
      mainKeyword: str(p.mainKeyword),
      subKeywords: strList(p.subKeywords, 12),
      tags: strList(p.tags, 12),
      intent: str(p.intent),
      audience: str(p.audience),
      edge: str(p.edge),
      titles: strList(p.titles, 5),
      meta: str(p.meta),
    },
    title: str(o.title),
    intro: str(o.intro),
    answerHeading: str(o.answerHeading),
    answerBody: str(o.answerBody),
    sections: Array.isArray(o.sections) ? o.sections.map(migrateSection).slice(0, 12) : [],
    faq: Array.isArray(o.faq)
      ? o.faq.map((f) => {
        const q = (f && typeof f === 'object') ? f as Record<string, unknown> : {}
        return { q: str(q.q), a: str(q.a) }
      }).slice(0, 8)
      : [],
    closing: str(o.closing),
    references: strList(o.references, 8),
    checks: strList(o.checks, 12),
    images: Array.isArray(o.images) ? o.images.map(migrateImage).slice(0, 8) : [],
    related: strList(o.related, 8),
  }
}

export function hasContent(c: SeoContent): boolean {
  if (c.title.trim() || c.intro.trim() || c.answerBody.trim() || c.closing.trim()) return true
  if (c.sections.some((s) => s.heading.trim() || s.body.trim())) return true
  if (c.faq.some((f) => f.q.trim() || f.a.trim())) return true
  return false
}

/** 이미지 슬롯 → 사람이 읽는 위치 이름 */
export function slotLabel(slot: string, sections: SeoSection[]): string {
  if (slot === 'top') return '글 맨 위 (대표 이미지)'
  if (slot === 'intro') return '도입부 아래'
  if (slot === 'answer') return '핵심 답변 아래'
  if (slot === 'faq') return 'FAQ 위'
  if (slot === 'end') return '마무리 위'
  const m = /^section(\d+)$/.exec(slot)
  if (m) {
    const i = Number(m[1]) - 1
    const h = sections[i]?.heading?.trim()
    return h ? `‘${h}’ 아래` : `${m[1]}번째 소제목 아래`
  }
  return slot || '위치 미정'
}
