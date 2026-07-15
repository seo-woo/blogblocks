import { TRAVEL_SECTIONS, type State, type TravelSectionKey } from '../types'
import { companionNote } from '../lib/prompt'

/**
 * 여행 카테고리 전용 HTML 테마 — 매거진 에디토리얼 스타일.
 *
 * 디자인 원칙:
 * - 테두리 카드/박스·배경 채움·그라데이션·그림자 전부 없음.
 * - 가운데 정렬 헤더 + `01 · 02` 번호 + 본문 + 풀와이드 이미지 + 얇은 구분선.
 * - 색(accent)은 아이브로우·번호·별점·버튼 등 작은 요소에만.
 * 인라인 스타일을 쓰는 이유: 티스토리 HTML 글쓰기에 붙여넣어도
 * <style> 블록이 잘리거나 스코프가 깨지지 않고 항상 같은 모양이 나오게 하기 위함.
 */

type Mode = 'template' | 'preview'

// ---- 디자인 토큰 (한 곳에서만 바꾸면 전체 반영) ----
const FONT =
  "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Segoe UI',Roboto,'Helvetica Neue',sans-serif"
const ACCENT = '#d9633a'
const INK = '#1f2126'
const SUB = '#52555e'
const MUTED = '#8b8e97'
const LINE = '#e6e2d9'
const LINE_STRONG = '#d6d1c6'

const H2 = `font-size:20px;font-weight:800;letter-spacing:-.02em;margin:0 0 14px;color:${INK};`
const EYEBROW = `color:${ACCENT};letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-weight:800;`
const TH = `text-align:left;padding:10px 14px 10px 0;font-size:12px;color:${MUTED};font-weight:700;letter-spacing:.02em;text-transform:uppercase;border-bottom:2px solid ${LINE_STRONG};`
const TD = `padding:11px 14px 11px 0;border-bottom:1px solid ${LINE};color:${SUB};vertical-align:top;`
const DIVIDER = `<div style="border-top:1px solid ${LINE};margin:30px 0;"></div>`

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const TOC_TITLES: Partial<Record<TravelSectionKey, string>> = {
  schedule: '일정 한눈에 보기',
  spots: '다녀온 곳',
  restaurants: '맛집',
  cafes: '카페',
  cost: '예상 비용',
  tips: '가기 전 꿀팁',
  faq: '자주 묻는 질문',
  verdict: '총평',
}

