/* =========================
   Index 진입 시 상태 초기화
========================= */
(function resetOnEveryEntry(){
  const NS = 'thisdive';
  const K_RESET = `${NS}.resetEpoch`;    // 다른 페이지가 감지할 토큰
  const KEYS = [
    `${NS}.p2:current`,
    `${NS}.p3:lastSource`,
    `${NS}.q:data`,
    `${NS}.g:data`,
    `${NS}.selectedEmotion`,
    `${NS}.p4:lastP2`,
    `${NS}.p4:lastQ`
  ];

  const wipe = () => {
    try { sessionStorage.clear(); } catch(e){}
    try { KEYS.forEach(k => localStorage.removeItem(k)); } catch(e){}
    try { localStorage.setItem(K_RESET, String(Date.now())); } catch(e){} // 초기화 신호
  };

  // 최초 로드 + bfcache 복귀 모두 커버
  wipe();
  window.addEventListener('pageshow', wipe, { passive: true });
})();

/* =========================
   (선택) 프레임 버스트: iframe 임베드 시 상위로 탈출
   - GitHub Pages에서는 헤더 기반 frame-ancestors를 못 쓰므로 보완책
========================= */
(function frameBust(){
  try {
    if (window.top !== window.self) {
      window.top.location.replace(window.location.href);
    }
  } catch (e) {
    // 크로스오리진/샌드박스 등으로 실패할 수 있음 — 조용히 무시
  }
})();
