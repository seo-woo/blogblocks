/**
 * 이미지 화풍 — 글마다 그림이 따로 놀지 않게, 모든 생성 프롬프트에 같은 문장을 붙인다.
 * 장면(무엇을 찍은 사진인지)만 글마다 달라지고, 아래 화풍 블록은 늘 그대로다.
 */

/** 프롬프트에 화풍 블록이 이미 붙었는지 알아보는 표시 */
export const STYLE_MARKER = 'STYLE (identical in every image)'

/** 모든 이미지에 공통으로 붙는 화풍 블록 (실사) */
export const PHOTO_STYLE =
  STYLE_MARKER + ':\n' +
  'Photorealistic documentary photo, natural light, clean and educational. ' +
  'Looks like a real photograph for a science explainer — accurate, clear, and easy to understand. ' +
  'Sharp focus on the subject that demonstrates the phenomenon; shallow or moderate depth of field as needed. ' +
  'Natural color, soft contrast, no heavy filters, no cinematic color grade. ' +
  'Simple uncluttered background, centered or rule-of-thirds composition, 16:9.\n' +
  'No illustration, no cartoon, no anime, no 3D render, no CGI look, no mascot character. ' +
  'No text, no letters, no numbers, no captions, no speech bubbles, no watermark, no logo.'

/** @deprecated PHOTO_STYLE 사용 */
export const CAT_STYLE = PHOTO_STYLE

/** 저장은 장면만 — AI가 화풍 블록까지 써 보내면 떼어 낸다 */
export function stripImageStyle(prompt: string): string {
  const p = (prompt ?? '').trim()
  const at = p.indexOf(STYLE_MARKER)
  return (at === -1 ? p : p.slice(0, at)).trim()
}

/** @deprecated stripImageStyle 사용 */
export const stripCatStyle = stripImageStyle

/** 장면 묘사에 화풍 블록을 붙인다 (이미 붙어 있으면 그대로) */
export function withImageStyle(prompt: string): string {
  const p = (prompt ?? '').trim()
  if (!p) return ''
  if (p.includes(STYLE_MARKER)) return p
  return p + '\n\n' + PHOTO_STYLE
}

/** @deprecated withImageStyle 사용 */
export const withCatStyle = withImageStyle
