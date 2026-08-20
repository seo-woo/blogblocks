import { TRAVEL_SECTIONS, travelAccentColor, type State, type TravelSectionKey } from '../types'
import { companionNote } from '../lib/prompt'

/**
 * 여행 카테고리 전용 HTML 테마 — 매거진 에디토리얼 스타일.
 *
 * 렌더 모드 3가지:
 * - 'template' : 대괄호 [자리표시자] (프롬프트/직접 채우기용)
 * - 'preview'  : 예시 문구로 디자인 미리보기
 * - 'filled'   : state.travelContent 의 실제 작성 내용 + 업로드 이미지로 완성
 *
 * 디자인은 인라인 스타일로 고정 → 티스토리 HTML 글쓰기에 붙여넣어도 항상 같은 모양.
 */

type Mode = 'template' | 'preview' | 'filled'

// ---- 디자인 토큰 (액센트는 state.travelAccent 로 선택) ----
const FONT =
  "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Segoe UI',Roboto,'Helvetica Neue',sans-serif"
const INK = '#1f2126'
const SUB = '#52555e'
const MUTED = '#8b8e97'
const LINE = '#e6e2d9'
const LINE_STRONG = '#d6d1c6'

const H2 = `font-size:20px;font-weight:800;letter-spacing:-.02em;margin:0 0 14px;color:${INK};`
const TH = `text-align:left;padding:10px 14px 10px 0;font-size:12px;color:${MUTED};font-weight:700;letter-spacing:.02em;text-transform:uppercase;border-bottom:2px solid ${LINE_STRONG};`
const TD = `padding:11px 14px 11px 0;border-bottom:1px solid ${LINE};color:${SUB};vertical-align:top;`
const DIVIDER = `<div style="border-top:1px solid ${LINE};margin:30px 0;"></div>`

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function starStr(score: number): string {
  const f = Math.max(0, Math.min(5, Math.round(score)))
  return '★'.repeat(f) + '☆'.repeat(5 - f)
}

const TOC_TITLES: Partial<Record<TravelSectionKey, string>> = {
  schedule: '일정 한눈에 보기',
  course: '코스 후기',
  cost: '예상 비용',
  tips: '가기 전 꿀팁',
  faq: '자주 묻는 질문',
  verdict: '총평',
}

