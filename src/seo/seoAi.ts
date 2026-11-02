import { extractJsonObject } from '../lib/parseJson'
import { migrateSeoContent, slotLabel, type SeoContent, type State } from '../types'
import { stripCatStyle } from './imageStyle'
import {
  BLOG_RULES, DEPTH_RULES, EMOJI_RULES, FACT_RULES, HEALTH_RULES, IMAGE_RULES, INTRO_RULES,
  PILLAR_RULES, RHYTHM_RULES, SEO_RULES, STYLE_RULES, topicBlock,
} from './rules'

const SCHEMA =
  '{\n' +
  '  "plan": {\n' +
  '    "mainKeyword": "이 글의 핵심 검색어",\n' +
  '    "subKeywords": ["본문에 자연스럽게 들어갈 관련 검색어 3~6개"],\n' +
  '    "tags": ["티스토리·네이버·블로거 태그칸용 5~10개. 공백 없는 짧은 단어. 예: 리튬이온전지, 이차전지, 배터리원리"],\n' +
  '    "intent": "이 질문을 검색한 사람이 정확히 알고 싶은 것 1~2문장",\n' +
  '    "audience": "핵심 독자 한 줄",\n' +
  '    "edge": "이미 있는 글들과 다른 점 한 줄",\n' +
  '    "titles": ["궁금증을 자극하는 추천 제목 3개", "", ""],\n' +
  '    "meta": "메타 설명 80~120자"\n' +
  '  },\n' +
  '  "title": "titles 중 가장 나은 것 하나",\n' +
  '  "intro": "도입부(흥미·어그로). 첫 문장=장면/반전/도발 질문/의외의 사실. 2~3문단, 빈 줄 두 개로 구분, 문단당 1문장. 사전 정의·밋밋한 인사 금지.",\n' +
  '  "answerHeading": "핵심 답변 소제목 (h2). 질문에 답하는 형태로. 어울리는 이모지 하나로 시작.",\n' +
  '  "answerBody": "첫 문단은 핵심 한 줄. 대비·단계는 list로. 문단은 기본 1문장(최대 2), 빈 줄 두 개로 구분. 길게 서술하지 말 것.",\n' +
  '  "sections": [\n' +
  '    {\n' +
  '      "heading": "h2 소제목. 내용에 맞는 이모지 하나로 시작 (예: 😴 잠들기 직전의 움찔)",\n' +
  '      "body": "핵심 한두 문장만. 빈 줄 두 개로 구분. 덩어리 전체 100~200자. 세부 설명은 list에.",\n' +
  '      "listType": "ol | ul | none",\n' +
  '      "list": ["대비·단계면 여기. 예: 방전: 리튬 이온이 음극 → 양극으로 이동하며 전기를 만듭니다."],\n' +
  '      "table": null,\n' +
  '      "note": "덧붙일 한 줄. 알아두면 좋은 내용은 💡, 주의는 ⚠️로 시작. 없으면 빈 문자열"\n' +
  '    }\n' +
  '  ],\n' +
  '  "faq": [{ "q": "추가로 검색할 만한 질문", "a": "1~2문장. 본문 반복 금지" }],\n' +
  '  "closing": "마무리 1~2문장. 궁금증이 풀렸다는 느낌으로 짧게. 인사말·소감 금지. 이모지는 하나까지.",\n' +
  '  "references": ["Nature, How snakes lost their legs — https://www.nature.com/articles/d41586-019-00000-0", "NASA, Why does ice float? — https://science.nasa.gov/"],\n' +
  '  "checks": ["발행 전 확인할 과학적 사실 (수치·연도·연구·기관 발표·학계 합의 여부)"],\n' +
  '  "images": [\n' +
  '    {\n' +
  '      "role": "cover | body",\n' +
  '      "slot": "top | intro | answer | section1 | section2 | faq | end",\n' +
  '      "purpose": "이 이미지가 이해를 어떻게 돕는지",\n' +
  '      "prompt": "영어 장면 묘사 2~4문장. 그 현상을 보여 주는 실사 사진 장면으로. 화풍은 앱이 붙이니 쓰지 말 것.",\n' +
  '      "alt": "그 그림을 눈으로 보듯 설명하는 한국어 한 문장"\n' +
  '    }\n' +
  '  ],\n' +
  '  "related": ["같은 큰 주제에서 다른 질문으로 뻗어 갈 글 3~5개"]\n' +
  '}\n'

