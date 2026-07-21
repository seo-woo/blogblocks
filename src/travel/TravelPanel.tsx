import { useState } from 'react'
import type { State } from '../types'
import TravelFields from './TravelFields'
import TravelContent from './TravelContent'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

export default function TravelPanel({ state, set }: { state: State; set: Setter }) {
  const [tab, setTab] = useState<'setup' | 'content'>('setup')
  return (
    <div>
      <div className="subtabs">
        <button aria-pressed={tab === 'setup'} onClick={() => setTab('setup')}>구성</button>
        <button aria-pressed={tab === 'content'} onClick={() => setTab('content')}>내용 작성</button>
      </div>
      {tab === 'setup'
        ? <TravelFields state={state} set={set} />
        : <TravelContent state={state} set={set} />}
    </div>
  )
}
