import { TONE_BLOCK } from '../lib/ai'
import { asStr, extractJsonObject } from '../lib/parseJson'
import type { ProductContent, State } from '../types'

export function buildProductFillPrompt(state: State): string {
  return (
    '제품 리뷰 초안용 JSON만 작성해 주세요. 스튜디오가 HTML로 렌더합니다.\n\n' +
    '# 절대 규칙\n' +
    '- 코드펜스·설명 없이 JSON 객체 하나만 출력하세요.\n' +
    '- 아래 스키마 키만 사용하세요. images 필드는 넣지 마세요.\n' +
    TONE_BLOCK +
    '- 목표 분량 감각: ' + state.length + '\n\n' +
    '# 제품 정보\n' +
    '- 제품: ' + (state.productName || '[미입력]') + '\n' +
    '- 브랜드: ' + (state.productBrand || '[미입력]') + '\n' +
    '- 카테고리: ' + (state.productCategory || '[미입력]') + '\n' +
    '- 구매처: ' + (state.productChannel || '[미입력]') + '\n' +
    '- 가격: ' + (state.productPrice || '[미입력]') + '\n' +
    '- 작성자 메모(사실): ' + (state.productMemo?.trim() || '[없음 — 과장 없이 무난한 초안]') + '\n\n' +
    '# 스키마\n' +
    '{\n' +
    '  "title": "클릭을 부르는 제목",\n' +
    '  "subtitle": "한 줄 소개",\n' +
    '  "unboxBody": "언박싱·구성 2~4문장",\n' +
    '  "designBody": "디자인·디테일 2~4문장",\n' +
    '  "usageBody": "사용기 문단",\n' +
    '  "pros": "장점 2~3줄",\n' +
    '  "cons": "단점 1~2줄",\n' +
    '  "score": "4.5",\n' +
    '  "reviewOne": "한 줄 총평",\n' +
    '  "reviewBody": "총평 2~4문장"\n' +
    '}\n' +
    '- score는 "5","4.5","4","3.5","3","2.5","2","1.5","1" 중 하나.\n' +
    '- 언박싱을 안 했다면 unboxBody는 빈 문자열("")로 두세요.\n'
  )
}

export function parseProductContentResponse(raw: string, prev: ProductContent): ProductContent | null {
  const o = extractJsonObject(raw)
  if (!o) return null
  if (!asStr(o.title) && !asStr(o.unboxBody) && !asStr(o.designBody) && !asStr(o.usageBody) && !asStr(o.reviewBody)) {
    return null
  }
  return {
    title: asStr(o.title),
    subtitle: asStr(o.subtitle),
    unboxBody: asStr(o.unboxBody),
    unboxImages: prev.unboxImages.map((im) => ({ ...im })),
    designBody: asStr(o.designBody),
    designImages: prev.designImages.map((im) => ({ ...im })),
    usageBody: asStr(o.usageBody),
    usageImages: prev.usageImages.map((im) => ({ ...im })),
    score: asStr(o.score),
    reviewOne: asStr(o.reviewOne),
    reviewBody: asStr(o.reviewBody),
    pros: asStr(o.pros),
    cons: asStr(o.cons),
  }
}
