import {
  FOOD_MAX, type FoodContent as FC, type State,
} from '../types'
import ImageGallery from '../components/ImageGallery'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

const RATING_OPTS = ['', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1']

export default function FoodContentEditor({ state, set }: { state: State; set: Setter }) {
  const C = state.foodContent
  const setC = (patch: Partial<FC>) => set('foodContent', { ...C, ...patch })

  return (
    <div className="content-form">
      <p className="content-hint">
        칸을 채우고 사진을 올리면 오른쪽 <strong>미리보기</strong>에 바로 반영돼요.
        완성되면 <strong>HTML 복사</strong>로 티스토리에 붙여넣으세요.
      </p>

      <Group title="제목">
        <Field label="글 제목">
          <input
            type="text"
            value={C.title}
            placeholder="비우면 가게 이름을 제목으로 씁니다"
            onChange={(e) => setC({ title: e.target.value })}
          />
        </Field>
        <Field label="한 줄 소개">
          <input
            type="text"
            value={C.subtitle}
            placeholder="이 글에서 무엇을 남기고 싶은지"
            onChange={(e) => setC({ subtitle: e.target.value })}
          />
        </Field>
      </Group>

      <Group title="외관 (사진 1장)">
        <Field label="사진">
          <ImageGallery
            value={C.exteriorImages}
            onChange={(v) => setC({ exteriorImages: v })}
            max={FOOD_MAX.exterior}
            multiple={false}
          />
        </Field>
        <Field label="외관 후기">
          <textarea
            value={C.exteriorBody}
            placeholder="위치·찾기·간판·첫인상 (2~4문장)"
            onChange={(e) => setC({ exteriorBody: e.target.value })}
          />
        </Field>
      </Group>

      <Group title="내부 (사진 1~3장)">
        <Field label="사진">
          <ImageGallery
            value={C.interiorImages}
            onChange={(v) => setC({ interiorImages: v })}
            max={FOOD_MAX.interior}
          />
        </Field>
        <Field label="내부 후기">
          <textarea
            value={C.interiorBody}
            placeholder="분위기·좌석·청결·서비스 (2~4문장)"
            onChange={(e) => setC({ interiorBody: e.target.value })}
          />
        </Field>
      </Group>

      <Group title="음식 (사진 1~10장)">
        <Field label="사진">
          <ImageGallery
            value={C.dishesImages}
            onChange={(v) => setC({ dishesImages: v })}
            max={FOOD_MAX.dishes}
          />
        </Field>
        <Field label="음식 후기">
          <textarea
            value={C.dishesBody}
            placeholder="맛·양·플레이팅·가격 대비 (문단으로)"
            onChange={(e) => setC({ dishesBody: e.target.value })}
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
              placeholder="예: 다시 갈 이유가 분명한 가게"
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