export function renderTravel(state: State, mode: Mode): string {
  const val = (x: string, ph: string) => (x && x.trim() ? esc(x.trim()) : `[${ph}]`)
  const fill = (ph: string, sample: string) =>
    mode === 'template' ? `[${ph}]` : sample || `[${ph}]`
  const two = (i: number) => String(i).padStart(2, '0')

  const place = val(state.place, '여행지')
  const region = esc(state.region)
  const companion = esc(state.companion)
  const clamp = (n: number) => Math.max(1, Math.min(6, Math.round(n || 1)))

  const photo = (desc: string) =>
    `<div style="margin:16px 0 0;border:1px dashed ${LINE_STRONG};border-radius:8px;padding:30px 16px;text-align:center;color:${MUTED};font-size:13px;">📷 [사진: ${desc}]</div>`

  const on = (k: TravelSectionKey) => state.travelSections[k]
  const sections: string[] = []

  // ---- Hero (가운데 정렬) ----
  if (on('hero')) {
    const title = mode === 'template'
      ? '[클릭을 부르는 제목 — 여행지·핵심 매력이 드러나게]'
      : (state.theme.trim() ? esc(state.theme.trim()) : `${place}, ${companion}과 떠난 여행`)
    const subtitle = fill(
      '한 줄 소개 — 이 글에서 무엇을 얻어가는지',
      `${companion}과 함께한 ${place}, 동선부터 비용까지 한 번에 정리했어요.`,
    )
    sections.push(
      `<header style="text-align:center;padding:6px 0 4px;">` +
        `<div style="${EYEBROW}">TRAVEL · ${region}</div>` +
        `<h1 style="font-size:30px;line-height:1.3;margin:12px 0 12px;letter-spacing:-.03em;font-weight:800;color:${INK};">${title}</h1>` +
        `<p style="margin:0 auto;max-width:520px;color:${SUB};font-size:15px;">${subtitle}</p>` +
      `</header>`,
    )
  }

  // ---- 요약 (박스 없이) ----
  if (on('summary')) {
    const fact = (label: string, value: string) =>
      `<div><div style="font-size:12px;color:${MUTED};margin-bottom:3px;">${label}</div>` +
      `<div style="font-size:15px;font-weight:600;color:${INK};">${value}</div></div>`
    sections.push(
      `<section>` +
        `<div style="${EYEBROW} text-align:center;margin-bottom:16px;">AT A GLANCE</div>` +
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">` +
          fact('여행지', place) +
          fact('동행', `${companion} · ${companionNote[state.companion]}`) +
          fact('기간', val(state.period, '기간·시기')) +
          fact('테마', val(state.theme, '한 줄 테마')) +
        `</div>` +
      `</section>`,
    )
  }

  // ---- 목차 (박스 없이) ----
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

  // ---- 일정 (표 / 세로 / 2단) ----
  if (on('schedule')) {
    let inner: string
    const badge =
      `<div style="text-align:center;"><span style="display:inline-block;color:${ACCENT};font-weight:800;font-size:12.5px;letter-spacing:.14em;margin:0 0 18px;">DAY 1</span></div>`
    const stopData: string[][] = mode === 'template'
      ? [['[이모지]', '[시간]', '[장소]', '[메모]'],
         ['[이모지]', '[시간]', '[장소]', '[메모]'],
         ['[이모지]', '[시간]', '[장소]', '[메모]']]
      : [['☕', '09:30', '모닝 카페', '여유롭게 하루 시작'],
         ['⛪', '11:00', '대표 명소', '이 도시의 상징'],
         ['🍜', '13:00', '점심 맛집', '현지 별미 한 그릇'],
         ['📸', '16:00', '전망대', '사진 스팟'],
         ['🌆', '19:00', '야경 명소', '하루 마무리']]

    if (state.scheduleStyle === 'grid') {
      // 2단: 정거장 2개씩 (좁은 화면에선 flex-wrap 으로 1단)
      const cell = ([emoji, time, pl, memo]: string[]) =>
        `<div style="flex:1 1 46%;min-width:190px;box-sizing:border-box;display:flex;gap:11px;align-items:flex-start;padding:14px 0 6px;border-top:1px solid ${LINE};">` +
          `<span style="flex:none;width:30px;height:30px;border-radius:50%;border:1.5px solid ${ACCENT};display:inline-flex;align-items:center;justify-content:center;font-size:14px;line-height:1;">${emoji}</span>` +
          `<div><div style="font-size:12.5px;color:${ACCENT};font-weight:700;">${time}</div>` +
          `<div style="font-weight:700;color:${INK};font-size:15.5px;">${pl}</div>` +
          (memo ? `<div style="color:${SUB};font-size:13.5px;margin-top:1px;">${memo}</div>` : '') +
          `</div>` +
        `</div>`
      inner = badge + `<div style="display:flex;flex-wrap:wrap;gap:0 24px;">${stopData.map(cell).join('')}</div>`
    } else if (state.scheduleStyle === 'timeline') {
      // 세로: 왼쪽 선 + 정거장
      const stop = ([emoji, time, pl, memo]: string[]) =>
        `<div style="position:relative;padding:0 0 22px 30px;">` +
          `<span style="position:absolute;left:-13px;top:0;width:24px;height:24px;border-radius:50%;border:2px solid ${ACCENT};background:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;line-height:1;">${emoji}</span>` +
          `<div style="font-size:13px;color:${ACCENT};font-weight:700;margin-bottom:1px;">${time}</div>` +
          `<div style="font-weight:700;color:${INK};font-size:16px;">${pl}</div>` +
          (memo ? `<div style="color:${SUB};font-size:14px;margin-top:2px;">${memo}</div>` : '') +
        `</div>`
      inner = badge + `<div style="position:relative;margin-left:12px;border-left:2px solid ${LINE};">${stopData.map(stop).join('')}</div>`
    } else {
      // 표
      const row = ([, , pl, memo]: string[], route: string) =>
        `<tr><td style="${TD}padding-left:0;font-weight:700;color:${INK};white-space:nowrap;">${pl}</td>` +
        `<td style="${TD}">${route}</td><td style="${TD}padding-right:0;">${memo}</td></tr>`
      const rows = mode === 'template'
        ? row(['', '', '[1일차]', '[메모]'], '[오전 → 오후 → 저녁]') +
          row(['', '', '[2일차]', '[메모]'], '[오전 → 오후 → 저녁]')
        : row(['', '', '1일차', '도착 후 무리 없이'], '공항 → 숙소 → 야시장') +
          row(['', '', '2일차', '핵심 코스'], '대표 명소 → 맛집 → 카페 → 전망대') +
          row(['', '', '3일차', '여유롭게'], '아침 산책 → 기념품 → 공항')
      inner =
        `<table style="width:100%;border-collapse:collapse;font-size:15px;">` +
          `<thead><tr><th style="${TH}padding-left:0;">일차</th><th style="${TH}">동선</th><th style="${TH}padding-right:0;">메모</th></tr></thead>` +
          `<tbody>${rows}</tbody>` +
        `</table>`
    }
    sections.push(`<section><h2 style="${H2}">🗓️ 일정 한눈에 보기</h2>${inner}</section>`)
  }

  // ---- POI (장소/맛집/카페) — 번호 + 별점 + 본문 + 풀와이드 이미지 ----
  // 다녀온 곳을 전부 소개하고 각각 별점을 매기는 형태.
  const ratingSamples: [string, string][] = [
    ['★★★★★', '5.0'], ['★★★★☆', '4.3'], ['★★★☆☆', '3.6'],
    ['★★★★☆', '4.0'], ['★★★★★', '4.8'], ['★★★☆☆', '3.4'],
  ]
  const rating = (i: number) => {
    const [st, sc] = mode === 'template'
      ? ['★★★★☆', '[별점]']
      : ratingSamples[(i - 1) % ratingSamples.length]
    return `<div style="margin:0 0 10px;">` +
      `<span style="color:${ACCENT};letter-spacing:2px;font-size:14px;">${st}</span>` +
      `<span style="color:${MUTED};font-size:13px;margin-left:7px;">${sc}</span>` +
    `</div>`
  }
  const poiSection = (
    count: number, heading: string, noun: string,
    feature: string, chip2: string, chip3: string,
  ) => {
    const isSpot = noun === '장소'
    const items: string[] = []
    for (let i = 1; i <= clamp(count); i++) {
      const featureRow = feature
        ? `<p style="margin:0 0 4px;color:${INK};font-weight:600;">${feature}: ${fill(`${feature} ${i}`, '현지에서 가장 유명한 메뉴')}</p>`
        : ''
      const meta =
        `<div style="margin:14px 0 0;color:${MUTED};font-size:13.5px;">` +
        `📍 ${fill('위치', '중심가에서 도보 10분')} · ` +
        `💵 ${fill(chip2, isSpot ? '무료' : '1~2만원')} · ` +
        `⏱ ${fill(chip3, isSpot ? '1시간' : '11:00~21:00')}</div>`
      items.push(
        `<article style="${i === 1 ? '' : `border-top:1px solid ${LINE};margin-top:26px;padding-top:26px;`}">` +
          `<h3 style="font-size:21px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px;color:${INK};">` +
            `<span style="color:${ACCENT};">${two(i)}</span> ${fill(`${noun} 이름 ${i}`, `${noun === '장소' ? '방문지' : noun} ${i}`)}</h3>` +
          rating(i) +
          featureRow +
          `<p style="margin:0;color:${SUB};">${fill('솔직 후기·분위기·팁 (2~3문장)', '분위기가 좋고 사진 찍기 좋았어요. 오전 일찍 가면 한적합니다.')}</p>` +
          meta +
          photo(`${noun} ${i} 사진`) +
        `</article>`,
      )
    }
    return `<section><h2 style="${H2}">${heading}</h2>${items.join('')}</section>`
  }

  if (on('spots')) sections.push(poiSection(state.spotCount, '📍 다녀온 곳', '장소', '', '입장료', '소요시간'))
  if (on('restaurants')) sections.push(poiSection(state.restCount, '🍜 다녀온 맛집', '맛집', '대표메뉴', '가격대', '영업시간'))
  if (on('cafes')) sections.push(poiSection(state.cafeCount, '☕ 다녀온 카페', '카페', '시그니처', '가격대', '영업시간'))

  // ---- 비용 ----
  if (on('cost')) {
    const crow = (item: string, amount: string, memo: string) =>
      `<tr><td style="${TD}padding-left:0;color:${INK};">${item}</td>` +
      `<td style="${TD}text-align:right;white-space:nowrap;">${amount}</td>` +
      `<td style="${TD}padding-right:0;">${memo}</td></tr>`
    const rows =
      crow('교통', fill('금액', '00만원'), fill('메모', '항공/기차')) +
      crow('숙박', fill('금액', '00만원'), fill('메모', '0박')) +
      crow('식비', fill('금액', '00만원'), fill('메모', '')) +
      crow('입장·기타', fill('금액', '00만원'), fill('메모', ''))
    sections.push(
      `<section>` +
        `<h2 style="${H2}">💰 예상 비용</h2>` +
        `<table style="width:100%;border-collapse:collapse;font-size:15px;">` +
          `<thead><tr><th style="${TH}padding-left:0;">항목</th><th style="${TH}text-align:right;">금액</th><th style="${TH}padding-right:0;">메모</th></tr></thead>` +
          `<tbody>${rows}` +
            `<tr><td style="${TD}padding-left:0;border-bottom:none;border-top:2px solid ${LINE_STRONG};font-weight:800;color:${INK};">합계</td>` +
            `<td style="${TD}text-align:right;border-bottom:none;border-top:2px solid ${LINE_STRONG};font-weight:800;color:${ACCENT};">${fill('총액', '000만원')}</td>` +
            `<td style="${TD}padding-right:0;border-bottom:none;border-top:2px solid ${LINE_STRONG};">${fill('1인 기준 등', '1인 기준')}</td></tr>` +
          `</tbody>` +
        `</table>` +
      `</section>`,
    )
  }

  // ---- 꿀팁 ----
  if (on('tips')) {
    const tips = mode === 'template'
      ? '<li>[꿀팁 1]</li><li>[꿀팁 2]</li><li>[꿀팁 3]</li>'
      : '<li>예약은 최소 2주 전에 하는 게 좋아요.</li><li>현지 교통패스를 미리 사두면 편합니다.</li><li>오전 일찍 움직이면 붐비지 않아요.</li>'
    sections.push(
      `<section>` +
        `<h2 style="${H2}">🧭 가기 전 꿀팁</h2>` +
        `<ul style="margin:0;padding-left:20px;color:${SUB};line-height:1.95;">${tips}</ul>` +
      `</section>`,
    )
  }

  // ---- FAQ ----
  if (on('faq')) {
    const qa = (q: string, a: string, first: boolean) =>
      `<div style="padding:16px 0;${first ? '' : `border-top:1px solid ${LINE};`}">` +
        `<div style="font-weight:700;color:${INK};margin-bottom:6px;">Q. ${q}</div>` +
        `<div style="color:${SUB};">A. ${a}</div>` +
      `</div>`
    const items = mode === 'template'
      ? qa('[자주 묻는 질문 1]', '[답변 1]', true) + qa('[자주 묻는 질문 2]', '[답변 2]', false)
      : qa('며칠 일정이 적당한가요?', '2박 3일이면 핵심은 다 볼 수 있어요.', true) +
        qa('아이와 가도 괜찮나요?', '동선이 짧아 부담 없이 다닐 수 있습니다.', false)
    sections.push(`<section><h2 style="${H2}">❓ 자주 묻는 질문</h2>${items}</section>`)
  }

  // ---- 총평 ----
  if (on('verdict')) {
    sections.push(
      `<section>` +
        `<h2 style="${H2}">✍️ 총평</h2>` +
        `<div style="font-size:15px;color:${ACCENT};font-weight:800;margin-bottom:8px;">★★★★☆ ${fill('한 줄 총평', '다시 가고 싶은 여행지')}</div>` +
        `<p style="margin:0;color:${SUB};">${fill('전체 총평 2~3문장', '기대 이상으로 만족스러웠던 여행이에요. 동선이 편해 체력 부담도 적었습니다.')}</p>` +
        `<p style="margin:12px 0 0;color:${SUB};"><strong style="color:${INK};">이런 분께 추천:</strong> ${fill('추천 대상', companionNote[state.companion])}</p>` +
      `</section>`,
    )
  }

  // ---- CTA (가운데 정렬) ----
  if (on('cta')) {
    sections.push(
      `<section style="text-align:center;">` +
        `<div style="font-size:18px;font-weight:800;margin-bottom:6px;color:${INK};">${fill('구독/공감 유도 문구', '도움이 되었다면 공감·구독 부탁드려요 🙌')}</div>` +
        `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;">${fill('다음 글 예고 한 줄', '다음 글에서는 또 다른 여행지로 찾아올게요.')}</p>` +
        `<span style="display:inline-block;background:${ACCENT};color:#fff;font-weight:700;border-radius:999px;padding:11px 22px;font-size:15px;">＋ 구독하기</span>` +
      `</section>`,
    )
  }

  return (
    `<div class="ps-post" style="max-width:700px;margin:0 auto;padding:8px 0 40px;font-family:${FONT};color:${INK};font-size:16px;line-height:1.75;-webkit-text-size-adjust:100%;">` +
    sections.join(DIVIDER) +
    `</div>`
  )
}

