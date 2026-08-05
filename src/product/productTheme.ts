import { productAccentColor, type State, type TravelImage } from '../types'

/**
 * 제품 리뷰 HTML 테마
 * 섹션: 히어로 · 한눈에 · 언박싱 · 디자인 · 사용기 · 총점/총평
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

export function hasProductContent(s: State): boolean {
  const c = s.productContent
  if (c.title || c.subtitle || c.unboxBody || c.designBody || c.usageBody) return true
  if (c.score || c.reviewOne || c.reviewBody || c.pros || c.cons) return true
  if (c.unboxImages.length || c.designImages.length || c.usageImages.length) return true
  return false
}

export function renderProduct(state: State, mode: Mode): string {
  const ACCENT = productAccentColor(state.productAccent)
  const EYEBROW = `color:${ACCENT};letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-weight:800;`
  const C = state.productContent

  const val = (x: string, ph: string) => (x && x.trim() ? esc(x.trim()) : `[${ph}]`)
  const pick = (cv: string | undefined, ph: string, sample: string) =>
    mode === 'template' ? `[${ph}]`
      : mode === 'filled' ? ((cv || '').trim() ? esc(cv as string) : `[${ph}]`)
        : (sample || `[${ph}]`)

  const name = val(state.productName, '제품명')
  const brand = val(state.productBrand, '브랜드')
  const category = val(state.productCategory, '카테고리')
  const channel = val(state.productChannel, '구매처')
  const price = val(state.productPrice, '가격')

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

  let title: string
  if (mode === 'template') title = '[클릭을 부르는 제목 — 제품명·한 줄 소감]'
  else if (mode === 'filled') {
    title = C.title.trim()
      ? esc(C.title)
      : (state.productName.trim() ? esc(state.productName) : '[제목]')
  } else {
    title = state.productName.trim()
      ? esc(state.productName)
      : '솔직 사용 후기, 사기 전 체크포인트'
  }
  const subtitle = pick(
    C.subtitle,
    '한 줄 소개',
    `${esc(state.productBrand || '브랜드')} · ${esc(state.productCategory || '제품')} 솔직 리뷰`,
  )

  sections.push(
    `<header style="text-align:center;padding:6px 0 4px;">` +
      `<div style="${EYEBROW}">PRODUCT REVIEW</div>` +
      `<h1 style="font-size:30px;line-height:1.3;margin:12px 0 12px;letter-spacing:-.03em;font-weight:800;color:${INK};">${title}</h1>` +
      `<p style="margin:0 auto;max-width:520px;color:${SUB};font-size:15px;">${subtitle}</p>` +
    `</header>`,
  )

  const fact = (label: string, value: string) =>
    `<div><div style="font-size:12px;color:${MUTED};margin-bottom:3px;">${label}</div>` +
    `<div style="font-size:15px;font-weight:600;color:${INK};">${value}</div></div>`
  sections.push(
    `<section>` +
      `<div style="${EYEBROW} text-align:center;margin-bottom:16px;">한눈에 보기</div>` +
      `<div class="ps-facts" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">` +
        fact('제품', name) +
        fact('브랜드', brand) +
        fact('카테고리', category) +
        fact('구매처', channel) +
        fact('가격', price) +
        fact('한 줄', mode === 'preview' ? '실사용 중심 후기' : val(C.subtitle, '한 줄 테마')) +
      `</div>` +
    `</section>`,
  )

  sections.push(
    `<section>` +
      `<h2 style="${H2}">📦 언박싱 · 구성</h2>` +
      gallery(C.unboxImages, '언박싱', '언박싱·구성 사진 1~3장') +
      body(
        C.unboxBody,
        '언박싱 후기 — 패키징·구성품·첫인상 (2~4문장)',
        '박스 포장은 탄탄했고, 구성품이 깔끔하게 정리되어 있었어요. 설명서와 기본 구성이 빠짐없이 들어 있어 바로 쓰기에 부담이 없었습니다. 포장 자체에서 브랜드 톤이 잘 느껴졌습니다.',
      ) +
    `</section>`,
  )

  sections.push(
    `<section>` +
      `<h2 style="${H2}">✨ 디자인 · 디테일</h2>` +
      gallery(C.designImages, '디자인', '디자인·디테일 사진 1~5장') +
      body(
        C.designBody,
        '디자인 후기 — 외관·마감·휴대성·스펙 느낌 (2~4문장)',
        '색감이 담백하고 마감이 꼼꼼한 편이에요. 손에 잡히는 질감이 좋고, 디테일이 과하지 않아서 오래 써도 질리지 않을 것 같았습니다. 크기도 일상에서 무리 없이 쓰기 좋은 사이즈예요.',
      ) +
    `</section>`,
  )

  sections.push(
    `<section>` +
      `<h2 style="${H2}">🖐️ 사용기</h2>` +
      gallery(C.usageImages, '사용기', '사용 장면 사진 1~10장') +
      body(
        C.usageBody,
        '사용 후기 — 실제 사용감·장점·아쉬운 점 (문단으로)',
        '며칠 써 보니 일상 루틴에 잘 녹아들었어요. 조작이 직관적이고 결과물이 기대에 맞았습니다. 다만 초반 세팅은 설명서를 한 번쯤 보고 시작하면 편합니다. 전체적으로 만족도가 높은 제품이에요.',
      ) +
    `</section>`,
  )

  // Pros / cons cards when filled or always structure
  const prosText = pick(C.pros, '장점 2~3줄', '직관적인 사용감 / 마감이 좋음 / 가격 대비 완성도')
  const consText = pick(C.cons, '단점 1~2줄', '초반 세팅이 조금 필요함')
  sections.push(
    `<section>` +
      `<h2 style="${H2}">⚖️ 장점 · 단점</h2>` +
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">` +
        `<div style="border-top:3px solid ${ACCENT};padding-top:12px;">` +
          `<div style="font-size:13px;font-weight:800;color:${ACCENT};margin-bottom:8px;">장점</div>` +
          `<p style="margin:0;color:${SUB};font-size:14.5px;line-height:1.75;white-space:pre-wrap;">${prosText}</p>` +
        `</div>` +
        `<div style="border-top:3px solid ${LINE_STRONG};padding-top:12px;">` +
          `<div style="font-size:13px;font-weight:800;color:${MUTED};margin-bottom:8px;">단점</div>` +
          `<p style="margin:0;color:${SUB};font-size:14.5px;line-height:1.75;white-space:pre-wrap;">${consText}</p>` +
        `</div>` +
      `</div>` +
    `</section>`,
  )

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
      `<div style="font-size:14px;color:${MUTED};margin-bottom:10px;">총점 ${scoreLabel}</div>` +
      `<div style="font-size:16px;font-weight:700;color:${INK};margin-bottom:10px;">${pick(C.reviewOne, '한 줄 총평', '사길 잘했다는 생각이 드는 제품')}</div>` +
      `<p style="margin:0;color:${SUB};font-size:15.5px;line-height:1.8;">${pick(
        C.reviewBody,
        '총평 본문 2~4문장',
        '디자인과 실사용 밸런스가 좋아요. 예민한 분께도 무난하고, 입문용·리플레이스용 모두 추천할 만합니다.',
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
    `.ps-post .ps-proscons{grid-template-columns:1fr!important;}` +
    `}` +
    `</style>`

  return (
    `<div class="ps-post" style="max-width:700px;margin:0 auto;padding:8px 0 40px;font-family:${FONT};color:${INK};font-size:16px;line-height:1.75;-webkit-text-size-adjust:100%;">` +
    mobileCss +
    sections.join(DIVIDER) +
    `</div>`
  )
}

export function wrapProductPreviewDoc(inner: string): string {
  return (
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>html,body{margin:0;background:#fff;-webkit-text-size-adjust:100%;}' +
    'body{padding:20px 14px;}' +
    '@media (max-width:480px){body{padding:14px 10px;}}</style>' +
    '</head><body>' + inner + '</body></html>'
  )
}

export function buildProductPrompt(state: State): string {
  const template = renderProduct(state, 'template')
  return (
    '아래 HTML 템플릿의 "내용만" 채워서, 티스토리에 붙여넣을 완성 HTML을 만들어 주세요.\n\n' +
    '# 절대 규칙\n' +
    '- HTML 태그 구조와 style(인라인 스타일)은 절대 변경하지 마세요.\n' +
    '- 대괄호 [ ... ] 자리표시자만 실제 텍스트로 교체하세요.\n' +
    '- [사진: 설명] 마커는 그대로 두고 설명만 다듬으세요.\n' +
    '- 결과는 코드펜스 없이 <div class="ps-post" ...> 부터 마지막 </div> 까지 HTML만 출력하세요.\n\n' +
    '# 문체·톤\n' +
    "- '~어요' / '~습니다' 혼용, 정중하되 딱딱하지 않게\n" +
    '- 무게감 + 가벼운 유머, AI 상투적 마무리 금지\n' +
    '- 한 문단 3~4줄, 모바일 가독성 우선\n' +
    '- 목표 분량: ' + state.length + '\n\n' +
    '# 제품 정보\n' +
    '- 제품: ' + (state.productName || '[미입력]') + '\n' +
    '- 브랜드: ' + (state.productBrand || '[미입력]') + '\n' +
    '- 카테고리: ' + (state.productCategory || '[미입력]') + '\n' +
    '- 구매처: ' + (state.productChannel || '[미입력]') + '\n' +
    '- 가격: ' + (state.productPrice || '[미입력]') + '\n\n' +
    '# HTML 템플릿\n' +
    template + '\n'
  )
}
