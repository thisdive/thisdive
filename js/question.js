// ==========================
// Security & constants
// ==========================
var NS = 'thisdive';
var K_RESET  = NS + '.resetEpoch';
var K_SEEN   = NS + '.seenEpoch:talk';
var K_STATE  = 'talkPageState';

var ALLOWED = new Set([
  "기쁘다","설렌다","감사하다","평온하다",
  "지친다","우울하다","무기력하다","외롭다",
  "짜증난다","화가난다","질투난다","부끄럽다",
  "불안하다","긴장된다","두렵다","부담된다",
  "joy","spark","gratitude","calm",
  "tired","blue","lethargy","lonely",
  "annoyed","angry","jealous","shy",
  "anxious","tense","afraid","burdened"
]);

var KEY_TO_KO = Object.freeze({
  joy:"기쁘다", spark:"설렌다", gratitude:"감사하다", calm:"평온하다",
  tired:"지친다", blue:"우울하다", lethargy:"무기력하다", lonely:"외롭다",
  annoyed:"짜증난다", angry:"화가난다", jealous:"질투난다", shy:"부끄럽다",
  anxious:"불안하다", tense:"긴장된다", afraid:"두렵다", burdened:"부담된다"
});

// ▣ 프레임 버스트
(function frameBust(){
  if (window.top !== window.self) {
    try { window.top.location = window.location; } catch(_) {}
  }
})();

function $(s, r){ return (r||document).querySelector(s); }

// 인덱스 재진입 토큰 처리
function enforceResetFromIndex(){
  function uiReset(){
    try { localStorage.removeItem(K_STATE); } catch(_){}
    ['#meText','#youText','#loveText'].forEach(function(id){
      var el = $(id); if (el) el.value = '';
    });
  }
  function maybeReset(){
    var resetEpoch = localStorage.getItem(K_RESET) || '';
    var seenEpoch  = sessionStorage.getItem(K_SEEN) || '';
    if (resetEpoch && resetEpoch !== seenEpoch) {
      uiReset();
      try { sessionStorage.setItem(K_SEEN, resetEpoch); } catch(_){}
    }
  }
  maybeReset();
  window.addEventListener('pageshow', maybeReset);
}

// 상태 저장/복원
function bindPersistence(emotionLabel){
  var areas = ['#meText','#youText','#loveText'].map(function(sel){ return $(sel); }).filter(Boolean);
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(K_STATE) || 'null'); } catch(_){}
  if (saved && saved.emotion && saved.emotion !== emotionLabel) {
    try { localStorage.removeItem(K_STATE); } catch(_){}
    saved = null;
  }
  if (saved && Array.isArray(saved.values)) {
    areas.forEach(function(ta, i){ if (typeof saved.values[i] === 'string') ta.value = saved.values[i]; });
  }
  var save = function(){
    var values = areas.map(function(ta){ return (ta && ta.value) ? ta.value : ''; });
    try { localStorage.setItem(K_STATE, JSON.stringify({ emotion: emotionLabel, values: values, ts: Date.now() })); } catch(_){}
  };
  areas.forEach(function(ta){ if (ta) ta.addEventListener('input', save); });
  window.addEventListener('beforeunload', save);
}

// ==========================
// 메인 로직
// ==========================
document.addEventListener('DOMContentLoaded', function(){

  // emotion 라벨 계산
  var params = new URLSearchParams(location.search);
  var raw = (params.get('emotion') || '').trim();

  // 없으면 emotion.html에서 저장한 값 사용
  if (!raw) {
    try {
      var saved = JSON.parse(localStorage.getItem('thisdive.p2:current') || 'null');
      if (saved && saved.value) raw = String(saved.value).trim();
    } catch(_) {}
  }

  var label = '선택 안됨';
  if (raw && ALLOWED.has(raw)) {
    label = KEY_TO_KO[raw] || raw;
  } else {
    var alt = (params.get('emo') || params.get('e') || '').trim();
    if (alt && ALLOWED.has(alt)) label = KEY_TO_KO[alt] || alt;
  }

  var emoEl = $('#emotionValue .chip-label');
  if (emoEl) emoEl.textContent = label;

  enforceResetFromIndex();
  bindPersistence(label);

  // CTA 이동
  var btn = document.getElementById('nextBtn');
  if (btn) {
    var didGo = false;

    function computeTarget(){
      var emotion = (params.get('emotion') || '').trim() || label;
      var override = params.get('next') || '';
      var nextFile = (override && override.trim()) ? override.trim() : 'future.html';
      return nextFile + (nextFile.indexOf('?') >= 0 ? '&' : '?') + 'emotion=' + encodeURIComponent(emotion);
    }

    function go(ev){
      try { ev.preventDefault(); ev.stopPropagation(); } catch(_){}
      if (didGo) return;
      didGo = true;
      var target = computeTarget();
      setTimeout(function(){
        try { window.location.assign(target); }
        catch(_) { window.location.href = target; }
      }, 0);
    }

    btn.addEventListener('click', go, { passive:false });
    btn.addEventListener('touchend', go, { passive:false });
    btn.addEventListener('pointerup', go, { passive:false });

    // BFCache 복원 시 reset
    window.addEventListener('pageshow', function(e){
      if (e.persisted) didGo = false;
    });
    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'visible') didGo = false;
    });
  }
});