export function buildSeoFillPrompt(state: State): string {
  return (
    '티스토리 과학 블로그 글 초안을 JSON으로만 작성해 주세요. 앱이 이 JSON을 HTML로 렌더합니다.\n\n' +
    '# 절대 규칙\n' +
    '- 코드펜스·설명 없이 JSON 객체 하나만 출력하세요.\n' +
    '- 아래 스키마의 키만 쓰세요. HTML 태그를 값 안에 넣지 마세요 (앱이 태그를 만듭니다).\n' +
    '- 문단 구분은 빈 줄 두 개(\\n\\n)로 하세요.\n\n' +
    topicBlock(state) + '\n' +
    PILLAR_RULES + '\n' +
    BLOG_RULES + '\n' +
    RHYTHM_RULES + '\n' +
    INTRO_RULES + '\n' +
    STYLE_RULES + '\n' +
    EMOJI_RULES + '\n' +
    DEPTH_RULES + '\n' +
    FACT_RULES + '\n' +
    HEALTH_RULES + '\n' +
    IMAGE_RULES + '\n' +
    SEO_RULES + '\n' +
    '# 구성 규칙\n' +
    '- sections는 3~5개. 궁금증이 풀리면 거기서 멈추세요. 억지로 늘리지 마세요.\n' +
    '- 한 문단은 기본 1문장(최대 2). 세 문장이면 나누거나 목록으로 바꾸세요.\n' +
    '- intro는 흥미·어그로 훅. 장면·반전·도발 질문·의외의 사실로 시작하세요.\n' +
    '  사전 정의·"오늘은 ~" 금지. 거짓 낚시는 금지, 궁금증 자극은 OK.\n' +
    '- 설명은 쉬운 말·짧은 문장. 핵심 한 줄 → "라벨: 한 줄" 목록 패턴을 자주 쓰세요.\n' +
    '  (예: 방전: … / 충전: …). 긴 서술 단락으로 풀지 마세요.\n' +
    '- 대비·단계·과정은 listType "ul" 또는 "ol"로. 문단만으로 길게 쓰지 마세요.\n' +
    '- plan.tags는 플랫폼 태그칸용 5~10개. 유입을 노리는 검색어 위주.\n' +
    '  공백·특수문자 없이 짧게 (예: 리튬이온전지, 배터리원리, 이차전지). 너무 일반적인 단어만 나열하지 마세요.\n' +
    '- 비교·정리에 정말 도움이 될 때만 table을 채우세요.\n' +
    '  채울 땐 {"headers":["항목","내용"],"rows":[["A","설명"]]} 형태로, 아니면 null.\n' +
    '- faq는 3~5개. 답은 1~2문장이고, 본문에 이미 쓴 내용을 반복하지 마세요.\n' +
    '  질문은 본문을 읽은 독자가 다음에 할 행동·선택(얼마나? 영양제는? 내 경우는?)을 우선하세요.\n' +
    '- 확실한 사실만 단정하세요. 추정은 "~로 알려져 있습니다", "~연구한 바 있습니다",\n' +
    '  "아직 확실하지는 않지만 ~"처럼 구분해서 쓰세요. 근거가 애매하면 checks에 넣으세요.\n' +
    '- references는 2~5개. **반드시** "매체, 제목 — https://..." 형식(URL 포함).\n' +
    '  예: Nature, How snakes lost their legs — https://www.nature.com/articles/...\n' +
    '  지어낸 논문·가짜 URL 금지. URL이 불확실하면 항목을 빼고 checks에 넣으세요.\n' +
    '- images는 대표 이미지(role "cover", slot "top") 1개 + 본문 이미지(role "body") 4~6개.\n' +
    '- 가능하면 answer·각 section 아래에 본문 이미지를 나눠 배치하세요. 글만 길게 이어지지 않게.\n' +
    '- images[].prompt에는 **장면만** 영어로 쓰세요. 실사 화풍·색·구도는 앱이 자동으로 붙입니다.\n' +
    '- related는 같은 큰 주제에서 다른 질문으로 이어지는 것으로 3~5개.\n\n' +
    '# 스키마\n' +
    SCHEMA
  )
}

