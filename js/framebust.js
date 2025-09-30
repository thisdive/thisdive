// /js/framebust.js
(function () {
  if (window.top !== window.self) {
    try { window.top.location = window.location; }
    catch (_) {
      // cross-origin이면 탈출이 막힐 수 있음 → 차단막으로 클릭재킹 방지(선택)
      try {
        const shield = document.createElement('div');
        shield.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:2147483647';
        document.documentElement.appendChild(shield);
      } catch(__){}
    }
  }
})();
