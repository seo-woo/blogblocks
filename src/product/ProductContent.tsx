import { useCallback, useMemo } from 'react'
import {
  PRODUCT_MAX, type ProductContent as PC, type State,
} from '../types'
import ImageGallery from '../components/ImageGallery'
import AutoWriteBar from '../components/AutoWriteBar'
import { buildProductFillPrompt, parseProductContentResponse } from './productContentAi'
import { hasProductContent } from './productTheme'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

const RATING_OPTS = ['', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1']

export default function ProductContentEditor({ state, set }: { state: State; set: Setter }) {
  const C = state.productContent
  const setC = (patch: Partial<PC>) => set('productContent', { ...C, ...patch })
  const fillPrompt = useMemo(() => buildProductFillPrompt(state), [state])
  const blockedReason = state.productName.trim() ? undefined : '구성 탭에서 제품명을 먼저 적어 주세요.'
  const hasExisting = hasProductContent(state)

  const parseAndApply = useCallback((text: string) => {
    const parsed = parseProductContentResponse(text, C)
    if (!parsed) return false
    set('productContent', parsed)
    return true
  }, [C, set])

  return (
    <div className="content-form">
      <p className="content-hint">
        칸을 채우고 사진을 올리면 오른쪽 <strong>미리보기</strong>에 바로 반영돼요.
        완성되면 <strong>HTML 복사</strong>로 티스토리에 붙여넣으세요.
      </p>
      <AutoWriteBar
        blockedReason={blockedReason}
        hasExisting={hasExisting}
        prompt={fillPrompt}
        parseAndApply={parseAndApply}
      />

      <Group title="제목">
        <Field label="글 제목">
          <input
            type="text"
            value={C.title}
            placeholder="비우면 제품명을 제목으로 씁니다"
            onChange={(e) => setC({ title: e.target.value })}
          />
        </Field>
        <Field label="한 줄 소개">
          <input
            type="text"
            value={C.subtitle}
            placeholder="이 글에서 남기고 싶은 한 줄"
            onChange={(e) => setC({ subtitle: e.target.value })}
          />
        </Field>
      </Group>

      <Group title="언박싱 · 구성 (사진 1~3장)">
        <Field label="사진">
          <ImageGallery
            value={C.unboxImages}
            onChange={(v) => setC({ unboxImages: v })}
            max={PRODUCT_MAX.unbox}
          />
        </Field>
        <Field label="언박싱 후기">
          <textarea
            value={C.unboxBody}
            placeholder="패키징·구성품·첫인상 (2~4문장)"
            onChange={(e) => setC({ unboxBody: e.target.value })}
          />
        </Field>
      </Group>

      <Group title="디자인 · 디테일 (사진 1~5장)">
        <Field label="사진">
          <ImageGallery
            value={C.designImages}
            onChange={(v) => setC({ designImages: v })}
            max={PRODUCT_MAX.design}
          />
        </Field>
        <Field label="디자인 후기">
          <textarea
            value={C.designBody}
            placeholder="외관·마감·휴대성·스펙 느낌 (2~4문장)"
            onChange={(e) => setC({ designBody: e.target.value })}
          />
        </Field>
      </Group>

      <Group title="사용기 (사진 1~10장)">
        <Field label="사진">
          <ImageGallery
            value={C.usageImages}
            onChange={(v) => setC({ usageImages: v })}
            max={PRODUCT_MAX.usage}
          />
        </Field>
        <Field label="사용 후기">
          <textarea
            value={C.usageBody}
            placeholder="실제 사용감·장점·아쉬운 점 (문단으로)"
            onChange={(e) => setC({ usageBody: e.target.value })}
          />
        </Field>
      </Group>

      <Group title="장점 · 단점">
        <Field label="장점">
          <textarea
            value={C.pros}
            placeholder="장점 2~3줄"
            onChange={(e) => setC({ pros: e.target.value })}
          />
        </Field>
        <Field label="단점">
          <textarea
            value={C.cons}
            placeholder="단점 1~2줄"
            onChange={(e) => setC({ cons: e.target.value })}
          />
        </Field>
      </Group>

      <Group title="총점 & 총평">
        <div className="grid2">
          <Field label="총점">
            <select value={C.score} onChange={(e) => setC({ score: e.target.value })}>
              {RATING_OPTS.map((r) => (
                <option key={r || 'empty'} value={r}>{r === '' ? '선택' : r}</option>
              ))}
            </select>
          </Field>
          <Field label="한 줄 총평">
            <input
              type="text"
              value={C.reviewOne}
              placeholder="예: 사길 잘했다는 생각이 드는 제품"
              onChange={(e) => setC({ reviewOne: e.target.value })}
            />
          </Field>
        </div>
        <Field label="총평 본문">
          <textarea
            value={C.reviewBody}
            placeholder="2~4문장 총평"
            onChange={(e) => setC({ reviewBody: e.target.value })}
          />
        </Field>
      </Group>
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
