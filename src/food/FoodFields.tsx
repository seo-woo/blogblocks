import { FOOD_ACCENTS, type State } from '../types'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

export default function FoodFields({ state, set }: { state: State; set: Setter }) {
  return (
    <div>
      <div className="field">
        <label>가게 이름 <span className="req">*</span></label>
        <input
          type="text"
          value={state.foodName}
          onChange={(e) => set('foodName', e.target.value)}
          placeholder="예: 혜화 골목 한정식"
        />
      </div>

      <div className="row">
        <div className="field">
          <label>위치 / 지역</label>
          <input
            type="text"
            value={state.foodArea}
            onChange={(e) => set('foodArea', e.target.value)}
            placeholder="예: 서울 종로 · 혜화"
          />
        </div>
        <div className="field">
          <label>음식 종류</label>
          <input
            type="text"
            value={state.foodCuisine}
            onChange={(e) => set('foodCuisine', e.target.value)}
            placeholder="예: 한식 · 국밥"
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>방문 시기</label>
          <input
            type="text"
            value={state.foodVisit}
            onChange={(e) => set('foodVisit', e.target.value)}
            placeholder="예: 2026.07 · 저녁"
          />
        </div>
        <div className="field">
          <label>가격대</label>
          <input
            type="text"
            value={state.foodPrice}
            onChange={(e) => set('foodPrice', e.target.value)}
            placeholder="예: 1인 1~2만원"
          />
        </div>
      </div>

      <div className="field">
        <label>테마 색</label>
        <div className="color-swatches">
          {FOOD_ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="color-swatch"
              aria-pressed={state.foodAccent === a.id}
              aria-label={a.label}
              title={a.label}
              style={{ background: a.color }}
              onClick={() => set('foodAccent', a.id)}
            />
          ))}
        </div>
      </div>

      <p className="content-hint sm" style={{ marginTop: 8 }}>
        글 구성은 고정이에요 — <strong>외관 · 내부 · 음식 · 총점/총평</strong>.
        ‘내용 작성’ 탭에서 사진과 후기를 채우면 됩니다.
      </p>
    </div>
  )
}