export function parseSeoResponse(raw: string): SeoContent | null {
  const o = extractJsonObject(raw)
  if (!o) return null
  const c = migrateSeoContent(o)
  const filled =
    c.title.trim() || c.intro.trim() || c.answerBody.trim() ||
    c.sections.some((s) => s.heading.trim() || s.body.trim())
  if (!filled) return null
  if (!c.title.trim() && c.plan.titles.length) c.title = c.plan.titles[0]
  c.images = c.images.map((im) => ({ ...im, prompt: stripCatStyle(im.prompt) }))
  return c
}

// ---------- 이미지 프롬프트 하나만 다시 쓰기 ----------

/** 이미지 한 장의 장면을 다시 짜게 하는 프롬프트 */
export function buildImageScenePrompt(state: State, index: number): string {
  const c = state.content
  const im = c.images[index]
  if (!im) return ''
  const near = c.sections.map((x) => x.heading.trim()).filter(Boolean).join(' / ')
  return (
    '과학 블로그 글에 넣을 일러스트 한 장의 **장면**을 다시 짜 주세요.\n\n' +
    '# 절대 규칙\n' +
    '- 코드펜스·설명 없이 JSON 객체 하나만 출력하세요.\n' +
    '- 키는 prompt, alt 두 개뿐입니다.\n\n' +
    '# 이 글\n' +
    '- 다루는 궁금증: ' + (state.topic.trim() || c.title || '[미입력]') + '\n' +
    '- 제목: ' + (c.title.trim() || '[미정]') + '\n' +
    (c.answerBody.trim() ? '- 핵심 답변: ' + c.answerBody.trim().split('\n')[0] + '\n' : '') +
    (near ? '- 본문 소제목: ' + near + '\n' : '') +
    '\n# 이 이미지\n' +
    '- 역할: ' + (im.role === 'cover' ? '대표 이미지' : '본문 이미지') + '\n' +
    '- 들어갈 자리: ' + slotLabel(im.slot, c.sections) + '\n' +
    (im.purpose.trim() ? '- 목적: ' + im.purpose.trim() + '\n' : '') +
    (stripCatStyle(im.prompt) ? '- 지금 장면(마음에 안 들어 다시 씁니다): ' + stripCatStyle(im.prompt) + '\n' : '') +
    '\n' +
    IMAGE_RULES + '\n' +
    '# 스키마\n' +
    '{\n' +
    '  "prompt": "영어 장면 묘사 2~4문장. 실사 화풍·색·구도는 쓰지 말 것 (앱이 붙입니다).",\n' +
    '  "alt": "그 그림을 눈으로 보듯 설명하는 한국어 한 문장"\n' +
    '}\n' +
    (stripCatStyle(im.prompt) ? '\n지금 장면과 눈에 띄게 다른 구도·상황으로 바꿔 주세요.\n' : '')
  )
}

export function parseImageScene(raw: string): { prompt: string; alt: string } | null {
  const o = extractJsonObject(raw)
  if (!o) return null
  const r = o as Record<string, unknown>
  const prompt = stripCatStyle(typeof r.prompt === 'string' ? r.prompt : '')
  const alt = typeof r.alt === 'string' ? r.alt.trim() : ''
  if (!prompt) return null
  return { prompt, alt }
}
