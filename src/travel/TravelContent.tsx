import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  clampPos, emptyPoi, emptyStop, MAX_IMAGES,
  type Poi, type State, type TravelContent as TC, type TravelImage,
} from '../types'
import { fileToDataUrl } from '../lib/image'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void
type PoiKey = 'spots' | 'restaurants' | 'cafes'

const RATING_OPTS = ['', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1']

export default function TravelContent({ state, set }: { state: State; set: Setter }) {
  const C = state.travelContent
  const setC = (patch: Partial<TC>) => set('travelContent', { ...C, ...patch })
  const on = (k: keyof State['travelSections']) => state.travelSections[k]

  return (
    <div className="content-form">
      <p className="content-hint">
        칸을 채우고 사진을 올리면 오른쪽 <strong>미리보기</strong>에 바로 반영돼요.
        비운 칸은 <code>[ ]</code> 자리표시자로 남습니다. 완성되면 <strong>HTML 복사</strong>로 티스토리에 붙여넣으세요.
      </p>

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
            <ImageInput value={C.heroImages} onChange={(v) => setC({ heroImages: v })} />
          </Field>
        </Group>
      )}

      {on('schedule') && (
        <Group title="일정">
          {C.stops.map((s, i) => (
            <div className="repeat-item" key={i}>
              <div className="repeat-head">
                <span>정거장 {i + 1}</span>
                <button className="rm" onClick={() => setC({ stops: C.stops.filter((_, x) => x !== i) })}>삭제</button>
              </div>
              <div className="grid3">
                <input type="text" value={s.emoji} placeholder="이모지" maxLength={2}
                  onChange={(e) => updateStop(C, setC, i, { emoji: e.target.value })} />
                <input type="text" value={s.time} placeholder="시간 (09:30)"
                  onChange={(e) => updateStop(C, setC, i, { time: e.target.value })} />
                <input type="text" value={s.place} placeholder="장소"
                  onChange={(e) => updateStop(C, setC, i, { place: e.target.value })} />
              </div>
              <input type="text" value={s.memo} placeholder="메모 (선택)"
                onChange={(e) => updateStop(C, setC, i, { memo: e.target.value })} />
            </div>
          ))}
          <button className="add" onClick={() => setC({ stops: [...C.stops, { ...emptyStop }] })}>＋ 정거장 추가</button>
        </Group>
      )}

      {on('spots') && <PoiGroup title="다녀온 곳" pkey="spots" count={state.spotCount} C={C} setC={setC} />}
      {on('restaurants') && <PoiGroup title="다녀온 음식점" pkey="restaurants" count={state.restCount} C={C} setC={setC} feature="대표메뉴" />}
      {on('cafes') && <PoiGroup title="다녀온 카페" pkey="cafes" count={state.cafeCount} C={C} setC={setC} feature="시그니처" />}

      {on('cost') && (
        <Group title="비용">
          {C.costRows.map((r, i) => (
            <div className="repeat-item" key={i}>
              <div className="repeat-head">
                <span>항목 {i + 1}</span>
                <button className="rm" onClick={() => setC({ costRows: C.costRows.filter((_, x) => x !== i) })}>삭제</button>
              </div>
              <div className="grid3">
                <input type="text" value={r.item} placeholder="항목 (교통)"
                  onChange={(e) => updateCost(C, setC, i, { item: e.target.value })} />
                <input type="text" value={r.amount} placeholder="금액 (10만원)"
                  onChange={(e) => updateCost(C, setC, i, { amount: e.target.value })} />
                <input type="text" value={r.memo} placeholder="메모 (선택)"
                  onChange={(e) => updateCost(C, setC, i, { memo: e.target.value })} />
              </div>
            </div>
          ))}
          <button className="add" onClick={() => setC({ costRows: [...C.costRows, { item: '', amount: '', memo: '' }] })}>＋ 항목 추가</button>
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
            <div className="line-item" key={i}>
              <input type="text" value={t} placeholder={`꿀팁 ${i + 1}`}
                onChange={(e) => setC({ tips: C.tips.map((x, xi) => xi === i ? e.target.value : x) })} />
              <button className="rm" onClick={() => setC({ tips: C.tips.filter((_, x) => x !== i) })}>삭제</button>
            </div>
          ))}
          <button className="add" onClick={() => setC({ tips: [...C.tips, ''] })}>＋ 꿀팁 추가</button>
        </Group>
      )}

      {on('faq') && (
        <Group title="FAQ">
          {C.faq.map((f, i) => (
            <div className="repeat-item" key={i}>
              <div className="repeat-head">
                <span>질문 {i + 1}</span>
                <button className="rm" onClick={() => setC({ faq: C.faq.filter((_, x) => x !== i) })}>삭제</button>
              </div>
              <input type="text" value={f.q} placeholder="질문"
                onChange={(e) => setC({ faq: C.faq.map((x, xi) => xi === i ? { ...x, q: e.target.value } : x) })} />
              <textarea value={f.a} placeholder="답변"
                onChange={(e) => setC({ faq: C.faq.map((x, xi) => xi === i ? { ...x, a: e.target.value } : x) })} />
            </div>
          ))}
          <button className="add" onClick={() => setC({ faq: [...C.faq, { q: '', a: '' }] })}>＋ 질문 추가</button>
        </Group>
      )}

      {on('verdict') && (
        <Group title="총평">
          <div className="grid2">
            <Field label="별점">
              <select value={C.verdictScore} onChange={(e) => setC({ verdictScore: e.target.value })}>
                {RATING_OPTS.map((r) => <option key={r} value={r}>{r === '' ? '선택' : r}</option>)}
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

function updateStop(C: TC, setC: (p: Partial<TC>) => void, i: number, patch: Partial<TC['stops'][number]>) {
  setC({ stops: C.stops.map((x, xi) => (xi === i ? { ...x, ...patch } : x)) })
}
function updateCost(C: TC, setC: (p: Partial<TC>) => void, i: number, patch: Partial<TC['costRows'][number]>) {
  setC({ costRows: C.costRows.map((x, xi) => (xi === i ? { ...x, ...patch } : x)) })
}

function PoiGroup({ title, pkey, count, C, setC, feature }: {
  title: string; pkey: PoiKey; count: number; C: TC
  setC: (p: Partial<TC>) => void; feature?: string
}) {
  const list = C[pkey]
  const setPoi = (i: number, patch: Partial<Poi>) => {
    const arr = list.slice()
    arr[i] = { ...emptyPoi, ...(arr[i] || {}), ...patch }
    setC({ [pkey]: arr } as Partial<TC>)
  }
  const rows = []
  for (let i = 0; i < Math.max(1, count); i++) {
    const it = list[i] || emptyPoi
    rows.push(
      <div className="repeat-item" key={i}>
        <div className="repeat-head"><span>{title.replace('다녀온 ', '')} {i + 1}</span></div>
        <div className="grid2">
          <input type="text" value={it.name} placeholder="이름"
            onChange={(e) => setPoi(i, { name: e.target.value })} />
          <select value={it.rating} onChange={(e) => setPoi(i, { rating: e.target.value })}>
            {RATING_OPTS.map((r) => <option key={r} value={r}>{r === '' ? '별점' : `★ ${r}`}</option>)}
          </select>
        </div>
        {feature && (
          <input type="text" value={it.feature} placeholder={feature}
            onChange={(e) => setPoi(i, { feature: e.target.value })} />
        )}
        <textarea value={it.review} placeholder="솔직 후기·분위기·팁"
          onChange={(e) => setPoi(i, { review: e.target.value })} />
        <div className="grid3">
          <input type="text" value={it.loc} placeholder="위치"
            onChange={(e) => setPoi(i, { loc: e.target.value })} />
          <input type="text" value={it.price} placeholder={feature ? '가격대' : '입장료'}
            onChange={(e) => setPoi(i, { price: e.target.value })} />
          <input type="text" value={it.dur} placeholder={feature ? '영업시간' : '소요시간'}
            onChange={(e) => setPoi(i, { dur: e.target.value })} />
        </div>
        <ImageInput value={it.images} onChange={(v) => setPoi(i, { images: v })} />
      </div>,
    )
  }
  return (
    <Group title={title}>
      <p className="content-hint sm">개수는 ‘구성’ 탭에서 조절해요 (현재 {count}개).</p>
      {rows}
    </Group>
  )
}

function ImageInput({ value, onChange }: {
  value: TravelImage[]
  onChange: (v: TravelImage[]) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const list = value || []
  const room = Math.max(0, MAX_IMAGES - list.length)

  async function handleFiles(files: FileList | null) {
    if (!files?.length || room <= 0) return
    setBusy(true)
    setErr('')
    try {
      const picked = Array.from(files).slice(0, room)
      const next: TravelImage[] = []
      for (const f of picked) {
        next.push({ src: await fileToDataUrl(f), x: 50, y: 50 })
      }
      onChange([...list, ...next])
    } catch {
      setErr('이미지를 처리하지 못했어요. 다른 파일로 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  function patchAt(i: number, patch: Partial<TravelImage>) {
    onChange(list.map((im, xi) => (xi === i ? { ...im, ...patch } : im)))
  }

  function removeAt(i: number) {
    onChange(list.filter((_, x) => x !== i))
  }

  return (
    <div className="img-gallery">
      {list.length > 0 && (
        <div className="img-thumbs">
          {list.map((im, i) => (
            <div className="img-thumb" key={`${im.src.slice(-24)}-${im.src.length}`}>
              <ImageReposition
                image={im}
                onPos={(x, y) => patchAt(i, { x, y })}
              />
              <button type="button" className="rm" onClick={() => removeAt(i)}>삭제</button>
            </div>
          ))}
        </div>
      )}
      {room > 0 && (
        <label className="upload">
          {busy
            ? '처리 중…'
            : list.length
              ? `📷 사진 추가 (남은 ${room}장)`
              : '📷 이미지 업로드 (여러 장)'}
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={busy}
            onChange={async (e) => {
              await handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      )}
      {list.length > 0 && (
        <p className="content-hint sm">
          사진은 4:3으로 잘려요. 프레임을 <strong>드래그</strong>해서 보이는 위치를 조정하세요.
          {list.length > 1 ? ' 여러 장이면 슬라이드로 보여요.' : ''}
        </p>
      )}
      {err && <p className="content-hint sm" style={{ color: '#c0392b' }}>{err}</p>}
    </div>
  )
}

function ImageReposition({
  image,
  onPos,
}: {
  image: TravelImage
  onPos: (x: number, y: number) => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault()
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: image.x,
      originY: image.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current
    const el = frameRef.current
    if (!d || d.pointerId !== e.pointerId || !el) return
    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    // 손가락을 오른쪽으로 밀면 사진도 오른쪽으로 → 초점(x)은 왼쪽(감소)
    const dx = ((e.clientX - d.startX) / rect.width) * 100
    const dy = ((e.clientY - d.startY) / rect.height) * 100
    onPos(clampPos(d.originX - dx), clampPos(d.originY - dy))
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === e.pointerId) drag.current = null
  }

  return (
    <div
      ref={frameRef}
      className="img-frame"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="img"
      aria-label="드래그해서 사진 위치 조정"
      title="드래그해서 위치 조정"
    >
      <img
        src={image.src}
        alt=""
        draggable={false}
        style={{ objectPosition: `${image.x}% ${image.y}%` }}
      />
      <span className="img-frame-hint">드래그로 위치 조정</span>
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