export function renderTravel(state: State, mode: Mode): string {
  const ACCENT = travelAccentColor(state.travelAccent)
  const EYEBROW = `color:${ACCENT};letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-weight:800;`
  const C = state.travelContent
  const two = (i: number) => String(i).padStart(2, '0')

  // 아는 값(구성 탭의 여행 정보): 있으면 그대로, 없으면 자리표시자 (모든 모드 공통)
  const val = (x: string, ph: string) => (x && x.trim() ? esc(x.trim()) : `[${ph}]`)
  // 서술형: filled=작성값 / template=[자리] / preview=예시
  const pick = (cv: string | undefined, ph: string, sample: string) =>
    mode === 'template' ? `[${ph}]`
      : mode === 'filled' ? ((cv || '').trim() ? esc(cv as string) : `[${ph}]`)
        : (sample || `[${ph}]`)
  // filled 전용: 값 있으면 esc, 없으면 [ph]
  const fv = (cv: string | undefined, ph: string) => ((cv || '').trim() ? esc(cv as string) : `[${ph}]`)

  const place = val(state.place, '여행지')
  const region = esc(state.region)
  const companion = esc(state.companion)

  const photo = (desc: string) =>
    `<div style="margin:16px 0 0;border:1px dashed ${LINE_STRONG};border-radius:8px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:${MUTED};font-size:13px;">📷 [사진: ${desc}]</div>`
  const coverImg = (img: { src: string; x: number; y: number }, alt: string) =>
    `<div style="aspect-ratio:4/3;overflow:hidden;border-radius:8px;background:${LINE};">` +
      `<img src="${img.src}" alt="${esc(alt)}" style="width:100%;height:100%;object-fit:cover;object-position:${img.x}% ${img.y}%;display:block;">` +
    `</div>`
  /** 1장 = 단일 4:3, 2장 이상 = 밀어서 넘기는 4:3 슬라이드 */
  const gallery = (
    srcs: Array<{ src: string; x: number; y: number }> | undefined,
    alt: string,
    ph: string,
  ) => {
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

  const on = (k: TravelSectionKey) => state.travelSections[k]
  const sections: string[] = []

  // ---- Hero (가운데 정렬) ----
  if (on('hero')) {
    let title: string
    if (mode === 'template') title = '[클릭을 부르는 제목 — 여행지·핵심 매력이 드러나게]'
    else if (mode === 'filled') title = C.heroTitle.trim() ? esc(C.heroTitle) : (state.theme.trim() ? esc(state.theme) : '[제목]')
    else title = state.theme.trim() ? esc(state.theme) : `${place}, ${companion}과 떠난 여행`
    const subtitle = pick(C.heroSubtitle, '한 줄 소개 — 이 글에서 무엇을 얻어가는지',
      `${companion}과 함께한 ${place}, 동선부터 비용까지 한 번에 정리했어요.`)
    const heroImg =
      mode === 'filled' && C.heroImages.length
        ? gallery(C.heroImages, `${place} 대표 이미지`, '대표 사진')
        : ''
    sections.push(
      `<header style="text-align:center;padding:6px 0 4px;">` +
        `<div style="${EYEBROW}">TRAVEL · ${region}</div>` +
        `<h1 style="font-size:30px;line-height:1.3;margin:12px 0 12px;letter-spacing:-.03em;font-weight:800;color:${INK};">${title}</h1>` +
        `<p style="margin:0 auto;max-width:520px;color:${SUB};font-size:15px;">${subtitle}</p>` +
        heroImg +
      `</header>`,
    )
  }

  // ---- 요약 (구성 탭의 여행 정보 사용) ----
  if (on('summary')) {
    const fact = (label: string, value: string) =>
      `<div><div style="font-size:12px;color:${MUTED};margin-bottom:3px;">${label}</div>` +
      `<div style="font-size:15px;font-weight:600;color:${INK};">${value}</div></div>`
    sections.push(
      `<section>` +
        `<div style="${EYEBROW} text-align:center;margin-bottom:16px;">한눈에 보기</div>` +
        `<div class="ps-facts" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">` +
          fact('여행지', place) +
          fact('동행', companion) +
          fact('기간', val(state.period, '기간·시기')) +
          fact('테마', val(state.theme, '한 줄 테마')) +
        `</div>` +
      `</section>`,
    )
  }

  // ---- 목차 ----
  if (on('toc')) {
    const items = TRAVEL_SECTIONS
      .filter((s) => on(s.key) && TOC_TITLES[s.key])
      .map((s) => `<li>${TOC_TITLES[s.key]}</li>`)
      .join('')
    sections.push(
      `<nav>` +
        `<div style="font-weight:800;font-size:14px;margin-bottom:10px;color:${INK};">📑 목차</div>` +
        `<ol style="margin:0;padding-left:20px;color:${SUB};line-height:2;font-size:15px;">${items}</ol>` +
      `</nav>`,
    )
  }

  // 일정 정거장 데이터 — visits(코스)에서 가져옴
  const PH_STOPS = [
    ['☕', '[시간]', '[카페·아침]', '[메모]'],
    ['📍', '[시간]', '[관광지]', '[메모]'],
    ['🍜', '[시간]', '[맛집·점심]', '[메모]'],
    ['☕', '[시간]', '[카페]', '[메모]'],
    ['🌆', '[시간]', '[야경·마무리]', '[메모]'],
  ]
  const SAMPLE_STOPS = [
    ['☕', '09:30', '모닝 카페', '여유롭게 하루 시작'],
    ['⛪', '11:00', '대표 명소', '이 도시의 상징'],
    ['🍜', '13:00', '점심 식당', '현지 별미 한 그릇'],
    ['📸', '16:00', '전망대', '사진 스팟'],
    ['🌆', '19:00', '야경 명소', '하루 마무리'],
  ]
  const stopRows: string[][] =
    mode === 'filled'
      ? (C.visits.length
        ? C.visits.map((v) => [
          v.emoji ? esc(v.emoji) : '📍',
          fv(v.time, '시간'),
          fv(v.name, '장소'),
          v.memo ? esc(v.memo) : '',
        ])
        : PH_STOPS)
      : mode === 'template' ? PH_STOPS : SAMPLE_STOPS

  // ---- 일정 (표 / 세로 / 2단) ----
  if (on('schedule')) {
    let inner: string
    const badge =
      `<div style="text-align:center;"><span style="display:inline-block;color:${ACCENT};font-weight:800;font-size:12.5px;letter-spacing:.14em;margin:0 0 18px;">DAY 1</span></div>`

    if (state.scheduleStyle === 'grid') {
      const cell = ([emoji, time, pl, memo]: string[]) =>
        `<div style="flex:1 1 46%;min-width:min(190px,100%);box-sizing:border-box;display:flex;gap:11px;align-items:flex-start;padding:14px 0 6px;border-top:1px solid ${LINE};">` +
          `<span style="flex:none;width:30px;height:30px;border-radius:50%;border:1.5px solid ${ACCENT};display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;">${emoji}</span>` +
          `<div><div style="font-size:12.5px;color:${ACCENT};font-weight:700;">${time}</div>` +
          `<div style="font-weight:700;color:${INK};font-size:15.5px;">${pl}</div>` +
          (memo ? `<div style="color:${SUB};font-size:13.5px;margin-top:1px;">${memo}</div>` : '') +
          `</div>` +
        `</div>`
      inner = badge + `<div class="ps-sched-grid" style="display:flex;flex-wrap:wrap;gap:0 24px;">${stopRows.map(cell).join('')}</div>`
    } else if (state.scheduleStyle === 'timeline') {
      const stop = ([emoji, time, pl, memo]: string[]) =>
        `<div style="position:relative;padding:0 0 22px 30px;">` +
          `<span style="position:absolute;left:-13px;top:0;width:24px;height:24px;border-radius:50%;border:2px solid ${ACCENT};background:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;line-height:1;">${emoji}</span>` +
          `<div style="font-size:13px;color:${ACCENT};font-weight:700;margin-bottom:1px;">${time}</div>` +
          `<div style="font-weight:700;color:${INK};font-size:16px;">${pl}</div>` +
          (memo ? `<div style="color:${SUB};font-size:14px;margin-top:2px;">${memo}</div>` : '') +
        `</div>`
      inner = badge + `<div style="position:relative;margin-left:12px;border-left:2px solid ${LINE};">${stopRows.map(stop).join('')}</div>`
    } else {
      const trow = ([, time, pl, memo]: string[]) =>
        `<tr><td style="${TD}padding-left:0;font-weight:700;color:${INK};white-space:nowrap;">${time}</td>` +
        `<td style="${TD}">${pl}</td><td style="${TD}padding-right:0;">${memo}</td></tr>`
      inner =
        `<div class="ps-table-wrap" style="overflow-x:auto;-webkit-overflow-scrolling:touch;">` +
        `<table style="width:100%;border-collapse:collapse;font-size:15px;min-width:320px;">` +
          `<thead><tr><th style="${TH}padding-left:0;">시간</th><th style="${TH}">장소</th><th style="${TH}padding-right:0;">메모</th></tr></thead>` +
          `<tbody>${stopRows.map(trow).join('')}</tbody>` +
        `</table></div>`
    }
    sections.push(`<section><h2 style="${H2}">🗓️ 일정 한눈에 보기</h2>${inner}</section>`)
  }

  // ---- 코스 후기 (일정 순: 맛집·카페·관광지 섞음) ----
  const ratingSamples: [string, string][] = [
    ['★★★★★', '5.0'], ['★★★★☆', '4.3'], ['★★★☆☆', '3.6'],
    ['★★★★☆', '4.0'], ['★★★★★', '4.8'], ['★★★☆☆', '3.4'],
  ]
  const ratingHtml = (i: number, cv?: string) => {
    let st: string, sc: string
    if (mode === 'template') { st = '★★★★☆'; sc = '[별점]' }
    else if (mode === 'filled') {
      const n = parseFloat(cv || '')
      if (!isNaN(n) && n > 0) { st = starStr(n); sc = esc(cv as string) }
      else { st = '★★★★☆'; sc = '[별점]' }
    } else { [st, sc] = ratingSamples[(i - 1) % ratingSamples.length] }
    return `<div style="margin:0 0 10px;">` +
      `<span style="color:${ACCENT};letter-spacing:2px;font-size:14px;">${st}</span>` +
      `<span style="color:${MUTED};font-size:13px;margin-left:7px;">${sc}</span>` +
    `</div>`
  }
  const kindLabel = (kind: string) =>
    kind === 'restaurant' ? '맛집' : kind === 'cafe' ? '카페' : kind === 'other' ? '기타' : '관광지'
  const featureLabel = (kind: string) =>
    kind === 'restaurant' ? '대표메뉴' : kind === 'cafe' ? '시그니처' : '포인트'
  const chip2 = (kind: string) => kind === 'spot' ? '입장료' : '가격대'
  const chip3 = (kind: string) => kind === 'spot' ? '소요시간' : '영업시간'

  if (on('course')) {
    const SAMPLE_COURSE = [
      { kind: 'cafe', emoji: '☕', time: '09:30', name: '골목 모닝 카페', feature: '시그니처 라떼', review: '조용하고 좌석이 편했어요. 여행 첫날 리듬을 잡기에 좋았습니다.', loc: '역에서 도보 5분', price: '음료 6천원대', dur: '08:00~18:00' },
      { kind: 'spot', emoji: '⛪', time: '11:00', name: '올드타운 광장', feature: '', review: '사진 스팟이 많고 오전엔 한적합니다. 30~40분이면 여유롭게 둘러볼 수 있어요.', loc: '구시가지 중심', price: '무료', dur: '40분' },
      { kind: 'restaurant', emoji: '🍜', time: '13:00', name: '동네 국수집', feature: '간장 라멘', review: '국물이 담백하고 양이 충분했어요. 웨이팅이 생길 수 있어 조금 일찍 가는 걸 추천합니다.', loc: '시장 골목', price: '1인 1만원대', dur: '11:00~21:00' },
    ]
    type CourseItem = {
      kind: string; emoji?: string; time?: string; name?: string
      feature?: string; review?: string; rating?: string
      loc?: string; price?: string; dur?: string
      images?: State['travelContent']['visits'][number]['images']
    }
    let list: CourseItem[] = []
    if (mode === 'template') {
      list = [1, 2, 3].map((i) => ({
        kind: i === 1 ? 'cafe' : i === 2 ? 'spot' : 'restaurant',
        time: '[시간]',
        name: `[장소 이름 ${i}]`,
        feature: i === 2 ? '' : '[메뉴·포인트]',
        review: '[솔직 후기 2~3문장]',
        loc: '[위치]',
        price: '[가격]',
        dur: '[소요·영업]',
      }))
    } else if (mode === 'preview') {
      list = SAMPLE_COURSE
    } else {
      list = C.visits.length
        ? C.visits
        : [{ kind: 'spot', name: '', review: '', time: '', feature: '', loc: '', price: '', dur: '' }]
    }

    const items = list.map((it, idx) => {
      const i = idx + 1
      const kind = it.kind || 'spot'
      const showFeature = kind === 'restaurant' || kind === 'cafe' || !!(it.feature && String(it.feature).trim())
      const featureRow = showFeature
        ? `<p style="margin:0 0 4px;color:${INK};font-weight:600;">${featureLabel(kind)}: ${pick(it.feature, `${featureLabel(kind)}`, '현지에서 가장 유명한 메뉴')}</p>`
        : ''
      const timeLine = (it.time && String(it.time).trim()) || mode !== 'filled'
        ? `<div style="font-size:13px;color:${ACCENT};font-weight:700;margin:0 0 4px;">${pick(it.time, '시간', SAMPLE_COURSE[idx % SAMPLE_COURSE.length].time)}</div>`
        : ''
      const meta =
        `<div style="margin:14px 0 0;color:${MUTED};font-size:13.5px;">` +
        `📍 ${pick(it.loc, '위치', '중심가에서 도보 10분')} · ` +
        `💵 ${pick(it.price, chip2(kind), kind === 'spot' ? '무료' : '1~2만원')} · ` +
        `⏱ ${pick(it.dur, chip3(kind), kind === 'spot' ? '1시간' : '11:00~21:00')}</div>`
      return (
        `<article style="${i === 1 ? '' : `border-top:1px solid ${LINE};margin-top:26px;padding-top:26px;`}">` +
          timeLine +
          `<h3 style="font-size:21px;font-weight:800;letter-spacing:-.02em;margin:0 0 6px;color:${INK};">` +
            `<span style="color:${ACCENT};">${two(i)}</span> ${pick(it.name, '장소 이름', SAMPLE_COURSE[idx % SAMPLE_COURSE.length].name)}` +
            `<span style="margin-left:8px;font-size:12px;font-weight:700;color:${MUTED};letter-spacing:.04em;">${kindLabel(kind)}</span>` +
          `</h3>` +
          ratingHtml(i, it.rating) +
          featureRow +
          `<p style="margin:0;color:${SUB};">${pick(it.review, '솔직 후기·분위기·팁 (2~3문장)', SAMPLE_COURSE[idx % SAMPLE_COURSE.length].review)}</p>` +
          meta +
          gallery(it.images, `${kindLabel(kind)} ${i} 사진`, `${kindLabel(kind)} ${i} 사진`) +
        `</article>`
      )
    }).join('')

    sections.push(`<section><h2 style="${H2}">🚶 코스 후기 (일정 순)</h2>${items}</section>`)
  }

  // ---- 비용 ----
  if (on('cost')) {
    const PH_COST = [['교통', '[금액]', '[항공/기차]'], ['숙박', '[금액]', '[0박]'], ['식비', '[금액]', ''], ['입장·기타', '[금액]', '']]
    const SAMPLE_COST = [['교통', '00만원', '항공/기차'], ['숙박', '00만원', '0박'], ['식비', '00만원', ''], ['입장·기타', '00만원', '']]
    const costRows =
      mode === 'filled'
        ? (C.costRows.length ? C.costRows.map((r) => [fv(r.item, '항목'), fv(r.amount, '금액'), r.memo ? esc(r.memo) : '']) : PH_COST)
        : mode === 'template' ? PH_COST : SAMPLE_COST
    const crow = ([item, amount, memo]: string[]) =>
      `<tr><td style="${TD}padding-left:0;color:${INK};">${item}</td>` +
      `<td style="${TD}text-align:right;white-space:nowrap;">${amount}</td>` +
      `<td style="${TD}padding-right:0;">${memo}</td></tr>`
    sections.push(
      `<section>` +
        `<h2 style="${H2}">💰 예상 비용</h2>` +
        `<div class="ps-table-wrap" style="overflow-x:auto;-webkit-overflow-scrolling:touch;">` +
        `<table style="width:100%;border-collapse:collapse;font-size:15px;min-width:300px;">` +
          `<thead><tr><th style="${TH}padding-left:0;">항목</th><th style="${TH}text-align:right;">금액</th><th style="${TH}padding-right:0;">메모</th></tr></thead>` +
          `<tbody>${costRows.map(crow).join('')}` +
            `<tr><td style="${TD}padding-left:0;border-bottom:none;border-top:2px solid ${LINE_STRONG};font-weight:800;color:${INK};">합계</td>` +
            `<td style="${TD}text-align:right;border-bottom:none;border-top:2px solid ${LINE_STRONG};font-weight:800;color:${ACCENT};">${pick(C.costTotal, '총액', '000만원')}</td>` +
            `<td style="${TD}padding-right:0;border-bottom:none;border-top:2px solid ${LINE_STRONG};">${pick(C.costTotalMemo, '1인 기준 등', '1인 기준')}</td></tr>` +
          `</tbody>` +
        `</table></div>` +
      `</section>`,
    )
  }

  // ---- 꿀팁 ----
  if (on('tips')) {
    const PH_TIPS = ['[꿀팁 1]', '[꿀팁 2]', '[꿀팁 3]']
    const SAMPLE_TIPS = ['예약은 최소 2주 전에 하는 게 좋아요.', '현지 교통패스를 미리 사두면 편합니다.', '오전 일찍 움직이면 붐비지 않아요.']
    const tipsArr =
      mode === 'filled'
        ? (C.tips.filter((t) => t && t.trim()).length ? C.tips.filter((t) => t && t.trim()).map(esc) : PH_TIPS)
        : mode === 'template' ? PH_TIPS : SAMPLE_TIPS
    sections.push(
      `<section>` +
        `<h2 style="${H2}">🧭 가기 전 꿀팁</h2>` +
        `<ul style="margin:0;padding-left:20px;color:${SUB};line-height:1.95;">${tipsArr.map((t) => `<li>${t}</li>`).join('')}</ul>` +
      `</section>`,
    )
  }

  // ---- FAQ ----
  if (on('faq')) {
    const PH_FAQ = [['[자주 묻는 질문 1]', '[답변 1]'], ['[자주 묻는 질문 2]', '[답변 2]']]
    const SAMPLE_FAQ = [['며칠 일정이 적당한가요?', '2박 3일이면 핵심은 다 볼 수 있어요.'], ['아이와 가도 괜찮나요?', '동선이 짧아 부담 없이 다닐 수 있습니다.']]
    const faqArr =
      mode === 'filled'
        ? (C.faq.filter((f) => f && (f.q || f.a)).length ? C.faq.filter((f) => f && (f.q || f.a)).map((f) => [fv(f.q, '질문'), fv(f.a, '답변')]) : PH_FAQ)
        : mode === 'template' ? PH_FAQ : SAMPLE_FAQ
    const items = faqArr.map(([q, a], idx) =>
      `<div style="padding:16px 0;${idx === 0 ? '' : `border-top:1px solid ${LINE};`}">` +
        `<div style="font-weight:700;color:${INK};margin-bottom:6px;">Q. ${q}</div>` +
        `<div style="color:${SUB};">A. ${a}</div>` +
      `</div>`).join('')
    sections.push(`<section><h2 style="${H2}">❓ 자주 묻는 질문</h2>${items}</section>`)
  }

  // ---- 총평 ----
  if (on('verdict')) {
    let vStars = '★★★★☆'
    if (mode === 'filled') {
      const n = parseFloat(C.verdictScore)
      if (!isNaN(n) && n > 0) vStars = starStr(n)
    }
    sections.push(
      `<section>` +
        `<h2 style="${H2}">✍️ 총평</h2>` +
        `<div style="font-size:15px;color:${ACCENT};font-weight:800;margin-bottom:8px;">${vStars} ${pick(C.verdictOne, '한 줄 총평', '다시 가고 싶은 여행지')}</div>` +
        `<p style="margin:0;color:${SUB};">${pick(C.verdictBody, '전체 총평 2~3문장', '기대 이상으로 만족스러웠던 여행이에요. 동선이 편해 체력 부담도 적었습니다.')}</p>` +
        `<p style="margin:12px 0 0;color:${SUB};"><strong style="color:${INK};">이런 분께 추천:</strong> ${pick(C.verdictTarget, '추천 대상', companionNote[state.companion])}</p>` +
      `</section>`,
    )
  }

  // ---- CTA ----
  if (on('cta')) {
    sections.push(
      `<section style="text-align:center;">` +
        `<div style="font-size:18px;font-weight:800;margin-bottom:6px;color:${INK};">${pick(C.ctaHeading, '구독/공감 유도 문구', '도움이 되었다면 공감·구독 부탁드려요 🙌')}</div>` +
        `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;">${pick(C.ctaSub, '다음 글 예고 한 줄', '다음 글에서는 또 다른 여행지로 찾아올게요.')}</p>` +
        `<span style="display:inline-block;background:${ACCENT};color:#fff;font-weight:700;border-radius:999px;padding:11px 22px;font-size:15px;">＋ 구독하기</span>` +
      `</section>`,
    )
  }

  const mobileCss =
    `<style>` +
    `.ps-post{overflow-wrap:anywhere;word-break:keep-all;}` +
    `.ps-post img{max-width:100%;height:auto;}` +
    `@media (max-width:520px){` +
    `.ps-post{font-size:15px!important;padding-left:0!important;padding-right:0!important;}` +
    `.ps-post h1{font-size:24px!important;}` +
    `.ps-sched-grid>div{flex:1 1 100%!important;min-width:0!important;}` +
    `}` +
    `</style>`

  return (
    `<div class="ps-post" style="max-width:700px;margin:0 auto;padding:8px 0 40px;font-family:${FONT};color:${INK};font-size:16px;line-height:1.75;-webkit-text-size-adjust:100%;">` +
    mobileCss +
    sections.join(DIVIDER) +
    `</div>`
  )
}

/** 직접 작성한 내용이 하나라도 있는지 (미리보기·복사 모드 결정용) */
export function hasTravelContent(s: State): boolean {
  const c = s.travelContent
  if (c.heroTitle || c.heroSubtitle || c.heroImages.length) return true
  if (c.verdictOne || c.verdictBody || c.verdictTarget || c.verdictScore) return true
  if (c.ctaHeading || c.ctaSub || c.costTotal || c.costTotalMemo) return true
  if (c.visits.some((v) => v && (v.name || v.review || v.memo || v.time || v.images?.length || v.rating || v.feature || v.loc || v.price || v.dur))) return true
  if (c.costRows.length || c.faq.length) return true
  if (c.tips.some((t) => t && t.trim())) return true
  return false
}

/** iframe 미리보기용 전체 문서로 감싸기 */
export function wrapPreviewDoc(inner: string): string {
  return (
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>html,body{margin:0;background:#fff;-webkit-text-size-adjust:100%;}' +
    'body{padding:20px 14px;}' +
    '@media (max-width:480px){body{padding:14px 10px;}}</style>' +
    '</head><body>' + inner + '</body></html>'
  )
}

/** 프롬프트: HTML 템플릿 + "구조는 건드리지 말고 내용만 채워라" 지시문 */
export function buildTravelPrompt(state: State): string {
  const info = state.info ? '포함' : '생략'
  const enabled = TRAVEL_SECTIONS.filter((s) => state.travelSections[s.key]).map((s) => s.label).join(', ')
  const template = renderTravel(state, 'template')

  return (
    '아래 HTML 템플릿의 "내용만" 채워서, 티스토리에 붙여넣을 완성 HTML을 만들어 주세요.\n\n' +
    '# 절대 규칙 (반드시 준수)\n' +
    '- HTML 태그 구조, class, style(인라인 스타일) 속성은 절대 변경하지 마세요. 디자인은 이미 완성돼 있습니다.\n' +
    '- 대괄호 [ ... ] 로 표시된 자리표시자의 내용만 실제 텍스트로 교체하세요.\n' +
    '- [사진: 설명] 마커는 태그를 그대로 두고 설명 문구만 상황에 맞게 다듬으세요. (실제 이미지는 나중에 사용자가 넣습니다)\n' +
    '- 코스 후기는 맛집·카페·관광지를 카테고리로 나누지 말고, 실제 방문 시간 순서대로 항목을 나열하세요.\n' +
    '- 각 항목의 번호(01, 02…)는 일정 순서를 유지하고, 항목을 추가·삭제하면 번호도 다시 매기세요.\n' +
    '- 각 항목의 별점(★)은 실제 평가에 맞춰 채운 별(★)과 빈 별(☆)의 개수를 조절하고(별은 항상 합계 5개), 옆의 [별점] 자리에 숫자(예: 4.5)를 넣으세요.\n' +
    (state.scheduleStyle !== 'table'
      ? '- 일정 한눈에 보기와 코스 후기의 장소·시간은 같은 순서를 유지하세요. 정거장 수는 자유롭게 늘리거나 줄이되 같은 구조를 복제하고, 여러 날이면 "DAY 1" 뱃지 블록 전체를 복제해 DAY 2, DAY 3… 로 이어 붙이세요.\n'
      : '- 일정표의 행 수는 자유롭게 늘리거나 줄이되 td 의 style 은 유지하세요.\n') +
    '- 표(비용 등)의 행 수는 실제 내용에 맞게 조절하되, td/th 의 style 은 다른 칸과 동일하게 유지하세요.\n' +
    '- 결과는 코드펜스(```)나 설명 없이, <div class="ps-post" ...> 부터 마지막 </div> 까지 "완성된 HTML 하나만" 출력하세요.\n\n' +
    '# 문체·톤 규칙\n' +
    "- '~어요' / '~습니다' 체를 자연스럽게 혼용, 정중하되 딱딱하지 않게\n" +
    '- 무게감을 유지하되 가벼운 유머 한 방울, AI 티 나는 상투적 마무리 금지\n' +
    '- 한 문단은 3~4줄 이내, 모바일 가독성 우선\n' +
    '- 목표 분량: ' + state.length + '\n\n' +
    '# 여행 정보\n' +
    '- 여행지: ' + (state.place || '[미입력]') + '\n' +
    '- 지역: ' + state.region + '\n' +
    '- 동행: ' + state.companion + ' → ' + companionNote[state.companion] + '\n' +
    '- 기간/시기: ' + (state.period || '[미입력]') + '\n' +
    '- 한 줄 테마: ' + (state.theme || '[미입력]') + '\n' +
    '- 꼭 넣을 장소/에피소드: ' + (state.tepisode || '[없음]') + '\n' +
    '- 실용 정보(비용·동선·예약): ' + info + '\n' +
    '- 포함 섹션: ' + enabled + '\n\n' +
    '# HTML 템플릿\n' +
    template + '\n'
  )
}
