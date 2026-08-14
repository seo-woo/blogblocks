import type { Mode, State } from '../types'
import { hydrateState } from './state'

const DB_NAME = 'prompt-studio'
const STORE_NAME = 'drafts'
const FILE_KIND = 'prompt-studio-draft'

export interface SavedDraft {
  id: string
  name: string
  savedAt: number
  mode: Mode
  state: State
}

export interface DraftFile {
  kind: typeof FILE_KIND
  v: 1
  name: string
  savedAt: number
  state: State
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB를 열 수 없어요'))
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('저장에 실패했어요'))
    tx.onabort = () => reject(tx.error ?? new Error('저장이 취소됐어요'))
  })
}

export async function listDrafts(): Promise<SavedDraft[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => {
      const rows = (req.result as SavedDraft[] || []).slice()
      rows.sort((a, b) => b.savedAt - a.savedAt)
      resolve(rows)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function saveDraft(name: string, state: State, id?: string): Promise<SavedDraft> {
  const draft: SavedDraft = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : `d-${Date.now()}`),
    name: name.trim() || '제목 없음',
    savedAt: Date.now(),
    mode: state.mode,
    state,
  }
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(draft)
  await txDone(tx)
  return draft
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(id)
  await txDone(tx)
}

export function toDraftFile(name: string, state: State, savedAt = Date.now()): DraftFile {
  return { kind: FILE_KIND, v: 1, name, savedAt, state }
}

export function parseDraftPayload(raw: unknown): { name: string; state: State } {
  if (!raw || typeof raw !== 'object') {
    throw new Error('올바른 임시 저장 파일이 아니에요')
  }
  const o = raw as Record<string, unknown>
  if (o.kind === FILE_KIND && o.state) {
    return {
      name: String(o.name || ''),
      state: hydrateState(o.state),
    }
  }
  if (o.mode || o.travelContent || o.foodContent || o.productContent) {
    return { name: '', state: hydrateState(o) }
  }
  throw new Error('프롬프트 스튜디오 임시 저장 파일이 아니에요')
}

export function draftFileName(name: string): string {
  const safe = name.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 40) || 'draft'
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `${safe}-${stamp}.json`
}

export function makeDraftBlob(name: string, state: State, savedAt?: number): File {
  const payload = JSON.stringify(toDraftFile(name, state, savedAt))
  return new File([payload], draftFileName(name), { type: 'application/json' })
}

function triggerDownload(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function sendDraftFile(file: File): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
  }
  if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: file.name })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    }
  }
  triggerDownload(file)
  return 'downloaded'
}

export async function readDraftFile(file: File): Promise<{ name: string; state: State }> {
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON 파일을 읽지 못했어요')
  }
  return parseDraftPayload(raw)
}
