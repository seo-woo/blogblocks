/** 브라우저·Node 양쪽에서 쓰는 Gemini 호출부 (localStorage·window 의존 없음) */

/** 여유 있는 lite부터 시도. 혼잡(high demand)이면 다음 모델로. */
export const MODELS = [
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

export type GeminiFormat = 'json' | 'text'

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
  return new Promise((resolve) => { setTimeout(resolve, ms) })
}

function requestBody(prompt: string, format: GeminiFormat): string {
  if (format === 'text') {
    return JSON.stringify({
      systemInstruction: {
        parts: [{
          text:
            '출력은 순수 HTML 본문만. JSON·코드펜스·설명·주석·따옴표 래핑 금지. ' +
            '<p> 또는 <h2>로 시작하고 태그로 끝낸다.',
        }],
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
      },
    })
  }

  return JSON.stringify({
    systemInstruction: {
      parts: [{ text: 'JSON 객체만 출력하세요. 코드펜스·설명·주석 금지.' }],
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.75,
      responseMimeType: 'application/json',
    },
  })
}

export async function completeGemini(
  prompt: string,
  key: string,
  format: GeminiFormat = 'json',
): Promise<string> {
  let last = '모델을 찾지 못했어요'
  const body = requestBody(prompt, format)

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
