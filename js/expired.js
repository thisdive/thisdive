/* =========================
   expired page
   ========================= */

/* (선택) 접근성/퍼포먼스용: 페이지가 iframe에 갇혀있을 경우 framebust.js가 먼저 처리함 */

/* 필요한 경우에만 간단한 UX 스크립트를 여기에 추가하세요.
   - 현재 페이지는 정적 안내 성격이라 필수 로직 없음.
   - 추후 구독 연장/선물 CTA 트래킹, A/B 테스트 훅 등을 붙일 수 있음.
*/

document.addEventListener('DOMContentLoaded', () => {
  // 향후 필요 시: 쿼리 파라미터에 따라 메시지 다변화 등을 여기에 구현
  // 예: ?y=2026 → 연도 교체 등
  // const y = new URLSearchParams(location.search).get('y');
});
