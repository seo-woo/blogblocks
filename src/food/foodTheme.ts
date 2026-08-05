import { foodAccentColor, type State, type TravelImage } from '../types'

/**
 * 맛집 리뷰 HTML 테마
 * 섹션: 히어로 · 한눈에 · 외관 · 내부 · 음식 · 총점/총평
 */

type Mode = 'template' | 'preview' | 'filled'

const FONT =
  "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Segoe UI',Roboto,'Helvetica Neue',sans-serif"
const INK = '#1f2126'
const SUB = '#52555e'
const MUTED = '#8b8e97'
const LINE = '#e6e2d9'
const LINE_STRONG = '#d6d1c6'
const H2 = `font-size:20px;font-weight:800;letter-spacing:-.02em;margin:0 0 14px;color:${INK};`
const DIVIDER = `<div style="border-top:1px solid ${LINE};margin:30px 0;"></div>`

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function starStr(score: number): string {
  const f = Math.max(0, Math.min(5, Math.round(score)))
  return '★'.repeat(f) + '☆'.repeat(5 - f)
}

export function hasFoodContent(s: State): boolean {
  const c = s.foodContent
  if (c.title || c.subtitle || c.exteriorBody || c.interiorBody || c.dishesBody) return true
  if (c.score || c.reviewOne || c.reviewBody) return true
  if (c.exteriorImages.length || c.interiorImages.length || c.dishesImages.length) return true
  return false
}

