const KEY_STORE = 'prompt-studio-gemini-key'

/** 여유 있는 lite부터 시도. 혼잡(high demand)이면 다음 모델로. */
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
]

export class AiError extends Error {
  code: 'NO_KEY' | 'HTTP' | 'EMPTY'
  constructor(code: 'NO_KEY' | 'HTTP' | 'EMPTY', message: string) {
    super(message)
    this.code = code
    this.name = 'AiError'
  }
}

export function getGeminiKey(): string {
  try {
    return localStorage.getItem(KEY_STORE) || ''
  } catch {
    return ''
  }
}

export function setGeminiKey(key: string): void {
  const v = key.trim()
  try {
    if (v) localStorage.setItem(KEY_STORE, v)
    else localStorage.removeItem(KEY_STORE)
  } catch {
    /* ignore */
  }
}

export function canAutoWrite(): boolean {
  return !!(window.claude && typeof window.claude.complete === 'function') || !!getGeminiKey()
}

type GeminiRes = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  error?: { message?: string }
}

function isBusyStatus(status: number, message: string): boolean {
  if (status === 404) return true
  if (status === 429 || status === 500 || status === 503) return true
  const m = message.toLowerCase()
  return m.includes('high demand') || m.includes('resource exhausted') || m.includes('unavailable')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => { window.setTimeout(resolve, ms) })
}

async function completeGemini(prompt: string, key: string): Promise<string> {
  let last = '모델을 찾지 못했어요'
  const body = JSON.stringify({
    systemInstruction: {
      parts: [{ text: 'JSON 객체만 출력하세요. 코드펜스·설명·주석 금지.' }],
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.75,
      responseMimeType: 'application/json',
    },
  })

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i]
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body,
    })
    const data = (await res.json().catch(() => ({}))) as GeminiRes
    if (!res.ok) {
      last = data.error?.message || `요청 실패 (${res.status})`
      if (isBusyStatus(res.status, last)) {
        if (i < MODELS.length - 1) await sleep(400)
        continue
      }
      throw new AiError('HTTP', last)
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
    if (!text.trim()) {
      last = '빈 응답이 왔어요'
      continue
    }
    return text
  }
  throw new AiError(
    'HTTP',
    '지금은 Gemini 쪽이 혼잡해요. 1~2분 뒤 다시 눌러 보거나, 오른쪽 ‘프롬프트’를 복사해 Claude에 붙여넣어도 됩니다.',
  )
}

export async function completePrompt(prompt: string): Promise<string> {
  if (window.claude && typeof window.claude.complete === 'function') {
    return window.claude.complete(prompt)
  }
  const key = getGeminiKey()
  if (!key) throw new AiError('NO_KEY', 'Gemini API 키가 필요해요')
  return completeGemini(prompt, key)
}

export const TONE_BLOCK =
  '- 문체: ~어요 / ~습니다 혼용, 정중하되 딱딱하지 않게\n' +
  '- 무게감 + 가벼운 유머 한 방울, AI 상투적 마무리 금지\n' +
  '- 한 문단 3~4줄, 모바일 가독성 우선\n' +
  '- 구성에 없는 고유명사(정확한 메뉴명·스펙·가격)는 지어내지 마세요. 모르면 고치기 쉬운 일반 표현으로 자리를 잡으세요.\n' +
  '- 메모가 있으면 메모의 사실을 최우선으로 반영하세요.\n'
