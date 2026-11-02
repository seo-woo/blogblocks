import { AiError, completeGemini, type GeminiFormat } from './gemini'

export { AiError }

const KEY_STORE = 'prompt-studio-gemini-key'

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

async function runPrompt(prompt: string, format: GeminiFormat): Promise<string> {
  if (window.claude && typeof window.claude.complete === 'function') {
    return window.claude.complete(prompt)
  }
  const key = getGeminiKey()
  if (!key) throw new AiError('NO_KEY', 'Gemini API 키가 필요해요')
  return completeGemini(prompt, key, format)
}

/** 초안·이미지 등 JSON 응답 */
export async function completePrompt(prompt: string): Promise<string> {
  return runPrompt(prompt, 'json')
}

/** 영어/네이버 서식처럼 순수 HTML·텍스트 응답 */
export async function completePlainPrompt(prompt: string): Promise<string> {
  return runPrompt(prompt, 'text')
}
