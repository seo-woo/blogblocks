import {
  emptyImage,
  emptySection,
  slotLabel,
  type SeoContent,
  type SeoImage,
  type SeoSection,
  type State,
} from '../types'
import { tableToText, textToTable } from './tableText'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

function LineList({
  items, label, placeholder, addLabel, onChange,
}: {
  items: string[]
  label: string
  placeholder: string
  addLabel: string
  onChange: (next: string[]) => void
}) {
  return (
    <div className="field">
      {label ? <label>{label}</label> : null}
      {items.map((v, i) => (
        <div className="line-item" key={i}>
          <input
            type="text"
            value={v}
            placeholder={placeholder}
            onChange={(e) => {
              const next = items.slice()
              next[i] = e.target.value
              onChange(next)
            }}
          />
          <button
            type="button"
            className="rm"
            aria-label="삭제"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="add" onClick={() => onChange([...items, ''])}>
        + {addLabel}
      </button>
    </div>
  )
}

export default function SeoContentEditor({ state, set }: { state: State; set: Setter }) {
  const c = state.content

  function patch(p: Partial<SeoContent>) {
    set('content', { ...c, ...p })
  }

  function patchSection(i: number, p: Partial<SeoSection>) {
    patch({ sections: c.sections.map((s, j) => (j === i ? { ...s, ...p } : s)) })
  }

  function patchImage(i: number, p: Partial<SeoImage>) {
    patch({ images: c.images.map((im, j) => (j === i ? { ...im, ...p } : im)) })
  }

  const slotOptions: Array<{ v: string; t: string }> = [
    { v: 'top', t: '글 맨 위 (대표)' },
    { v: 'intro', t: '도입부 아래' },
    { v: 'answer', t: '핵심 답변 아래' },
    ...c.sections.map((s, i) => ({
      v: `section${i + 1}`,
      t: `${i + 1}. ${s.heading.trim() || '소제목 없음'} 아래`,
    })),
    { v: 'faq', t: 'FAQ 위' },
    { v: 'end', t: '마무리 위' },
  ]

  return (
    <div>
      {/* ── 제목 ── */}
      <div className="content-group">
        <h4>제목 · 메타</h4>
        <div className="field">
          <label>제목</label>
          <input
            type="text"
            value={c.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="궁금증을 자극하면서 핵심 검색어가 들어간 제목"
          />
        </div>
        {c.plan.titles.length > 0 && (
          <div className="field">
            <label>제목 후보 — 눌러서 적용</label>
            <div className="pick-list">
              {c.plan.titles.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  className="pick"
                  aria-pressed={c.title.trim() === t.trim()}
                  onClick={() => patch({ title: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="field">
          <label>메타 설명</label>
          <textarea
            value={c.plan.meta}
            onChange={(e) => patch({ plan: { ...c.plan, meta: e.target.value } })}
            placeholder="검색 결과에 뜰 한두 문장"
          />
        </div>
        <LineList
          items={c.plan.tags}
          label="추천 태그 (유입용)"
          placeholder="예: 리튬이온전지"
          addLabel="태그 추가"
          onChange={(tags) => patch({ plan: { ...c.plan, tags } })}
        />
        <p className="content-hint sm">
          플랫폼 태그칸에 넣을 검색어. 공백 없이 짧게, 5~10개 정도가 적당해요.
        </p>
      </div>

      {/* ── 도입 · 핵심 답변 ── */}
      <div className="content-group">
        <h4>도입부</h4>
        <div className="field">
          <textarea
            className="tall"
            value={c.intro}
            onChange={(e) => patch({ intro: e.target.value })}
            placeholder={'줄바꿈 = 문단 하나.\n장면·반전·도발 질문으로 훅을 걸고, 2~3문단으로 짧게.'}
          />
        </div>
      </div>

      <div className="content-group">
        <h4>핵심 답변 — 가장 궁금한 걸 앞에서</h4>
        <div className="field">
          <label>소제목</label>
          <input
            type="text"
            value={c.answerHeading}
            onChange={(e) => patch({ answerHeading: e.target.value })}
            placeholder="예: 가장 빠른 방법부터"
          />
        </div>
        <div className="field">
          <textarea
            className="tall"
            value={c.answerBody}
            onChange={(e) => patch({ answerBody: e.target.value })}
            placeholder="결론을 먼저. 줄바꿈 = 문단 하나."
          />
        </div>
      </div>

      {/* ── 본문 섹션 ── */}
      <div className="content-group">
        <h4>본문 ({c.sections.length})</h4>
        {c.sections.map((s, i) => (
          <div className="repeat-item" key={i}>
            <div className="repeat-head">
              <span>섹션 {i + 1}</span>
              <div className="repeat-head-actions">
                <button
                  type="button"
                  className="rm"
                  aria-label="위로"
                  disabled={i === 0}
                  onClick={() => {
                    const next = c.sections.slice()
                    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                    patch({ sections: next })
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rm"
                  aria-label="아래로"
                  disabled={i === c.sections.length - 1}
                  onClick={() => {
                    const next = c.sections.slice()
                    ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                    patch({ sections: next })
                  }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rm"
                  aria-label="삭제"
                  onClick={() => patch({ sections: c.sections.filter((_, j) => j !== i) })}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="field">
              <label>소제목 (H2)</label>
              <input
                type="text"
                value={s.heading}
                onChange={(e) => patchSection(i, { heading: e.target.value })}
                placeholder="예: 설정에서 바로 바꾸는 법"
              />
            </div>
            <div className="field">
              <textarea
                value={s.body}
                onChange={(e) => patchSection(i, { body: e.target.value })}
                placeholder="줄바꿈 = 문단 하나"
              />
            </div>
            <div className="field">
              <label>목록</label>
              <div className="mini-seg">
                <button
                  type="button"
                  aria-pressed={s.listType === 'none'}
                  onClick={() => patchSection(i, { listType: 'none' })}
                >
                  없음
                </button>
                <button
                  type="button"
                  aria-pressed={s.listType === 'ol'}
                  onClick={() => patchSection(i, { listType: 'ol' })}
                >
                  1. 단계
                </button>
                <button
                  type="button"
                  aria-pressed={s.listType === 'ul'}
                  onClick={() => patchSection(i, { listType: 'ul' })}
                >
                  · 나열
                </button>
              </div>
            </div>
            {s.listType !== 'none' && (
              <LineList
                items={s.list}
                label=""
                placeholder="한 줄에 하나"
                addLabel="항목 추가"
                onChange={(list) => patchSection(i, { list })}
              />
            )}
            <div className="field">
              <label>표 — 첫 줄이 머리글, 칸은 <code>|</code>로 구분</label>
              <textarea
                className="mono"
                value={tableToText(s.table)}
                onChange={(e) => patchSection(i, { table: textToTable(e.target.value) })}
                placeholder={'항목 | 내용\n방법 1 | 설명'}
              />
            </div>
            <div className="field">
              <label>주의할 점 (인용 박스)</label>
              <textarea
                value={s.note}
                onChange={(e) => patchSection(i, { note: e.target.value })}
                placeholder="비워 두면 표시되지 않습니다"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add"
          onClick={() => patch({ sections: [...c.sections, { ...emptySection }] })}
        >
          + 섹션 추가
        </button>
      </div>

      {/* ── FAQ ── */}
      <div className="content-group">
        <h4>자주 묻는 질문 ({c.faq.length})</h4>
        {c.faq.map((f, i) => (
          <div className="repeat-item" key={i}>
            <div className="repeat-head">
              <span>Q{i + 1}</span>
              <button
                type="button"
                className="rm"
                aria-label="삭제"
                onClick={() => patch({ faq: c.faq.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            </div>
            <div className="field">
              <input
                type="text"
                value={f.q}
                onChange={(e) => patch({
                  faq: c.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)),
                })}
                placeholder="추가로 검색할 만한 질문"
              />
            </div>
            <div className="field">
              <textarea
                value={f.a}
                onChange={(e) => patch({
                  faq: c.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)),
                })}
                placeholder="본문을 반복하지 않는 답"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add"
          onClick={() => patch({ faq: [...c.faq, { q: '', a: '' }] })}
        >
          + 질문 추가
        </button>
      </div>

      {/* ── 마무리 ── */}
      <div className="content-group">
        <h4>마무리</h4>
        <div className="field">
          <textarea
            value={c.closing}
            onChange={(e) => patch({ closing: e.target.value })}
            placeholder="핵심만 짧게. 인사말·소감은 넣지 마세요."
          />
        </div>
      </div>

      {/* ── 참고자료 ── */}
      <div className="content-group">
        <h4>참고자료 ({c.references.length})</h4>
        <LineList
          items={c.references}
          label=""
          placeholder="예: Nature, How snakes lost their legs — https://www.nature.com/..."
          addLabel="참고 추가"
          onChange={(references) => patch({ references })}
        />
        <p className="content-hint sm">
          형식: 매체, 제목 — https://… (URL까지 넣으면 본문에 링크로 표시됩니다)
        </p>
      </div>

      {/* ── 이미지 기획 ── */}
      <div className="content-group">
        <h4>이미지 기획 ({c.images.length})</h4>
        {c.images.map((im, i) => (
          <div className="repeat-item" key={i}>
            <div className="repeat-head">
              <span>이미지 {i + 1} · {slotLabel(im.slot, c.sections)}</span>
              <button
                type="button"
                className="rm"
                aria-label="삭제"
                onClick={() => patch({ images: c.images.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            </div>
            <div className="grid2">
              <div className="field">
                <label>역할</label>
                <div className="mini-seg">
                  <button
                    type="button"
                    aria-pressed={im.role === 'cover'}
                    onClick={() => patchImage(i, { role: 'cover' })}
                  >
                    대표
                  </button>
                  <button
                    type="button"
                    aria-pressed={im.role === 'body'}
                    onClick={() => patchImage(i, { role: 'body' })}
                  >
                    본문
                  </button>
                </div>
              </div>
              <div className="field">
                <label>삽입 위치</label>
                <select
                  value={im.slot}
                  onChange={(e) => patchImage(i, { slot: e.target.value })}
                >
                  {slotOptions.map((o) => (
                    <option key={o.v} value={o.v}>{o.t}</option>
                  ))}
                  {!slotOptions.some((o) => o.v === im.slot) && (
                    <option value={im.slot}>{im.slot} (위치 없음)</option>
                  )}
                </select>
              </div>
            </div>
            <div className="field">
              <label>목적</label>
              <input
                type="text"
                value={im.purpose}
                onChange={(e) => patchImage(i, { purpose: e.target.value })}
                placeholder="이 이미지가 이해를 어떻게 돕는지"
              />
            </div>
            <div className="field">
              <label>이미지 생성 프롬프트</label>
              <textarea
                value={im.prompt}
                onChange={(e) => patchImage(i, { prompt: e.target.value })}
                placeholder="영어 장면 묘사 (실사 화풍은 자동으로 붙습니다)"
              />
            </div>
            <div className="field">
              <label>ALT 텍스트</label>
              <input
                type="text"
                value={im.alt}
                onChange={(e) => patchImage(i, { alt: e.target.value })}
                placeholder="화면을 설명하는 자연스러운 문장"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add"
          onClick={() => patch({
            images: [...c.images, {
              ...emptyImage,
              role: c.images.length ? 'body' : 'cover',
              slot: c.images.length ? 'section1' : 'top',
            }],
          })}
        >
          + 이미지 추가
        </button>
      </div>

      {/* ── 확인 · 관련 글 ── */}
      <div className="content-group">
        <h4>발행 전 확인할 것</h4>
        <LineList
          items={c.checks}
          label=""
          placeholder="예: 설정 메뉴 이름이 지금도 같은지"
          addLabel="확인 항목 추가"
          onChange={(checks) => patch({ checks })}
        />
      </div>

      <div className="content-group">
        <h4>이어서 쓸 관련 글</h4>
        <LineList
          items={c.related}
          label=""
          placeholder="예: 잠을 자는 동안 뇌에서는 무슨 일이 일어날까?"
          addLabel="관련 글 추가"
          onChange={(related) => patch({ related })}
        />
      </div>
    </div>
  )
}
