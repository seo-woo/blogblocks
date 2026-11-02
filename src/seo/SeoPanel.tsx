import { useCallback, useMemo, useState } from 'react'
import { hasContent, type State } from '../types'
import AutoWriteBar from '../components/AutoWriteBar'
import SeoFields from './SeoFields'
import SeoContentEditor from './SeoContentEditor'
import { buildSeoFillPrompt, parseSeoResponse } from './seoAi'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

export default function SeoPanel({ state, set }: { state: State; set: Setter }) {
  const [tab, setTab] = useState<'setup' | 'content'>('setup')

  const prompt = useMemo(() => buildSeoFillPrompt(state), [state])
  const existing = useMemo(() => hasContent(state.content), [state.content])

  const parseAndApply = useCallback((text: string) => {
    const next = parseSeoResponse(text)
    if (!next) return false
    set('content', next)
    setTab('content')
    return true
  }, [set])

  return (
    <div>
      <div className="subtabs">
        <button type="button" aria-pressed={tab === 'setup'} onClick={() => setTab('setup')}>
          주제 설정
        </button>
        <button type="button" aria-pressed={tab === 'content'} onClick={() => setTab('content')}>
          내용 다듬기
        </button>
      </div>

      <AutoWriteBar
        blockedReason={state.topic.trim() ? undefined : '먼저 오늘의 궁금증을 입력해 주세요.'}
        hasExisting={existing}
        prompt={prompt}
        parseAndApply={parseAndApply}
      />

      {tab === 'setup'
        ? <SeoFields state={state} set={set} />
        : <SeoContentEditor state={state} set={set} />}
    </div>
  )
}
