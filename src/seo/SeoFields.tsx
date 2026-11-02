import { FIELDS, INTENTS, LENGTHS, intentDef, type State } from '../types'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

export default function SeoFields({ state, set }: { state: State; set: Setter }) {
  const d = intentDef(state.intent)

  return (
    <div>
      <div className="field">
        <label>오늘의 궁금증 <span className="req">*</span></label>
        <input
          type="text"
          value={state.topic}
          onChange={(e) => set('topic', e.target.value)}
          placeholder="예: 왜 하품은 다른 사람에게 전염될까?"
        />
        <p className="content-hint sm">
          ‘수면’처럼 넓은 말 대신 <strong>질문 하나</strong>로 적으세요. 제목만 보고 “어? 그러게”가 나와야 합니다.
        </p>
      </div>

      <div className="field">
        <label>궁금증 유형</label>
        <div className="chips">
          {INTENTS.map((i) => (
            <button
              key={i.id}
              type="button"
              className="chip"
              aria-pressed={state.intent === i.id}
              onClick={() => set('intent', i.id)}
            >
              {i.label}
            </button>
          ))}
        </div>
        <p className="content-hint sm">
          <strong>{d.suffix}</strong> · 본문 뼈대: {d.outline}
        </p>
      </div>

      <div className="field">
        <label>분야</label>
        <div className="chips">
          {FIELDS.map((f) => (
            <button
              key={f}
              type="button"
              className="chip"
              aria-pressed={state.field === f}
              onClick={() => set('field', f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>전제 · 범위</label>
          <input
            type="text"
            value={state.target}
            onChange={(e) => set('target', e.target.value)}
            placeholder="예: 성인 기준 · 지구 대기에서"
          />
        </div>
        <div className="field">
          <label>이 질문을 검색할 사람</label>
          <input
            type="text"
            value={state.reader}
            onChange={(e) => set('reader', e.target.value)}
            placeholder="예: 회의 중에 하품이 옮는 걸 느낀 사람"
          />
        </div>
      </div>

      <div className="field">
        <label>확인한 사실 · 참고 자료</label>
        <textarea
          value={state.facts}
          onChange={(e) => set('facts', e.target.value)}
          placeholder={'확인한 연구·수치·기관 자료를 적어 주세요.\n여기 적힌 내용이 최우선으로 반영되고, 나머지는 지어내지 않습니다.'}
        />
      </div>

      <div className="field">
        <label>목표 분량</label>
        <select value={state.length} onChange={(e) => set('length', e.target.value)}>
          {LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="field">
        <label className="toggle-line">
          <input
            type="checkbox"
            checked={state.imageMarkers}
            onChange={(e) => set('imageMarkers', e.target.checked)}
          />
          본문에 <strong>[이미지 N]</strong> 자리표시자 넣기
        </label>
        <p className="content-hint sm">
          티스토리에 붙여넣은 뒤 그 줄을 실제 사진으로 바꾸면 됩니다.
        </p>
      </div>
    </div>
  )
}
