import { TONE_BLOCK } from '../lib/ai'
import { asStr, extractJsonObject } from '../lib/parseJson'
import { FOOD_MAX, type FoodContent, type FoodDish, type State } from '../types'

export function buildFoodFillPrompt(state: State): string {
  return (
    '맛집 리뷰 초안용 JSON만 작성해 주세요. 스튜디오가 HTML로 렌더합니다.\n\n' +
    '# 절대 규칙\n' +
    '- 코드펜스·설명 없이 JSON 객체 하나만 출력하세요.\n' +
    '- 아래 스키마 키만 사용하세요. images 필드는 넣지 마세요.\n' +
    TONE_BLOCK +
    '- 목표 분량 감각: ' + state.length + '\n\n' +
    '# 가게 정보\n' +
    '- 가게: ' + (state.foodName || '[미입력]') + '\n' +
    '- 위치: ' + (state.foodArea || '[미입력]') + '\n' +
    '- 종류: ' + (state.foodCuisine || '[미입력]') + '\n' +
    '- 방문: ' + (state.foodVisit || '[미입력]') + '\n' +
    '- 가격대: ' + (state.foodPrice || '[미입력]') + '\n' +
    '- 작성자 메모(사실): ' + (state.foodMemo?.trim() || '[없음 — 과장 없이 무난한 초안]') + '\n\n' +
    '# 스키마\n' +
    '{\n' +
    '  "title": "클릭을 부르는 제목",\n' +
    '  "subtitle": "한 줄 소개",\n' +
    '  "exteriorBody": "외관 후기 2~4문장",\n' +
    '  "interiorBody": "내부 후기 2~4문장",\n' +
    '  "dishes": [ { "name": "메뉴 이름", "body": "맛·양·플레이팅 2~4문장" } ],\n' +
    '  "score": "4.5",\n' +
    '  "reviewOne": "한 줄 총평",\n' +
    '  "reviewBody": "총평 2~4문장"\n' +
    '}\n' +
    '- dishes는 2~3개. score는 "5","4.5","4","3.5","3","2.5","2","1.5","1" 중 하나.\n'
  )
}

export function parseFoodContentResponse(raw: string, prev: FoodContent): FoodContent | null {
  const o = extractJsonObject(raw)
  if (!o) return null
  const dishesRaw = Array.isArray(o.dishes) ? o.dishes : []
  const dishes: FoodDish[] = dishesRaw.slice(0, FOOD_MAX.dishes).map((item, i) => {
    const d = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    return {
      name: asStr(d.name),
      body: asStr(d.body),
      images: prev.dishes[i]?.images?.length
        ? prev.dishes[i].images.map((im) => ({ ...im }))
        : [],
    }
  })
  if (!asStr(o.title) && !asStr(o.exteriorBody) && !asStr(o.interiorBody) && !dishes.length) {
    return null
  }
  return {
    title: asStr(o.title),
    subtitle: asStr(o.subtitle),
    exteriorBody: asStr(o.exteriorBody),
    exteriorImages: prev.exteriorImages.map((im) => ({ ...im })),
    interiorBody: asStr(o.interiorBody),
    interiorImages: prev.interiorImages.map((im) => ({ ...im })),
    dishes: dishes.length ? dishes : prev.dishes,
    score: asStr(o.score),
    reviewOne: asStr(o.reviewOne),
    reviewBody: asStr(o.reviewBody),
  }
}
