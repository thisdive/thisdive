// index.js
(function resetOnEveryEntry(){
  const NS = 'thisdive';
  const K_RESET = `${NS}.resetEpoch`;

  // 과거 페이지들이 사용하던 키들(호환 위해 비워줌)
  const LEGACY_KEYS = [
    `${NS}.p2:current`,
    `${NS}.p3:lastSource`,
    `${NS}.q:data`,
    `${NS}.g:data`,
    `${NS}.selectedEmotion`,
    `${NS}.p4:lastP2`,
    `${NS}.p4:lastQ`
  ];

  function wipe() {
    try { sessionStorage.clear(); } catch(e){}
    try {
      // 필요한 키만 지우고 싶다면 localStorage.clear() 대신 아래 루프만 유지
      LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
    } catch(e){}
    // 새 세션 신호 토큰(다른 페이지들이 이 값 변화를 보고 자체 초기화)
    try { localStorage.setItem(K_RESET, String(Date.now())); } catch(e){}
  }

  // 최초 진입 시
  wipe();

  // BFCache 복귀(뒤로가기 등) 시에도 다시 초기화
  window.addEventListener('pageshow', wipe, { passive: true });
})();
