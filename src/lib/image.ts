// 업로드한 이미지를 축소해 data URL 로 변환.
// HTML 에 직접 삽입(self-contained)하기 위함이라 용량을 줄여야 티스토리 붙여넣기·저장이 무겁지 않음.
export async function fileToDataUrl(file: File, maxW = 1200, quality = 0.78): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

  // 이미 충분히 작으면 그대로 사용
  if (file.size < 200_000 && !/image\/(png|webp)/.test(file.type)) return raw

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => reject(new Error('image load failed'))
    im.src = raw
  })

  const scale = Math.min(1, maxW / (img.width || maxW))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return raw
  ctx.drawImage(img, 0, 0, w, h)
  try {
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return raw
  }
}