export function renderFood(state: State, mode: Mode): string {
  const ACCENT = foodAccentColor(state.foodAccent)
  const EYEBROW = `color:${ACCENT};letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-weight:800;`
  const C = state.foodContent

  const val = (x: string, ph: string) => (x && x.trim() ? esc(x.trim()) : `[${ph}]`)
  const pick = (cv: string | undefined, ph: string, sample: string) =>
    mode === 'template' ? `[${ph}]`
      : mode === 'filled' ? ((cv || '').trim() ? esc(cv as string) : `[${ph}]`)
        : (sample || `[${ph}]`)

  const name = val(state.foodName, '가게 이름')
  const area = val(state.foodArea, '지역·위치')
  const cuisine = val(state.foodCuisine, '음식 종류')
  const visit = val(state.foodVisit, '방문 시기')
  const price = val(state.foodPrice, '가격대')

  const photo = (desc: string) =>
    `<div style="margin:16px 0 0;border:1px dashed ${LINE_STRONG};border-radius:8px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:${MUTED};font-size:13px;">📷 [사진: ${desc}]</div>`
  const coverImg = (img: TravelImage, alt: string) =>
    `<div style="aspect-ratio:4/3;overflow:hidden;border-radius:8px;background:${LINE};">` +
      `<img src="${img.src}" alt="${esc(alt)}" style="width:100%;height:100%;object-fit:cover;object-position:${img.x}% ${img.y}%;display:block;">` +
    `</div>`
  const gallery = (srcs: TravelImage[] | undefined, alt: string, ph: string) => {
    const list = (srcs || []).filter((im) => im && im.src)
    if (mode !== 'filled' || !list.length) return photo(ph)
    if (list.length === 1) {
      return `<div style="margin:16px 0 0;">${coverImg(list[0], alt)}</div>`
    }
    const slides = list.map((im, i) =>
      `<div style="scroll-snap-align:start;">${coverImg(im, `${alt} ${i + 1}`)}</div>`,
    ).join('')
    return (
      `<div style="margin:16px 0 0;">` +
        `<div style="display:grid;grid-auto-flow:column;grid-auto-columns:100%;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:thin;border-radius:8px;">` +
          slides +
        `</div>` +
        `<div style="text-align:center;margin-top:8px;color:${MUTED};font-size:12px;">← 밀어서 넘기기 · ${list.length}장 →</div>` +
      `</div>`
    )
  }

  const body = (text: string, ph: string, sample: string) =>
    `<p style="margin:14px 0 0;color:${SUB};font-size:15.5px;line-height:1.8;white-space:pre-wrap;">${pick(text, ph, sample)}</p>`

  const sections: string[] = []

  // Hero
  let title: string
  if (mode === 'template') title = '[클릭을 부르는 제목 — 가게 이름·한 줄 소감]'
  else if (mode === 'filled') {
    title = C.title.trim()
      ? esc(C.title)
      : (state.foodName.trim() ? esc(state.foodName) : '[제목]')
  } else {
    title = state.foodName.trim()
      ? esc(state.foodName)
      : '이 동네 숨은 맛집, 솔직 후기'
  }
  const subtitle = pick(
    C.subtitle,
    '한 줄 소개',
    `${esc(state.foodCuisine || '한식')} 한 끼 — ${esc(state.foodArea || '우리 동네')}에서 만난 맛`,
  )
  sections.push(
    `<header style="text-align:center;padding:6px 0 4px;">` +
      `<div style="${EYEBROW}">FOOD REVIEW</div>` +
      `<h1 style="font-size:30px;line-height:1.3;margin:12px 0 12px;letter-spacing:-.03em;font-weight:800;color:${INK};">${title}</h1>` +
      `<p style="margin:0 auto;max-width:520px;color:${SUB};font-size:15px;">${subtitle}</p>` +
    `</header>`,
  )

  // At a glance
  const fact = (label: string, value: string) =>
    `<div><div style="font-size:12px;color:${MUTED};margin-bottom:3px;">${label}</div>` +
    `<div style="font-size:15px;font-weight:600;color:${INK};">${value}</div></div>`
  sections.push(
    `<section>` +
      `<div style="${EYEBROW} text-align:center;margin-bottom:16px;">한눈에 보기</div>` +
      `<div class="ps-facts" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">` +
        fact('가게', name) +
        fact('위치', area) +
        fact('종류', cuisine) +
        fact('방문', visit) +
        fact('가격대', price) +
        fact('테마', mode === 'preview' ? '솔직 방문 후기' : val(C.subtitle, '한 줄 테마')) +
      `</div>` +
    `</section>`,
  )

  // Exterior
  sections.push(
    `<section>` +
      `<h2 style="${H2}">🏢 외관</h2>` +
      gallery(C.exteriorImages, '외관', '외관 사진 1장') +
      body(
        C.exteriorBody,
        '외관 후기 — 위치·찾기·첫인상 (2~4문장)',
        '골목 안쪽에 조용히 자리한 가게예요. 간판이 작은 편이라 지도 없으면 지나칠 수 있어요. 정돈된 외관 덕분에 들어설 때부터 정갈한 느낌이 들었고, 주차는 인근 공영주차장을 이용했습니다.',
      ) +
    `</section>`,
  )

  // Interior
  sections.push(
    `<section>` +
      `<h2 style="${H2}">🪑 내부</h2>` +
      gallery(C.interiorImages, '내부', '내부 사진 1~3장') +
      body(
        C.interiorBody,
        '내부 후기 — 분위기·좌석·청결·서비스 (2~4문장)',
        '테이블 간격이 넉넉하고 조명이 따뜻한 편이에요. 소음이 너무 크지 않아 대화하기 좋았고, 직원분이 메뉴 추천을 자세히 해 주셨습니다. 화장실도 깔끔하게 관리되어 있어요.',
      ) +
    `</section>`,
  )

  // Food dishes
  sections.push(
    `<section>` +
      `<h2 style="${H2}">🍽 음식</h2>` +
      gallery(C.dishesImages, '음식', '음식 사진 1~10장') +
      body(
        C.dishesBody,
        '음식 후기 — 맛·양·플레이팅·가격 대비 (문단으로)',
        '대표 메뉴부터 시켰어요. 간이 세지 않고 재료 맛이 살아 있어 술술 들어갑니다. 양은 1인 기준으로 적당했고, 플레이팅도 과하지 않게 정갈해요. 가격 대비 만족도가 높아서 다음에 또 가고 싶을 정도였습니다.',
      ) +
    `</section>`,
  )

  // Score & review
  let vStars = '★★★★☆'
  let scoreLabel = '[총점]'
  if (mode === 'preview') {
    vStars = '★★★★☆'
    scoreLabel = '4.5'
  } else if (mode === 'filled') {
    const n = parseFloat(C.score)
    if (!isNaN(n) && n > 0) {
      vStars = starStr(n)
      scoreLabel = esc(C.score)
    }
  }
  sections.push(
    `<section>` +
      `<h2 style="${H2}">✍️ 총점 & 총평</h2>` +
      `<div style="font-size:22px;color:${ACCENT};font-weight:800;letter-spacing:2px;margin-bottom:6px;">${vStars}</div>` +
      `<div style="font-size:14px;color:${MUTED};margin-bottom:10px;">총점 ${mode === 'template' ? scoreLabel : scoreLabel}</div>` +
      `<div style="font-size:16px;font-weight:700;color:${INK};margin-bottom:10px;">${pick(C.reviewOne, '한 줄 총평', '다시 갈 이유가 분명한 가게')}</div>` +
      `<p style="margin:0;color:${SUB};font-size:15.5px;line-height:1.8;">${pick(
        C.reviewBody,
        '총평 본문 2~4문장',
        '맛·분위기·응대가 고르게 좋았어요. 아쉬운 점은 웨이팅이 생길 수 있다는 정도. 데이트나 가볍게 한 끼 하기에 추천합니다.',
      )}</p>` +
    `</section>`,
  )

  const mobileCss =
    `<style>` +
    `.ps-post{overflow-wrap:anywhere;word-break:keep-all;}` +
    `.ps-post img{max-width:100%;height:auto;}` +
    `@media (max-width:520px){` +
    `.ps-post{font-size:15px!important;}` +
    `.ps-post h1{font-size:24px!important;}` +
    `}` +
    `</style>`

  return (
    `<div class="ps-post" style="max-width:700px;margin:0 auto;padding:8px 0 40px;font-family:${FONT};color:${INK};font-size:16px;line-height:1.75;-webkit-text-size-adjust:100%;">` +
    mobileCss +
    sections.join(DIVIDER) +
    `</div>`
  )
}

