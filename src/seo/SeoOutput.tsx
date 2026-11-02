import { memo, useCallback, useMemo, useState } from 'react'
import { hasContent, slotLabel, type SeoImage, type State } from '../types'
import { AiError, completePrompt } from '../lib/ai'
import { HtmlCopyButtons, HtmlCopySizeNote } from '../components/HtmlCopyActions'
import { copyText } from '../lib/clipboard'
import { renderSeoHtml, strayImages, wrapPreviewDoc } from './seoHtml'
import { buildMasterPrompt, buildReinforcePrompt } from './rules'
import { buildImageScenePrompt, parseImageScene } from './seoAi'
import { withImageStyle } from './imageStyle'

type Tab = 'plan' | 'body' | 'images' | 'related' | 'prompt' | 'reinforce'

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'plan', label: '기획' },
  { id: 'body', label: '본문' },
  { id: 'images', label: '이미지' },
  { id: 'related', label: '관련 글' },
  { id: 'prompt', label: '프롬프트' },
  { id: 'reinforce', label: '보강' },
]

const CopyBtn = memo(function CopyBtn({
  text, label = '복사', small = true,
}: { text: string; label?: string; small?: boolean }) {
  const [done, setDone] = useState(false)
  const onClick = useCallback(() => {
    copyText(text, () => {
      setDone(true)
      setTimeout(() => setDone(false), 1600)
    })
  }, [text])
  return (
    <button
      type="button"
      className={'btn' + (small ? ' mini' : '') + (done ? ' copied' : '')}
      onClick={onClick}
    >
      {done ? '복사됨 ✓' : label}
    </button>
  )
})

type Setter = <K extends keyof State>(key: K, value: State[K]) => void