/** iframe 미리보기용 전체 문서로 감싸기 */
export function wrapPreviewDoc(inner: string): string {
  return (
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '</head><body style="margin:0;background:#ffffff;padding:24px 18px;">' + inner + '</body></html>'
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
    '- 장소/맛집/카페는 "추천 몇 곳"이 아니라 실제로 다녀온 곳을 모두 소개하는 형태입니다. 방문한 곳 수만큼 항목을 늘리거나 줄이세요.\n' +
    '- 각 항목의 번호(01, 02…)는 순서대로 유지하고, 항목을 추가·삭제하면 번호도 다시 매기세요.\n' +
    '- 각 항목의 별점(★)은 실제 평가에 맞춰 채운 별(★)과 빈 별(☆)의 개수를 조절하고(별은 항상 합계 5개), 옆의 [별점] 자리에 숫자(예: 4.5)를 넣으세요.\n' +
    (state.scheduleStyle !== 'table'
      ? '- 일정 정거장(이모지+시간+장소+메모)의 [이모지]에는 장소에 어울리는 이모지 1개를 넣고 시간순으로 정렬하세요. 정거장 수는 자유롭게 늘리거나 줄이되 같은 구조를 복제하고, 여러 날이면 "DAY 1" 뱃지 블록 전체를 복제해 DAY 2, DAY 3… 로 이어 붙이세요.\n'
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
