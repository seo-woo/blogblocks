import { TRAVEL_SECTIONS, type Region, type State } from '../types'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

const COMPANIONS = ['혼자', '짝꿍', '가족', '부모님'] as const

export default function TravelFields({ state, set }: { state: State; set: Setter }) {
  const toggleSection = (key: (typeof TRAVEL_SECTIONS)[number]['key']) =>
    set('travelSections', { ...state.travelSections, [key]: !state.travelSections[key] })

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>여행지 <span className="req">*</span></label>
          <input
            type="text"
            value={state.place}
            onChange={(e) => set('place', e.target.value)}
            placeholder="예: 일본 다카야마"
          />
        </div>
        <div className="field">
          <label>지역</label>
          <div className="seg">
            {(['국내', '해외'] as Region[]).map((r) => (
              <button key={r} aria-pressed={state.region === r} onClick={() => set('region', r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="field">
        <label>동행 유형 <span className="req">*</span></label>
        <div className="chips">
          {COMPANIONS.map((c) => (
            <button
              key={c}
              className="chip"
              aria-pressed={state.companion === c}
              onClick={() => set('companion', c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>기간 / 시기</label>
          <input
            type="text"
            value={state.period}
            onChange={(e) => set('period', e.target.value)}
            placeholder="예: 3박 4일, 10월"
          />
        </div>
        <div className="field">
          <label>한 줄 테마</label>
          <input
            type="text"
            value={state.theme}
            onChange={(e) => set('theme', e.target.value)}
            placeholder="예: 부모님과 처음 간 해외"
          />
        </div>
      </div>

      <div className="field">
        <label>꼭 넣을 장소 / 에피소드</label>
        <textarea
          value={state.tepisode}
          onChange={(e) => set('tepisode', e.target.value)}
          placeholder="가장 기억에 남은 순간"
        />
      </div>

      {/* 섹션 조합 (레고) */}
      <div className="field" style={{ marginTop: 18 }}>
        <label>넣을 섹션 고르기</label>
        <div className="sections">
          {TRAVEL_SECTIONS.map((s) => {
            const active = state.travelSections[s.key]
            const count = s.countKey ? state[s.countKey] : undefined
            return (
              <div key={s.key} className={'sec-row' + (active ? ' on' : '')}>
                <button
                  className="sec-toggle"
                  aria-pressed={active}
                  onClick={() => toggleSection(s.key)}
                >
                  <span className="sec-check">{active ? '✓' : ''}</span>
                  {s.label}
                </button>
                {s.countKey && active && (
                  <span className="stepper">
                    <button
                      onClick={() => set(s.countKey!, Math.max(1, (count ?? 1) - 1))}
                      aria-label="줄이기"
                    >
                      −
                    </button>
                    <span className="stepper-n">{count}</span>
                    <button
                      onClick={() => set(s.countKey!, Math.min(6, (count ?? 1) + 1))}
                      aria-label="늘리기"
                    >
                      +
                    </button>
                  </span>
                )}
                {s.key === 'schedule' && active && (
                  <span className="mini-seg">
                    <button
                      aria-pressed={state.scheduleStyle === 'table'}
                      onClick={() => set('scheduleStyle', 'table')}
                    >
                      표
                    </button>
                    <button
                      aria-pressed={state.scheduleStyle === 'timeline'}
                      onClick={() => set('scheduleStyle', 'timeline')}
                    >
                      타임라인
                    </button>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
