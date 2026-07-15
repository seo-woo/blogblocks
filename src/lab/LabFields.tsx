import type { State } from '../types'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

export default function LabFields({ state, set }: { state: State; set: Setter }) {
  return (
    <div>
      <div className="field">
        <label>이번 실험 주제 <span className="req">*</span></label>
        <input
          type="text"
          value={state.topic}
          onChange={(e) => set('topic', e.target.value)}
          placeholder="예: 회의록 정리를 AI로 자동화해보기"
        />
      </div>
      <div className="field">
        <label>사용한 AI 도구</label>
        <input
          type="text"
          value={state.tools}
          onChange={(e) => set('tools', e.target.value)}
          placeholder="예: Claude, Notion AI"
        />
      </div>
      <div className="row">
        <div className="field">
          <label>기존 방식 · Before</label>
          <textarea
            value={state.before}
            onChange={(e) => set('before', e.target.value)}
            placeholder="원래는 어떻게 했나요?"
          />
        </div>
        <div className="field">
          <label>AI 방식 · After</label>
          <textarea
            value={state.after}
            onChange={(e) => set('after', e.target.value)}
            placeholder="AI로 어떻게 바꿨나요?"
          />
        </div>
      </div>
      <div className="field">
        <label>결과 (시간·품질·실패)</label>
        <textarea
          value={state.result}
          onChange={(e) => set('result', e.target.value)}
          placeholder="예: 30분 → 5분. 다만 표 정리는 여전히 손이 감"
        />
      </div>
      <div className="field">
        <label>강조할 포인트 / 에피소드</label>
        <textarea
          value={state.episode}
          onChange={(e) => set('episode', e.target.value)}
          placeholder="꼭 넣고 싶은 순간이나 깨달음"
        />
      </div>
    </div>
  )
}
