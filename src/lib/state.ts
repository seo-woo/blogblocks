import { initialState, INTENTS, migrateSeoContent, type IntentId, type State } from '../types'

export function hydrateState(raw: unknown): State {
  if (!raw || typeof raw !== 'object') return { ...initialState }
  const saved = raw as Record<string, unknown>

  // 구버전(여행·맛집·제품 모드) 저장본에는 이번 글에 쓸 값이 없다 → 기본값으로 시작
  const intent = INTENTS.some((i) => i.id === saved.intent)
    ? saved.intent as IntentId
    : initialState.intent

  return {
    ...initialState,
    topic: typeof saved.topic === 'string' ? saved.topic : '',
    intent,
    field: typeof saved.field === 'string' ? saved.field : initialState.field,
    target: typeof saved.target === 'string' ? saved.target : '',
    reader: typeof saved.reader === 'string' ? saved.reader : '',
    facts: typeof saved.facts === 'string' ? saved.facts : '',
    length: typeof saved.length === 'string' ? saved.length : initialState.length,
    imageMarkers: typeof saved.imageMarkers === 'boolean'
      ? saved.imageMarkers
      : initialState.imageMarkers,
    content: migrateSeoContent(saved.content),
  }
}

export function suggestDraftName(s: State): string {
  return s.content.title.trim() || s.topic.trim() || '제목 없는 글'
}
