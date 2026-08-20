import { useCallback, useMemo } from 'react'
import {
  emptyVisit, MAX_IMAGES, VISIT_KINDS,
  type State, type TravelContent as TC, type Visit, type VisitKind,
} from '../types'
import ImageGallery from '../components/ImageGallery'
import AutoWriteBar from '../components/AutoWriteBar'
import { buildTravelFillPrompt, parseTravelContentResponse } from './travelContentAi'
import { hasTravelContent } from './travelTheme'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

const RATING_OPTS = ['', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1']

function kindMeta(kind: VisitKind) {
  return VISIT_KINDS.find((k) => k.id === kind) || VISIT_KINDS[0]
}

function featureLabel(kind: VisitKind): string {
  if (kind === 'restaurant') return '대표메뉴'
  if (kind === 'cafe') return '시그니처'
  if (kind === 'spot') return '한줄 포인트 (선택)'
  return '한줄 메모 (선택)'
}

function priceLabel(kind: VisitKind): string {
  return kind === 'spot' ? '입장료' : '가격대'
}

function durLabel(kind: VisitKind): string {
  return kind === 'spot' ? '소요시간' : '영업시간'
}

export default function TravelContent({ state, set }: { state: State; set: Setter }) {
  const C = state.travelContent
  const setC = (patch: Partial<TC>) => set('travelContent', { ...C, ...patch })
  const on = (k: keyof State['travelSections']) => state.travelSections[k]
  const fillPrompt = useMemo(() => buildTravelFillPrompt(state), [state])
  const blockedReason = state.place.trim() ? undefined : '구성 탭에서 여행지를 먼저 적어 주세요.'
  const hasExisting = hasTravelContent(state)

  const parseAndApply = useCallback((text: string) => {
    const parsed = parseTravelContentResponse(text, C)
    if (!parsed) return false
    set('travelContent', parsed)
    return true
  }, [C, set])

  const updateVisit = useCallback((i: number, patch: Partial<Visit>) => {
    setC({
      visits: C.visits.map((x, xi) => {
        if (xi !== i) return x
        const next = { ...x, ...patch }
        if (patch.kind && !patch.emoji) {
          const meta = kindMeta(patch.kind)
          if (!x.emoji || VISIT_KINDS.some((k) => k.emoji === x.emoji)) {
            next.emoji = meta.emoji
          }
        }
        return next
      }),
    })
  }, [C.visits, setC])

  const removeVisit = useCallback((i: number) => {
    setC({ visits: C.visits.filter((_, xi) => xi !== i) })
  }, [C.visits, setC])

  const addVisit = useCallback(() => {
    setC({ visits: [...C.visits, { ...emptyVisit, images: [] }] })
  }, [C.visits, setC])

  const moveVisit = useCallback((i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= C.visits.length) return
    const next = C.visits.slice()
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    setC({ visits: next })
  }, [C.visits, setC])

  return (
    <div className="content-form">
      <p className="content-hint">
        칸을 채우고 사진을 올리면 오른쪽 <strong>미리보기</strong>에 바로 반영돼요.
        코스는 <strong>시간 순</strong>으로 쓰고, 맛집·카페·관광지를 섞어 넣으면 됩니다.
      </p>
      <AutoWriteBar
        blockedReason={blockedReason}
        hasExisting={hasExisting}
        prompt={fillPrompt}
        parseAndApply={parseAndApply}
      />

      {on('hero') && (
        <Group title="히어로">
          <Field label="제목">
            <input type="text" value={C.heroTitle} placeholder="예: 부모님과 처음 간 제주도"
              onChange={(e) => setC({ heroTitle: e.target.value })} />
          </Field>
          <Field label="한 줄 소개">
            <textarea value={C.heroSubtitle} placeholder="이 글에서 무엇을 얻어가는지"
              onChange={(e) => setC({ heroSubtitle: e.target.value })} />
          </Field>
          <Field label="대표 이미지 (여러 장 가능)">
            <ImageGallery value={C.heroImages} onChange={(v) => setC({ heroImages: v })} max={MAX_IMAGES} />
          </Field>
        </Group>
      )}

      {(on('schedule') || on('course')) && (
        <Group title="코스 (일정 순서)">
          <p className="content-hint sm">
            위에서부터 시간 순으로 추가하세요. ‘일정 한눈에 보기’와 ‘코스 후기’가 이 목록을 같이 씁니다.
            종류만 맛집·카페·관광지로 고르면 됩니다.
          </p>
          {C.visits.map((v, i) => (
            <div className="repeat-item" key={`visit-${i}-${v.name || 'empty'}`}>
              <div className="repeat-head">
                <span>{String(i + 1).padStart(2, '0')} · {kindMeta(v.kind).label}</span>
                <div className="draft-row-actions">
                  <button type="button" className="btn" onClick={() => moveVisit(i, -1)} disabled={i === 0}>↑</button>
                  <button type="button" className="btn" onClick={() => moveVisit(i, 1)} disabled={i === C.visits.length - 1}>↓</button>
                  <button type="button" className="rm" onClick={() => removeVisit(i)}>삭제</button>
                </div>
              </div>

              <div className="chips" style={{ marginBottom: 10 }}>
                {VISIT_KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className="chip"
                    aria-pressed={v.kind === k.id}
                    onClick={() => updateVisit(i, { kind: k.id })}
                  >
                    {k.emoji} {k.label}
                  </button>
                ))}
              </div>

              <div className="grid3">
                <input type="text" value={v.emoji} placeholder="이모지" maxLength={4}
                  onChange={(e) => updateVisit(i, { emoji: e.target.value })} />
                <input type="text" value={v.time} placeholder="시간 (09:30)"
                  onChange={(e) => updateVisit(i, { time: e.target.value })} />
                <input type="text" value={v.name} placeholder="장소·가게 이름"
                  onChange={(e) => updateVisit(i, { name: e.target.value })} />
              </div>
              <input type="text" value={v.memo} placeholder="일정 한줄 메모 (예: 여유롭게 하루 시작)"
                onChange={(e) => updateVisit(i, { memo: e.target.value })}
                style={{ marginTop: 8 }} />

              {on('course') && (
                <>
                  <div className="grid2" style={{ marginTop: 10 }}>
                    <select value={v.rating} onChange={(e) => updateVisit(i, { rating: e.target.value })}>
                      {RATING_OPTS.map((r) => (
                        <option key={r || 'empty'} value={r}>{r === '' ? '별점' : `★ ${r}`}</option>
                      ))}
                    </select>
                    <input type="text" value={v.feature} placeholder={featureLabel(v.kind)}
                      onChange={(e) => updateVisit(i, { feature: e.target.value })} />
                  </div>
                  <textarea value={v.review} placeholder="솔직 후기·분위기·팁 (2~4문장)"
                    onChange={(e) => updateVisit(i, { review: e.target.value })}
                    style={{ marginTop: 8 }} />
                  <div className="grid3" style={{ marginTop: 8 }}>
                    <input type="text" value={v.loc} placeholder="위치"
                      onChange={(e) => updateVisit(i, { loc: e.target.value })} />
                    <input type="text" value={v.price} placeholder={priceLabel(v.kind)}
                      onChange={(e) => updateVisit(i, { price: e.target.value })} />
                    <input type="text" value={v.dur} placeholder={durLabel(v.kind)}
                      onChange={(e) => updateVisit(i, { dur: e.target.value })} />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ImageGallery
                      value={v.images}
                      onChange={(imgs) => updateVisit(i, { images: imgs })}
                      max={MAX_IMAGES}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
          <button type="button" className="add" onClick={addVisit}>＋ 코스에 장소 추가</button>
        </Group>
      )}

      {on('cost') && (
        <Group title="비용">
          {C.costRows.map((r, i) => (
            <div className="repeat-item" key={`cost-${i}`}>
              <div className="repeat-head">
                <span>항목 {i + 1}</span>
                <button type="button" className="rm" onClick={() => setC({ costRows: C.costRows.filter((_, x) => x !== i) })}>삭제</button>
              </div>
              <div className="grid3">
                <input type="text" value={r.item} placeholder="항목 (교통)"
                  onChange={(e) => setC({ costRows: C.costRows.map((x, xi) => xi === i ? { ...x, item: e.target.value } : x) })} />
                <input type="text" value={r.amount} placeholder="금액 (10만원)"
                  onChange={(e) => setC({ costRows: C.costRows.map((x, xi) => xi === i ? { ...x, amount: e.target.value } : x) })} />
                <input type="text" value={r.memo} placeholder="메모 (선택)"
                  onChange={(e) => setC({ costRows: C.costRows.map((x, xi) => xi === i ? { ...x, memo: e.target.value } : x) })} />
              </div>
            </div>
          ))}
          <button type="button" className="add" onClick={() => setC({ costRows: [...C.costRows, { item: '', amount: '', memo: '' }] })}>＋ 항목 추가</button>
          <div className="grid2" style={{ marginTop: 10 }}>
            <Field label="합계"><input type="text" value={C.costTotal} placeholder="총액"
              onChange={(e) => setC({ costTotal: e.target.value })} /></Field>
            <Field label="합계 메모"><input type="text" value={C.costTotalMemo} placeholder="1인 기준 등"
              onChange={(e) => setC({ costTotalMemo: e.target.value })} /></Field>
          </div>
        </Group>
      )}

      {on('tips') && (
        <Group title="꿀팁">
          {C.tips.map((t, i) => (
            <div className="line-item" key={`tip-${i}`}>
              <input type="text" value={t} placeholder={`꿀팁 ${i + 1}`}
                onChange={(e) => setC({ tips: C.tips.map((x, xi) => xi === i ? e.target.value : x) })} />
              <button type="button" className="rm" onClick={() => setC({ tips: C.tips.filter((_, x) => x !== i) })}>삭제</button>
            </div>
          ))}
          <button type="button" className="add" onClick={() => setC({ tips: [...C.tips, ''] })}>＋ 꿀팁 추가</button>
        </Group>
      )}

      {on('faq') && (
        <Group title="FAQ">
          {C.faq.map((f, i) => (
            <div className="repeat-item" key={`faq-${i}`}>
              <div className="repeat-head">
                <span>질문 {i + 1}</span>
                <button type="button" className="rm" onClick={() => setC({ faq: C.faq.filter((_, x) => x !== i) })}>삭제</button>
              </div>
              <input type="text" value={f.q} placeholder="질문"
                onChange={(e) => setC({ faq: C.faq.map((x, xi) => xi === i ? { ...x, q: e.target.value } : x) })} />
              <textarea value={f.a} placeholder="답변"
                onChange={(e) => setC({ faq: C.faq.map((x, xi) => xi === i ? { ...x, a: e.target.value } : x) })} />
            </div>
          ))}
          <button type="button" className="add" onClick={() => setC({ faq: [...C.faq, { q: '', a: '' }] })}>＋ 질문 추가</button>
        </Group>
      )}

      {on('verdict') && (
        <Group title="총평">
          <div className="grid2">
            <Field label="별점">
              <select value={C.verdictScore} onChange={(e) => setC({ verdictScore: e.target.value })}>
                {RATING_OPTS.map((r) => <option key={r || 'empty'} value={r}>{r === '' ? '선택' : r}</option>)}
              </select>
            </Field>
            <Field label="한 줄 총평"><input type="text" value={C.verdictOne} placeholder="예: 다시 가고 싶은 여행지"
              onChange={(e) => setC({ verdictOne: e.target.value })} /></Field>
          </div>
          <Field label="전체 총평"><textarea value={C.verdictBody} placeholder="2~3문장"
            onChange={(e) => setC({ verdictBody: e.target.value })} /></Field>
          <Field label="이런 분께 추천"><input type="text" value={C.verdictTarget} placeholder="추천 대상"
            onChange={(e) => setC({ verdictTarget: e.target.value })} /></Field>
        </Group>
      )}

      {on('cta') && (
        <Group title="CTA">
          <Field label="유도 문구"><input type="text" value={C.ctaHeading} placeholder="예: 도움이 되었다면 공감·구독!"
            onChange={(e) => setC({ ctaHeading: e.target.value })} /></Field>
          <Field label="다음 글 예고"><input type="text" value={C.ctaSub} placeholder="다음 글 한 줄 예고"
            onChange={(e) => setC({ ctaSub: e.target.value })} /></Field>
        </Group>
      )}
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="content-group">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}
