import {
  FOOD_MAX,
  emptyFoodDish,
  type FoodContent as FC,
  type FoodDish,
  type State,
} from '../types'
import ImageGallery from '../components/ImageGallery'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

const RATING_OPTS = ['', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1']

export default function FoodContentEditor({ state, set }: { state: State; set: Setter }) {
  const C = state.foodContent
  const setC = (patch: Partial<FC>) => set('foodContent', { ...C, ...patch })

  function updateDish(i: number, patch: Partial<FoodDish>) {
    const dishes = (C.dishes || []).map((d, xi) => (xi === i ? { ...d, ...patch } : d))
    setC({ dishes })
  }

  function addDish() {
    if ((C.dishes || []).length >= FOOD_MAX.dishes) return
    setC({ dishes: [...(C.dishes || []), { ...emptyFoodDish, images: [] }] })
  }

  function removeDish(i: number) {
    setC({ dishes: (C.dishes || []).filter((_, xi) => xi !== i) })
  }

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
        {(C.interiorImages?.length || 0) > 1 && (
          <p className="content-hint sm">
            사진이 여러 장이면 미리보기에서 다음 장이 살짝 보이고, 화살표·점이 표시돼요.
          </p>
        )}
      </Group>

      <Group title={`음식 (메뉴별 · 최대 ${FOOD_MAX.dishes}개)`}>
        <p className="content-hint sm">
          메뉴마다 <strong>사진 + 설명</strong>을 한 세트로 추가해요. ＋ 메뉴 추가를 눌러 이어 쓰세요.
        </p>
        {(C.dishes || []).map((dish, i) => (
          <div className="repeat-item" key={`dish-${i}-${dish.images[0]?.src?.slice(-12) || 'empty'}`}>
            <div className="repeat-head">
              <span>메뉴 {i + 1}</span>
              <button type="button" className="rm" onClick={() => removeDish(i)}>삭제</button>
            </div>
            <Field label="메뉴 이름 (선택)">
              <input
                type="text"
                value={dish.name}
                placeholder="예: 수육 정식"
                onChange={(e) => updateDish(i, { name: e.target.value })}
              />
            </Field>
            <Field label={`사진 (최대 ${FOOD_MAX.dishImages}장)`}>
              <ImageGallery
                value={dish.images}
                onChange={(v) => updateDish(i, { images: v })}
                max={FOOD_MAX.dishImages}
                multiple
              />
            </Field>
            <Field label="설명">
              <textarea
                value={dish.body}
                placeholder="맛·양·플레이팅·가격 대비 (2~4문장)"
                onChange={(e) => updateDish(i, { body: e.target.value })}
              />
            </Field>
          </div>
        ))}
        {(C.dishes || []).length < FOOD_MAX.dishes && (
          <button type="button" className="add" onClick={addDish}>
            ＋ 메뉴 추가 (사진 + 설명)
          </button>
        )}
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
