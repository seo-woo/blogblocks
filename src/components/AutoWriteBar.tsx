import { memo, useCallback, useRef, useState, type ChangeEvent } from 'react'
import { AiError, canAutoWrite, completePrompt, getGeminiKey, setGeminiKey } from '../lib/ai'

type Props = {
  blockedReason?: string
  hasExisting: boolean
  prompt: string
  parseAndApply: (text: string) => boolean
}

function AutoWriteBar({ blockedReason, hasExisting, prompt, parseAndApply }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error' | 'parse-error' | 'need-key'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [showKey, setShowKey] = useState(() => !canAutoWrite())
  const [keyDraft, setKeyDraft] = useState(() => getGeminiKey())
  const reqId = useRef(0)

  const handleKeyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setKeyDraft(e.target.value)
  }, [])

  const handleSaveKey = useCallback(() => {
    setGeminiKey(keyDraft)
    setShowKey(!keyDraft.trim())
    setStatus('idle')
    setErrMsg(keyDraft.trim() ? '키를 저장했어요. 이제 자동 작성을 눌러 주세요.' : '')
  }, [keyDraft])

  const handleToggleKey = useCallback(() => {
    setShowKey((v) => !v)
  }, [])

  const handleWrite = useCallback(async () => {
    if (blockedReason) {
      window.alert(blockedReason)
      return
    }
    if (!canAutoWrite()) {
      setShowKey(true)
      setStatus('need-key')
      return
    }
    if (hasExisting) {
      const ok = window.confirm(
        '지금 칸에 있는 글을 초안으로 덮어씁니다. 사진은 그대로 둡니다. 계속할까요?',
      )
      if (!ok) return
    }
    const id = ++reqId.current
    setStatus('loading')
    setErrMsg('')
    try {
      const text = await completePrompt(prompt)
      if (id !== reqId.current) return
      if (!parseAndApply(text)) {
        setStatus('parse-error')
        return
      }
      setStatus('ok')
      window.setTimeout(() => {
        setStatus((s) => (s === 'ok' ? 'idle' : s))
      }, 4000)
    } catch (err) {
      if (id !== reqId.current) return
      if (err instanceof AiError && err.code === 'NO_KEY') {
        setShowKey(true)
        setStatus('need-key')
        return
      }
      setStatus('error')
      setErrMsg(err instanceof Error ? err.message : '자동 작성에 실패했어요.')
    }
  }, [blockedReason, hasExisting, parseAndApply, prompt])

  return (
    <div className="auto-write">
      <div className="auto-write-row">
        <button
          type="button"
          className="btn primary"
          onClick={handleWrite}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? '작성 중…' : hasExisting ? '내용 다시 작성' : '내용 자동 작성'}
        </button>
        <button type="button" className="btn" onClick={handleToggleKey}>
          {showKey ? '키 숨기기' : 'API 키'}
        </button>
      </div>
      {showKey && (
        <div className="auto-write-key">
          <label htmlFor="gemini-key">Gemini API 키 (브라우저에만 저장)</label>
          <input
            id="gemini-key"
            type="password"
            autoComplete="off"
            value={keyDraft}
            onChange={handleKeyChange}
            placeholder="AQ. 또는 AIza 로 시작하는 키"
          />
          <div className="auto-write-key-actions">
            <button type="button" className="btn" onClick={handleSaveKey}>키 저장</button>
            <a
              className="auto-write-link"
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
            >
              무료 키 받기
            </a>
          </div>
        </div>
      )}
      {status === 'need-key' && (
        <p className="content-hint sm">처음 한 번만 Google AI Studio에서 무료 키를 받아 저장하면 됩니다.</p>
      )}
      {status === 'ok' && (
        <p className="content-hint sm">초안을 칸에 넣었어요. 사실과 다른 부분만 고치면 됩니다. 사진은 직접 올려 주세요.</p>
      )}
      {status === 'parse-error' && (
        <p className="content-hint sm">응답을 칸에 넣지 못했어요. 한 번 더 눌러 주세요.</p>
      )}
      {status === 'error' && (
        <p className="content-hint sm">{errMsg || '자동 작성에 실패했어요. 키와 네트워크를 확인해 주세요.'}</p>
      )}
      {errMsg && status === 'idle' && (
        <p className="content-hint sm">{errMsg}</p>
      )}
    </div>
  )
}

export default memo(AutoWriteBar)