/** 이미지 한 장의 생성 프롬프트 — 화풍 블록은 붙여서 보여 주고, 장면만 다시 쓴다 */
function ImagePromptField({
  state, index, set,
}: { state: State; index: number; set: Setter }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const im = state.content.images[index]
  const full = withImageStyle(im.prompt)

  const rewrite = useCallback(async () => {
    setBusy(true)
    setMsg('')
    try {
      const text = await completePrompt(buildImageScenePrompt(state, index))
      const next = parseImageScene(text)
      if (!next) {
        setMsg('응답을 읽지 못했어요. 한 번 더 눌러 주세요.')
        return
      }
      const images: SeoImage[] = state.content.images.map((x, i) => (
        i === index ? { ...x, prompt: next.prompt, alt: next.alt || x.alt } : x
      ))
      set('content', { ...state.content, images })
    } catch (err) {
      if (err instanceof AiError && err.code === 'NO_KEY') {
        setMsg('왼쪽 ‘API 키’에서 Gemini 키를 먼저 저장해 주세요.')
        return
      }
      setMsg(err instanceof Error ? err.message : '다시 쓰기에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }, [index, set, state])

  return (
    <div className="img-field">
      <div className="img-field-head">
        <span>생성 프롬프트</span>
        <span className="img-field-actions">
          <button type="button" className="btn mini" onClick={rewrite} disabled={busy}>
            {busy ? '다시 쓰는 중…' : '↻ 장면 다시 쓰기'}
          </button>
          <CopyBtn text={full} />
        </span>
      </div>
      {full
        ? <p className="img-prompt-text">{full}</p>
        : <p className="content-hint sm">아직 장면이 없어요. ‘↻ 장면 다시 쓰기’를 누르면 만들어 줍니다.</p>}
      {msg && <p className="content-hint sm">{msg}</p>}
    </div>
  )
}

function PlanRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <div className="plan-row">
      <div className="plan-label">{label}</div>
      <div className="plan-value">{value}</div>
    </div>
  )
}

export default function SeoOutput({ state, set }: { state: State; set: Setter }) {
  const [tab, setTab] = useState<Tab>('body')

  const c = state.content
  const html = useMemo(() => renderSeoHtml(state), [state])
  const doc = useMemo(() => wrapPreviewDoc(html), [html])
  const filled = useMemo(() => hasContent(c), [c])
  const stray = useMemo(() => strayImages(state), [state])
  const masterPrompt = useMemo(() => buildMasterPrompt(state), [state])
  const reinforcePrompt = useMemo(
    () => buildReinforcePrompt(state, filled ? html : ''),
    [state, filled, html],
  )

  return (
    <section className="panel out-wrap">
      <div className="panel-head">
        <div className="seg seg-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="actions">
          {tab === 'body' && <HtmlCopyButtons html={html} />}
          {tab === 'prompt' && <CopyBtn text={masterPrompt} label="복사" small={false} />}
          {tab === 'reinforce' && <CopyBtn text={reinforcePrompt} label="복사" small={false} />}
        </div>
      </div>

      <div className="panel-body">
        {tab === 'plan' && (
          <div>
            {!filled && !c.plan.mainKeyword.trim() ? (
              <div className="empty-state">
                <div className="big">🔬</div>
                <p>
                  왼쪽에 오늘의 궁금증을 넣고 <strong>내용 자동 작성</strong>을 누르면<br />
                  기획·본문·이미지 기획이 한 번에 만들어집니다.
                </p>
              </div>
            ) : (
              <div className="plan">
                <PlanRow label="핵심 검색어" value={c.plan.mainKeyword} />
                {c.plan.subKeywords.length > 0 && (
                  <div className="plan-row">
                    <div className="plan-label">관련 키워드</div>
                    <div className="plan-value">
                      <div className="kw-chips">
                        {c.plan.subKeywords.map((k) => <span className="kw" key={k}>{k}</span>)}
                      </div>
                    </div>
                  </div>
                )}
                {c.plan.tags.length > 0 && (
                  <div className="plan-row">
                    <div className="plan-label">추천 태그</div>
                    <div className="plan-value">
                      <div className="kw-chips">
                        {c.plan.tags.map((k) => <span className="kw tag" key={k}>{k}</span>)}
                      </div>
                      <div className="plan-tag-copy">
                        <CopyBtn text={c.plan.tags.join(', ')} label="태그 복사" />
                      </div>
                      <p className="content-hint sm">
                        티스토리·블로거 태그칸에 붙여넣으면 됩니다. 유입용 검색 태그예요.
                      </p>
                    </div>
                  </div>
                )}
                <PlanRow label="독자가 알고 싶은 것" value={c.plan.intent} />
                <PlanRow label="핵심 독자" value={c.plan.audience} />
                <PlanRow label="차별화 포인트" value={c.plan.edge} />

                {c.plan.titles.length > 0 && (
                  <div className="plan-block">
                    <h4>추천 제목</h4>
                    <ul className="copy-list">
                      {c.plan.titles.map((t, i) => (
                        <li key={i}>
                          <span className={c.title.trim() === t.trim() ? 'chosen' : ''}>{t}</span>
                          <CopyBtn text={t} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.plan.meta.trim() && (
                  <div className="plan-block">
                    <h4>메타 설명</h4>
                    <ul className="copy-list">
                      <li>
                        <span>{c.plan.meta}</span>
                        <CopyBtn text={c.plan.meta} />
                      </li>
                    </ul>
                  </div>
                )}

                {c.checks.length > 0 && (
                  <div className="plan-block warn-block">
                    <h4>발행 전 확인할 것</h4>
                    <ul className="check-list">
                      {c.checks.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                    <p className="preview-note">
                      가격·버전·정책·메뉴 이름은 바뀝니다. 공식 페이지에서 한 번 확인한 뒤 발행하세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'body' && (
          <div>
            {c.title.trim() && (
              <div className="title-bar">
                <div>
                  <span className="title-tag">티스토리 제목 칸</span>
                  <div className="title-text">{c.title}</div>
                </div>
                <CopyBtn text={c.title} />
              </div>
            )}
            <iframe
              title="본문 미리보기"
              className="preview-frame"
              sandbox=""
              srcDoc={doc}
            />
            <HtmlCopySizeNote html={html} />
            {stray.length > 0 && (
              <p className="preview-note warn">
                이미지 {stray.join(', ')}번은 삽입 위치가 본문에 없어 자리표시자가 들어가지 않았어요.
                ‘내용 다듬기 → 이미지 기획’에서 위치를 골라 주세요.
              </p>
            )}
          </div>
        )}

        {tab === 'images' && (
          <div>
            {c.images.length === 0 ? (
              <div className="empty-state">
                <div className="big">🖼️</div>
                <p>이미지 기획이 아직 없습니다.<br />자동 작성을 하거나 왼쪽에서 직접 추가하세요.</p>
              </div>
            ) : (
              <div className="img-plans">
                <p className="preview-note" style={{ marginTop: 0 }}>
                  프롬프트 끝에는 <strong>공통 화풍 블록</strong>(실사 다큐 사진)이 자동으로 붙습니다.
                  그림이 마음에 안 들면 <strong>↻ 장면 다시 쓰기</strong>로 그 장면만 새로 뽑을 수 있어요.
                </p>
                {c.images.map((im, i) => (
                  <div className="img-plan" key={i}>
                    <div className="img-plan-head">
                      <span className="img-no">이미지 {i + 1}</span>
                      <span className="img-role">{im.role === 'cover' ? '대표' : '본문'}</span>
                      <span className="img-where">{slotLabel(im.slot, c.sections)}</span>
                    </div>
                    {im.purpose.trim() && <p className="img-purpose">{im.purpose}</p>}
                    <ImagePromptField state={state} index={i} set={set} />
                    {im.alt.trim() && (
                      <div className="img-field">
                        <div className="img-field-head">
                          <span>ALT</span>
                          <CopyBtn text={im.alt} />
                        </div>
                        <p className="img-alt-text">{im.alt}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'related' && (
          <div>
            {c.related.length === 0 ? (
              <div className="empty-state">
                <div className="big">🔗</div>
                <p>이어서 쓸 글 주제가 아직 없습니다.</p>
              </div>
            ) : (
              <div>
                <p className="preview-note" style={{ marginTop: 0, marginBottom: 12 }}>
                  같은 큰 주제에서 다른 질문으로 뻗어 나간 목록입니다. 하나씩 발행하면 글끼리 연결됩니다.
                </p>
                <ul className="copy-list">
                  {c.related.map((t, i) => (
                    <li key={i}>
                      <span>{t}</span>
                      <CopyBtn text={t} />
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 12 }}>
                  <CopyBtn text={c.related.join('\n')} label="전체 복사" small={false} />
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'prompt' && (
          <div>
            <p className="preview-note" style={{ marginTop: 0, marginBottom: 12 }}>
              사실 확인이 중요한 주제라면 이 지시문을 <strong>웹 검색이 되는 Claude</strong>에 붙여넣어
              최신 정보로 쓰게 하세요. 결과는 왼쪽 칸에 직접 옮기면 됩니다.
            </p>
            <div className="out">{masterPrompt}</div>
          </div>
        )}

        {tab === 'reinforce' && (
          <div>
            <p className="preview-note" style={{ marginTop: 0, marginBottom: 12 }}>
              다 쓴 글이나 발행한 글을 <strong>웹 검색이 되는 Claude</strong>로 사실 확인하고 보강합니다.
              초안이 있으면 아래에 들어가 있고, 발행한 글이면 그 자리에 링크나 본문을 붙여넣으세요.
            </p>
            <div className="out">{reinforcePrompt}</div>
          </div>
        )}
      </div>
    </section>
  )
}
