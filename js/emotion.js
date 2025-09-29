// ▣ 네임스페이스 키
const NS = 'thisdive';
const K_P2_CURRENT = `${NS}.p2:current`;

// ▣ 감정 화이트리스트 (URL 파라미터/변조 대비)
const ALLOWED = new Set([
  "기쁘다","설렌다","감사하다","평온하다",
  "지친다","우울하다","무기력하다","외롭다",
  "짜증난다","화가난다","질투난다","부끄럽다",
  "불안하다","긴장된다","두렵다","부담된다"
]);

// ▣ 프레임 버스트 (클릭재킹 억제: 메타 CSP frame-ancestors 미동작 환경 보강)
(function frameBust(){
  if (window.top !== window.self) {
    try { window.top.location = window.location; } catch (e) { /* cross-origin이면 실패 가능 */ }
  }
})();

// ▣ 초기 바인딩
document.addEventListener('DOMContentLoaded', () => {
  const chips = Array.from(document.querySelectorAll('.chip'));
  const goBtn = document.getElementById('goBtn');
  const netEl = document.getElementById('net');

  function disableCTA(v){ goBtn.disabled = !!v; }
  disableCTA(true);

  // 저장된 선택 복원 (뒤페이지 갔다와도 유지; 사용자가 바꾸기 전까지)
  (function restoreSelection(){
    try{
      const raw = localStorage.getItem(K_P2_CURRENT);
      if(!raw) return;
      const data = JSON.parse(raw);
      const val = data && data.value;
      if(!val || !ALLOWED.has(val)) return;

      const input = document.querySelector(`input[name="emotion"][value="${val}"]`);
      if(!input) return;
      input.checked = true;
      const chip = input.closest('.chip');
      if(chip) chip.classList.add('on');
      disableCTA(false);
    }catch(_){}
  })();

  // 칩 클릭: UI 반영 + 화이트리스트 저장
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const input = chip.querySelector('input[type="radio"]');
      if(!input) return;

      // 선택 토글
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
      input.checked = true;
      chip.classList.add('on');
      disableCTA(false);

      // 저장 (화이트리스트 검사)
      const value = String(input.value || '');
      if (ALLOWED.has(value)) {
        try{
          localStorage.setItem(K_P2_CURRENT, JSON.stringify({ value, at: Date.now() }));
        }catch(_){}
      }
    });
  });

  // 이동: 선택값을 쿼리로 전달 (화이트리스트로 방어)
  goBtn.addEventListener('click', () => {
    const picked = document.querySelector('input[name="emotion"]:checked');
    if(!picked) return;

    const value = String(picked.value || '');
    if(!ALLOWED.has(value)) return;

    const url = `question.html?emotion=${encodeURIComponent(value)}&v=${Date.now()}`;
    location.href = url;
  });

  // 네트워크 토스트
  function showNet(msg){
    if(!netEl) return;
    netEl.textContent = msg;
    netEl.hidden = false;
    netEl.classList.add('show');
    clearTimeout(showNet._t);
    showNet._t = setTimeout(()=> netEl.classList.remove('show'), 1600);
  }
  window.addEventListener('offline', ()=> showNet('오프라인입니다. 네트워크를 확인하세요.'));
  window.addEventListener('online',  ()=> showNet('온라인에 연결되었습니다.'));
});
