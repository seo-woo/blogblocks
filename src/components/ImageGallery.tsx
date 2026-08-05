import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { clampPos, type TravelImage } from '../types'
import { fileToDataUrl } from '../lib/image'

type Props = {
  value: TravelImage[]
  onChange: (v: TravelImage[]) => void
  max?: number
  multiple?: boolean
}

export default function ImageGallery({ value, onChange, max = 6, multiple = true }: Props) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const list = value || []
  const room = Math.max(0, max - list.length)

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

  const allowMultiple = multiple && max > 1

  return (
    <div className="img-gallery">
      {list.length > 0 && (
        <div className="img-thumbs">
          {list.map((im, i) => (
            <div className="img-thumb" key={`${im.src.slice(-24)}-${im.src.length}-${i}`}>
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
              : allowMultiple
                ? `📷 이미지 업로드 (최대 ${max}장)`
                : '📷 이미지 업로드'}
          <input
            type="file"
            accept="image/*"
            multiple={allowMultiple}
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