export function wrapFoodPreviewDoc(inner: string): string {
  return (
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>html,body{margin:0;background:#fff;-webkit-text-size-adjust:100%;}' +
    'body{padding:20px 14px;}' +
    '@media (max-width:480px){body{padding:14px 10px;}}</style>' +
    '</head><body>' + inner + '</body></html>'
  )
}

export function buildFoodPrompt(state: State): string {
  const template = renderFood(state, 'template')
  return (
    '아래 HTML 템플릿의 "내용만" 채워서, 티스토리에 붙여넣을 완성 HTML을 만들어 주세요.\n\n' +
    '# 절대 규칙\n' +
    '- HTML 태그 구조와 style(인라인 스타일)은 절대 변경하지 마세요.\n' +
    '- 대괄호 [ ... ] 자리표시자만 실제 텍스트로 교체하세요.\n' +
    '- [사진: 설명] 마커는 그대로 두고 설명만 다듬으세요. (실사진 업로드는 사용자가 합니다)\n' +
    '- 결과는 코드펜스 없이 <div class="ps-post" ...> 부터 마지막 </div> 까지 HTML만 출력하세요.\n\n' +
    '# 문체·톤\n' +
    "- '~어요' / '~습니다' 혼용, 정중하되 딱딱하지 않게\n" +
    '- 무게감 + 가벼운 유머, AI 상투적 마무리 금지\n' +
    '- 한 문단 3~4줄, 모바일 가독성 우선\n' +
    '- 목표 분량: ' + state.length + '\n\n' +
    '# 가게 정보\n' +
    '- 가게: ' + (state.foodName || '[미입력]') + '\n' +
    '- 위치: ' + (state.foodArea || '[미입력]') + '\n' +
    '- 종류: ' + (state.foodCuisine || '[미입력]') + '\n' +
    '- 방문: ' + (state.foodVisit || '[미입력]') + '\n' +
    '- 가격대: ' + (state.foodPrice || '[미입력]') + '\n\n' +
    '# HTML 템플릿\n' +
    template + '\n'
  )
}
