import type { Companion, State } from '../types'

export const companionNote: Record<Companion, string> = {
  '혼자': '자유로움과 사색, 나만의 속도를 강조',
  '짝꿍': '둘만의 순간과 소소한 티키타카를 강조',
  '가족': '아이와 어른 모두 만족하는 배려 포인트를 강조',
  '부모님': '체력·편의·효도 포인트와 뭉클한 순간을 강조',
}

function line(label: string, val: string | undefined): string {
  return val && String(val).trim() ? '- ' + label + ': ' + String(val).trim() + '\n' : ''
}

export function build(state: State): string {
  const L = state.length
  const header =
    '아래 규칙과 구조를 지켜서 티스토리 블로그 초안을 써 주세요.\n\n' +
    '# 문체·톤 규칙 (반드시 준수)\n' +
    "- '~어요' / '~습니다' 체를 자연스럽게 혼용, 정중하되 딱딱하지 않게\n" +
    '- 진중한 무게감을 유지하되 곳곳에 가벼운 유머 한 방울 (과하지 않게)\n' +
    '- 오글거리는 감탄사 남발과 AI 티 나는 상투적 마무리 금지\n' +
    '- 한 문단은 3~4줄 이내, 모바일 가독성 우선\n' +
    '- 소제목은 이모지 1개 + 짧고 클릭하고 싶은 문구\n' +
    '- 목표 분량: ' + L + '\n\n'

  let body = ''
  if (state.mode === 'lab') {
    body =
      '# 카테고리: AI 작업 실험실 (실험 노트 컨셉)\n\n' +
      '## 이번 실험 정보\n' +
      line('실험 주제', state.topic) +
      line('사용한 AI 도구', state.tools) +
      line('기존 방식(Before)', state.before) +
      line('AI 방식(After)', state.after) +
      line('결과', state.result) +
      line('강조할 포인트/에피소드', state.episode) +
      '\n## 원하는 글 구조\n' +
      '1. 🔬 도입 — 공감 가는 삽질 경험 + 문제 제기\n' +
      '2. ⚙️ 실험 설계 — 무엇을, 어떤 도구로, 어떻게 해봤는지\n' +
      '3. 📊 Before / After 비교\n' +
      '4. 💡 결과 & 배운 점 — 실패했다면 이유도 솔직하게\n' +
      '5. 🧭 이럴 때 써보세요 — 독자가 바로 따라 할 실전 팁\n' +
      '6. 마무리 — 다음 실험 떡밥 or 독자에게 던지는 질문\n'
  } else {
    body =
      '# 카테고리: 여행 (경험담 중심)\n\n' +
      '## 이번 여행 정보\n' +
      line('여행지', state.place) +
      line('지역', state.region) +
      line('동행 유형', state.companion + ' → ' + companionNote[state.companion]) +
      line('기간/시기', state.period) +
      line('한 줄 테마', state.theme) +
      line('꼭 넣을 장소/에피소드', state.tepisode) +
      '- 실용 정보(비용·동선·예약): ' + (state.info ? '포함' : '생략') + '\n' +
      '\n## 원하는 글 구조\n' +
      '1. 🧳 도입 — 왜 이 여행을, 이 동행과 갔는지 (감성 훅)\n' +
      '2. 📍 코스 흐름 — 시간·동선 순서대로, 동행 유형에 맞춘 배려 포인트 강조\n' +
      (state.info ? '3. 💰 실용 정보 — 비용·이동·예약 팁\n' : '') +
      (state.info ? '4' : '3') + '. 📸 하이라이트 — 가장 기억에 남은 순간 1~2개, [사진: 설명] 표시\n' +
      (state.info ? '5' : '4') + '. ⚠️ 솔직 후기 — 아쉬웠던 점 / 이건 알고 가세요\n' +
      (state.info ? '6' : '5') + '. 마무리 — 이 동행에게 추천? + 다음 여행지 예고\n'
  }

  const tail =
    '\n# 함께 생성할 것\n' +
    '- 제목 후보 3개 (클릭유도형 / 정보형 / 감성형)\n' +
    '- 추천 태그 5~8개\n' +
    '- 메타 설명용 한 줄 요약\n' +
    '- 본문 내 [사진: 설명] 삽입 위치 제안\n'

  return header + body + tail
}
