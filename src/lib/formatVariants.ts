import { completePlainPrompt } from './ai'
import { extractJsonObject } from './parseJson'

export type FormatVariant = 'en' | 'naver'

/** 모델이 실수로 JSON/코드펜스로 감싸도 HTML만 남긴다 */
function extractHtml(raw: string): string {
  let t = (raw || '').trim()
  t = t.replace(/^```(?:html|json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  const obj = extractJsonObject(t)
  if (obj) {
    for (const key of ['html', 'content', 'body', 'result', 'text']) {
      const v = obj[key]
      if (typeof v === 'string' && /<[a-z]/i.test(v)) {
        t = v
        break
      }
    }
  }

  // 이스케이프된 줄바꿈·따옴표가 남아 있으면 풀어 줌
  if (t.includes('\\n') || t.includes('\\"')) {
    t = t.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }

  // `{ "html": "` … `"}` 찌꺼기
  t = t.replace(/^[\s{]*"?html"?\s*:\s*"?/i, '')
  t = t.replace(/"\s*}\s*$/i, '')

  // 앞뒤 JSON 잡문 제거 — 첫 태그부터 마지막 태그까지
  const start = t.search(/<[a-z]/i)
  const end = Math.max(t.lastIndexOf('>'), t.lastIndexOf('/>'))
  if (start >= 0 && end > start) t = t.slice(start, end + 1)

  return t.trim()
}

function buildRewritePrompt(html: string, variant: FormatVariant): string {
  const common =
    '아래는 티스토리/블로거용 본문 HTML이다.\n' +
    '태그 구조(h2, h3, p, ul, ol, li, table, thead, tbody, tr, th, td, blockquote, strong, a)는 그대로 두고,\n' +
    '텍스트만 바꿔라.\n\n' +
    '# 출력 형식 (매우 중요)\n' +
    '- JSON 금지. {"html":...} 같은 객체로 감싸지 마라.\n' +
    '- 코드펜스(```) 금지. 설명·주석 금지.\n' +
    '- 순수 HTML만 출력. <p> 또는 <h2>로 시작하고 태그로 끝낸다.\n' +
    '- [이미지 N] 자리표시자와 그 뒤 ALT 문구 패턴은 유지하라.\n' +
    '- 이모지는 소제목에 붙어 있으면 그대로 둬라.\n\n'

  const tone =
    variant === 'en'
      ? '# 목표\n' +
        '- Google Blogger용 영어 본문으로 번역한다.\n' +
        '- 자연스럽고 읽기 쉬운 과학 설명 톤. 딱딱한 학술체나 AI 상투어 금지.\n' +
        '- 문단은 짧게. 한 문단 1~2문장.\n' +
        '- FAQ의 "Q." 표기는 유지하고 질문·답만 영어로.\n' +
        '- "🙋 자주 묻는 질문"은 "🙋 FAQ"로.\n' +
        '- "📚 참고자료"는 "📚 References"로. 참고 항목(매체·제목·URL)은 그대로 둔다.\n' +
        '- a 태그(href)가 있으면 유지한다.\n\n'
      : '# 목표\n' +
        '- 네이버 블로그에 올리는 듯한 친근한 말투로 다시 쓴다.\n' +
        '- "~해요/~해요!" 체를 기본으로, 말하듯 읽히게.\n' +
        '- 과학 내용은 정확히 유지하되, 설명은 더 쉽게·짧게.\n' +
        '- 과한 이모지·감탄·광고 말투는 금지. 상투적 AI 마무리 금지.\n' +
        '- 문단은 기본 1문장(최대 2).\n' +
        '- 참고자료 목록(매체·제목·URL)과 a 태그는 그대로 둔다.\n\n'

  return common + tone + '# 원문 HTML\n' + html
}

/** 본문 HTML을 영어 또는 네이버 말투로 다시 쓴다 */
export async function rewriteHtmlVariant(
  html: string,
  variant: FormatVariant,
): Promise<string> {
  const raw = await completePlainPrompt(buildRewritePrompt(html, variant))
  const out = extractHtml(raw)
  if (!out || !/<[a-z][\s\S]*>/i.test(out)) {
    throw new Error('다시 쓴 본문을 읽지 못했어요. 한 번 더 눌러 주세요.')
  }
  return out
}
