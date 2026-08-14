import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import type { State } from '../types'
import {
  deleteDraft,
  listDrafts,
  makeDraftBlob,
  readDraftFile,
  saveDraft,
  sendDraftFile,
  type SavedDraft,
} from '../lib/drafts'
import { MODE_LABEL, suggestDraftName } from '../lib/state'

type Props = {
  open: boolean
  state: State
  onClose: () => void
  onRestore: (next: State) => void
}

function formatWhen(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const DraftRow = memo(function DraftRow({
  draft,
  onLoad,
  onSend,
  onRemove,
}: {
  draft: SavedDraft
  onLoad: (draft: SavedDraft) => void
  onSend: (draft: SavedDraft) => void
  onRemove: (draft: SavedDraft) => void
}) {
  const { name, mode, savedAt } = draft

  const handleLoad = useCallback(() => { onLoad(draft) }, [draft, onLoad])
  const handleSend = useCallback(() => { onSend(draft) }, [draft, onSend])
  const handleRemove = useCallback(() => { onRemove(draft) }, [draft, onRemove])

  return (
    <li className="draft-row">
      <div className="draft-row-main">
        <div className="draft-row-title">{name}</div>
        <div className="draft-row-meta">{MODE_LABEL[mode]} · {formatWhen(savedAt)}</div>
      </div>
      <div className="draft-row-actions">
        <button type="button" className="btn" onClick={handleLoad}>불러오기</button>
        <button type="button" className="btn" onClick={handleSend}>보내기</button>
        <button type="button" className="btn" onClick={handleRemove}>삭제</button>
      </div>
    </li>
  )
})

function DraftsDialog({ open, state, onClose, onRestore }: Props) {
  const [name, setName] = useState('')
  const [drafts, setDrafts] = useState<SavedDraft[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    try {
      setDrafts(await listDrafts())
    } catch {
      setDrafts([])
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setName(suggestDraftName(state))
    setMsg('')
    void refresh()
  }, [open, state, refresh])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  const handleBackdrop = useCallback(() => {
    if (!busy) onClose()
  }, [busy, onClose])

  const handleDialogClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }, [])

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleSaveHere = useCallback(async () => {
    setBusy(true)
    setMsg('')
    try {
      await saveDraft(name, state)
      await refresh()
      setMsg('이 기기에 저장했어요. PC에서 쓰려면 아래에서 ‘보내기’로 파일을 전달하세요.')
    } catch {
      setMsg('이 기기 저장에 실패했어요. 사진이 많으면 ‘파일로 보내기’를 이용해 주세요.')
    } finally {
      setBusy(false)
    }
  }, [name, refresh, state])

  const handleSendCurrent = useCallback(async () => {
    setBusy(true)
    setMsg('')
    try {
      const file = makeDraftBlob(name || suggestDraftName(state), state)
      const result = await sendDraftFile(file)
      if (result === 'shared') setMsg('공유 앱에서 파일을 보내면, PC에서 ‘파일에서 열기’로 이어서 쓸 수 있어요.')
      else if (result === 'downloaded') setMsg('파일을 저장했어요. 메일·에어드롭·클라우드로 PC에 옮긴 뒤 ‘파일에서 열기’를 누르세요.')
    } catch {
      setMsg('파일을 만들지 못했어요.')
    } finally {
      setBusy(false)
    }
  }, [name, state])

  const handleLoad = useCallback((draft: SavedDraft) => {
    if (!window.confirm(`‘${draft.name}’을(를) 불러올까요? 지금 화면의 내용은 덮어씁니다.`)) return
    onRestore(draft.state)
    onClose()
  }, [onClose, onRestore])

  const handleSendSaved = useCallback(async (draft: SavedDraft) => {
    setBusy(true)
    setMsg('')
    try {
      const file = makeDraftBlob(draft.name, draft.state, draft.savedAt)
      const result = await sendDraftFile(file)
      if (result === 'shared') setMsg('파일을 보냈어요. PC에서 ‘파일에서 열기’로 불러오면 됩니다.')
      else if (result === 'downloaded') setMsg('파일을 저장했어요. PC로 옮긴 뒤 ‘파일에서 열기’를 누르세요.')
    } catch {
      setMsg('파일을 보내지 못했어요.')
    } finally {
      setBusy(false)
    }
  }, [])

  const handleRemove = useCallback(async (draft: SavedDraft) => {
    if (!window.confirm(`‘${draft.name}’ 임시 저장을 삭제할까요?`)) return
    setBusy(true)
    try {
      await deleteDraft(draft.id)
      await refresh()
    } catch {
      setMsg('삭제하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }, [refresh])

  const handlePickFile = useCallback(() => {
    fileRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setMsg('')
    try {
      const parsed = await readDraftFile(file)
      if (!window.confirm('이 파일로 지금 작업을 덮어쓸까요?')) return
      onRestore(parsed.state)
      onClose()
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '파일을 열지 못했어요.')
    } finally {
      setBusy(false)
    }
  }, [onClose, onRestore])

  if (!open) return null

  return (
    <div className="draft-overlay" onClick={handleBackdrop}>
      <div
        className="draft-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-dialog-title"
        onClick={handleDialogClick}
      >
        <div className="draft-dialog-head">
          <h2 id="draft-dialog-title">임시 저장</h2>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>닫기</button>
        </div>

        <p className="draft-help">
          핸드폰에서 써 둔 글을 PC로 이어가려면, 저장한 뒤 <strong>보내기</strong>로 파일을 전달하고
          PC에서 <strong>파일에서 열기</strong>를 누르세요. 사진은 파일에 함께 들어갑니다.
        </p>

        <div className="field">
          <label htmlFor="draft-name">저장 이름</label>
          <input
            id="draft-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="예: 에어팟 리뷰"
            autoComplete="off"
          />
        </div>

        <div className="draft-toolbar">
          <button type="button" className="btn primary" onClick={handleSaveHere} disabled={busy}>
            이 기기에 저장
          </button>
          <button type="button" className="btn" onClick={handleSendCurrent} disabled={busy}>
            파일로 보내기
          </button>
          <button type="button" className="btn" onClick={handlePickFile} disabled={busy}>
            파일에서 열기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleFileChange}
          />
        </div>

        {msg ? <p className="draft-msg" role="status">{msg}</p> : null}

        <h3 className="draft-list-title">이 기기에 저장된 초안</h3>
        {drafts.length === 0 ? (
          <p className="draft-empty">아직 저장된 초안이 없어요.</p>
        ) : (
          <ul className="draft-list">
            {drafts.map((d) => (
              <DraftRow
                key={d.id}
                draft={d}
                onLoad={handleLoad}
                onSend={handleSendSaved}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default memo(DraftsDialog)
