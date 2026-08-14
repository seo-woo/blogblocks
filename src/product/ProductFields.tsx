import { PRODUCT_ACCENTS, type State } from '../types'

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

export default function ProductFields({ state, set }: { state: State; set: Setter }) {
  return (
    <div>
      <div className="field">
        <label>제품명 <span className="req">*</span></label>
        <input
          type="text"
          value={state.productName}
          onChange={(e) => set('productName', e.target.value)}
          placeholder="예: ○○ 무선 이어폰 Pro"
        />
      </div>

      <div className="row">
        <div className="field">
          <label>브랜드</label>
          <input
            type="text"
            value={state.productBrand}
            onChange={(e) => set('productBrand', e.target.value)}
            placeholder="예: Sony"
          />
        </div>
        <div className="field">
          <label>카테고리</label>
          <input
            type="text"
            value={state.productCategory}
            onChange={(e) => set('productCategory', e.target.value)}
            placeholder="예: 이어폰 · 가전"
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>구매처</label>
          <input
            type="text"
            value={state.productChannel}
            onChange={(e) => set('productChannel', e.target.value)}
            placeholder="예: 공식몰 · 쿠팡"
          />
        </div>
        <div className="field">
          <label>가격</label>
          <input
            type="text"
            value={state.productPrice}
            onChange={(e) => set('productPrice', e.target.value)}
            placeholder="예: 약 18만원"
          />
        </div>
      </div>

      <div className="field">
        <label>테마 색</label>
        <div className="color-swatches">
          {PRODUCT_ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="color-swatch"
              aria-pressed={state.productAccent === a.id}
              aria-label={a.label}
              title={a.label}
              style={{ background: a.color }}
              onClick={() => set('productAccent', a.id)}
            />
          ))}
        </div>
      </div>

      <p className="content-hint sm" style={{ marginTop: 8 }}>
        글 구성은 고정이에요 — <strong>언박싱 · 디자인 · 사용기 · 장단점 · 총점/총평</strong>.
        ‘내용 작성’ 탭에서 사진과 후기를 채우면 됩니다.
      </p>

      <div className="field" style={{ marginTop: 14 }}>
        <label>자동 작성용 메모 (선택)</label>
        <textarea
          value={state.productMemo}
          onChange={(e) => set('productMemo', e.target.value)}
          placeholder="실제 사용감, 장단점, 언박싱 여부 등을 짧게. 있으면 초안이 더 정확해져요."
        />
      </div>
    </div>
  )
}
