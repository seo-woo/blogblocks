/**
 * 매일 초안 하나를 만들어 drafts/ 에 떨어뜨린다.
 * 큐(topics.md)의 맨 윗줄을 꺼내 쓰고, 쓴 줄은 '만든 것'으로 옮긴다.
 *
 * 실행: npm run draft            (로컬)
 *       GEMINI_API_KEY 필요
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { completeGemini } from '../src/lib/gemini'
import { buildSeoFillPrompt, parseSeoResponse } from '../src/seo/seoAi'
import { renderSeoHtml } from '../src/seo/seoHtml'
import { buildMasterPrompt } from '../src/seo/rules'
import { toDraftFile } from '../src/lib/drafts'
import { withImageStyle } from '../src/seo/imageStyle'
import {
  FIELDS, INTENTS, initialState, intentDef, slotLabel,
  type IntentId, type State,
} from '../src/types'

const QUEUE = 'topics.md'
const DRAFT_DIR = 'drafts'
const WAITING = '## 대기'
const DONE = '## 만든 것'

function kstToday(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
}

function summary(line: string): void {
  console.log(line)
  const f = process.env.GITHUB_STEP_SUMMARY
  if (f) appendFileSync(f, line + '\n')
}

function fail(msg: string): never {
  summary(`❌ ${msg}`)
  process.exit(1)
}

// ---------- 큐 ----------

interface Topic {
  raw: string
  topic: string
  intent: IntentId
  field: string
  target: string
}

function parseTopicLine(raw: string): Topic {
  const [topic = '', intent = '', field = '', target = ''] = raw.split('|').map((s) => s.trim())
  return {
    raw,
    topic,
    intent: INTENTS.some((i) => i.id === intent) ? intent as IntentId : 'why',
    field: FIELDS.includes(field) ? field : initialState.field,
    target,
  }
}

function readQueue(): { lines: string[]; waitingAt: number; doneAt: number } {
  const lines = readFileSync(QUEUE, 'utf8').split('\n')
  const waitingAt = lines.findIndex((l) => l.trim() === WAITING)
  const doneAt = lines.findIndex((l) => l.trim() === DONE)
  if (waitingAt === -1 || doneAt === -1 || doneAt < waitingAt) {
    fail(`${QUEUE}에 '${WAITING}'와 '${DONE}' 제목이 순서대로 있어야 합니다.`)
  }
  return { lines, waitingAt, doneAt }
}

function pickTopic(): { topic: Topic; commit: (folder: string) => void; left: number } | null {
  const { lines, waitingAt, doneAt } = readQueue()
  const bodyIdx: number[] = []
  for (let i = waitingAt + 1; i < doneAt; i++) {
    const t = lines[i].trim()
    if (t && !t.startsWith('#')) bodyIdx.push(i)
  }
  if (!bodyIdx.length) return null

  const at = bodyIdx[0]
  const topic = parseTopicLine(lines[at])

  return {
    topic,
    left: bodyIdx.length - 1,
    commit: (folder: string) => {
      const next = readFileSync(QUEUE, 'utf8').split('\n')
      next.splice(at, 1)
      const d = next.findIndex((l) => l.trim() === DONE)
      next.splice(d + 1, 0, `- ${kstToday()} · ${topic.topic} → \`${folder}\``)
      writeFileSync(QUEUE, next.join('\n'))
    },
  }
}

// ---------- 파일 이름 ----------

function slugify(s: string): string {
  return s
    .replace(/[\\/:*?"<>|.]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50) || 'draft'
}

// ---------- 초안 문서 ----------

function planMarkdown(state: State, folder: string): string {
  const c = state.content
  const d = intentDef(state.intent)
  const out: string[] = []

  out.push(`# ${c.title || state.topic}`)
  out.push('')
  out.push(`> 자동 생성 초안 · ${kstToday()} · ${d.label} (${state.field})`)
  out.push('>')
  out.push('> **사실 확인 전입니다.** 수치·연구·기관 발표를 먼저 확인한 뒤 발행하세요.')
  out.push('')

  if (c.checks.length) {
    out.push('## ⚠️ 발행 전 확인할 것')
    out.push('')
    for (const t of c.checks) out.push(`- [ ] ${t}`)
    out.push('')
  }

  out.push('## 1. 콘텐츠 기획')
  out.push('')
  out.push(`- **핵심 검색어** — ${c.plan.mainKeyword || state.topic}`)
  if (c.plan.subKeywords.length) out.push(`- **관련 키워드** — ${c.plan.subKeywords.join(', ')}`)
  if (c.plan.tags.length) out.push(`- **추천 태그** — ${c.plan.tags.join(', ')}`)
  if (c.plan.audience) out.push(`- **핵심 독자** — ${c.plan.audience}`)
  if (c.plan.edge) out.push(`- **차별화 포인트** — ${c.plan.edge}`)
  if (c.plan.meta) out.push(`- **메타 설명** — ${c.plan.meta}`)
  out.push('')
  if (c.plan.intent) {
    out.push('**독자가 알고 싶은 것**')
    out.push('')
    for (const l of c.plan.intent.split('\n').filter(Boolean)) out.push(`> ${l}`)
    out.push('')
  }
  if (c.plan.titles.length) {
    out.push('**추천 제목**')
    out.push('')
    c.plan.titles.forEach((t, i) => out.push(`${i + 1}. ${t}`))
    out.push('')
  }

  out.push('## 2. 본문')
  out.push('')
  out.push('붙여넣을 HTML은 `본문.html`. 티스토리 HTML 편집기에 그대로 넣으면 됩니다.')
  out.push('')
  out.push('구성:')
  out.push('')
  if (c.answerHeading) out.push(`- ${c.answerHeading} *(핵심 답변)*`)
  for (const s of c.sections) if (s.heading) out.push(`- ${s.heading}`)
  if (c.faq.length) out.push(`- 자주 묻는 질문 (${c.faq.length}개)`)
  if (c.references.length) out.push(`- 참고자료 (${c.references.length}개)`)
  out.push('')

  if (c.references.length) {
    out.push('### 참고자료')
    out.push('')
    for (const r of c.references) out.push(`- ${r}`)
    out.push('')
  }
  if (c.images.length) {
    out.push('## 3. 이미지 기획')
    out.push('')
    c.images.forEach((im, i) => {
      out.push(`### 이미지 ${i + 1} — ${im.role === 'cover' ? '대표' : '본문'} · ${slotLabel(im.slot, c.sections)}`)
      out.push('')
      if (im.purpose) out.push(`- **목적** — ${im.purpose}`)
      if (im.alt) out.push(`- **ALT** — ${im.alt}`)
      out.push('')
      if (im.prompt) {
        out.push('```text')
        out.push(withImageStyle(im.prompt))
        out.push('```')
        out.push('')
      }
    })
  }

  if (c.related.length) {
    out.push('## 4. 이어서 쓸 관련 글')
    out.push('')
    for (const t of c.related) out.push(`- ${t}`)
    out.push('')
    out.push(`위 주제 중 쓸 것을 \`${QUEUE}\`의 \`${WAITING}\`에 옮겨 적으면 다음 회차에 초안이 나옵니다.`)
    out.push('')
  }

  out.push('---')
  out.push('')
  out.push('사실 확인이 더 필요하면 `사실확인-프롬프트.txt`를 웹 검색이 되는 Claude에 붙여넣으세요.')
  out.push('스튜디오에서 이어 다듬으려면 `스튜디오-불러오기.json`을 임시 저장에서 불러오면 됩니다.')
  out.push('')
  out.push(`<!-- ${folder} -->`)
  out.push('')
  return out.join('\n')
}

// ---------- 실행 ----------

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY || ''
  if (!key) fail('GEMINI_API_KEY가 없습니다. 리포지터리 Secrets에 넣어 주세요.')

  const override = (process.env.TOPIC_OVERRIDE || '').trim()
  const picked = override ? null : pickTopic()

  if (!override && !picked) {
    summary(`✅ 오늘은 만들 게 없습니다 — \`${QUEUE}\`의 \`${WAITING}\`가 비었어요.`)
    summary('주제를 몇 줄 채워 두면 다음 날부터 다시 초안이 나옵니다.')
    return
  }

  const topic = override ? parseTopicLine(override) : picked!.topic
  if (!topic.topic) fail('주제 줄에서 궁금증을 읽지 못했습니다.')

  const state: State = {
    ...initialState,
    topic: topic.topic,
    intent: topic.intent,
    field: topic.field,
    target: topic.target,
  }

  summary(`### ${topic.topic}`)
  summary('')

  let content = null
  let lastErr = ''
  for (let attempt = 1; attempt <= 3 && !content; attempt++) {
    try {
      const raw = await completeGemini(buildSeoFillPrompt(state), key)
      content = parseSeoResponse(raw)
      if (!content) lastErr = '응답을 초안 구조로 읽지 못했습니다'
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
    }
    if (!content && attempt < 3) await new Promise((r) => setTimeout(r, 3000))
  }
  if (!content) fail(`초안 생성 실패 — ${lastErr}`)

  state.content = content

  const folder = join(DRAFT_DIR, `${kstToday()}-${slugify(topic.topic)}`)
  mkdirSync(folder, { recursive: true })

  writeFileSync(join(folder, '초안.md'), planMarkdown(state, folder))
  writeFileSync(join(folder, '본문.html'), renderSeoHtml(state) + '\n')
  writeFileSync(join(folder, '사실확인-프롬프트.txt'), buildMasterPrompt(state))
  writeFileSync(
    join(folder, '스튜디오-불러오기.json'),
    JSON.stringify(toDraftFile(content.title || topic.topic, state), null, 2),
  )

  if (picked) picked.commit(folder)

  const left = picked ? picked.left : -1
  summary(`- 섹션 ${content.sections.length}개 · FAQ ${content.faq.length}개 · 이미지 ${content.images.length}장`)
  summary(`- 확인할 것 ${content.checks.length}건`)
  summary(`- 폴더: \`${folder}\``)
  if (left === 0) summary('\n⚠️ **주제 큐가 비었습니다.** `topics.md`에 다음 주제를 채워 주세요.')
  else if (left > 0 && left <= 3) summary(`\n⚠️ 큐에 ${left}개 남았습니다.`)
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)))
