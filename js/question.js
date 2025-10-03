// ==========================
// Security & constants
// ==========================
const NS = 'thisdive';
const K_RESET  = `${NS}.resetEpoch`;
const K_SEEN   = `${NS}.seenEpoch:talk`;
const K_STATE  = 'talkPageState';

const ALLOWED = new Set([
  "기쁘다","설렌다","감사하다","평온하다",
  "지친다","우울하다","무기력하다","외롭다",
  "짜증난다","화가난다","질투난다","부끄럽다",
  "불안하다","긴장된다","두렵다","부담된다",
  "joy","spark","gratitude","calm",
  "tired","blue","lethargy","lonely",
  "annoyed","angry","jealous","shy",
  "anxious","tense","afraid","burdened"
]);

const KEY_TO_KO = Object.freeze({
  joy:"기쁘다", spark:"설렌다", gratitude:"감사하다", calm:"평온하다",
  tired:"지친다", blue:"우울하다", lethargy:"무기력하다", lonely:"외롭다",
  annoyed:"짜증난다", angry:"화가난다", jealous:"질투난다", shy:"부끄럽다",
  anxious:"불안하다", tense:"긴장된다", afraid:"두렵다", burdened:"부담된다"
});

// 클릭재킹 보강
(function frameBust(){
  if (window.top !== window.self) {
    try { window.top.location = window.location; } catch(_) {}
  }
})();

// ---------- URLSearchParams 폴백 유틸 ----------
function parseQS(search) {
  const out = {};
  const s = (search || '').replace(/^\?/, '');
  if (!s) return out;
  s.split('&').forEach(p => {
    const i = p.indexOf('=');
    if (i < 0) { out[decodeURIComponent(p)] = ''; return; }
    const k = decodeURIComponent(p.slice(0, i));
    const v = decodeURIComponent(p.slice(i+1));
    out[k] = v;
  });
  return out;
}
function buildQS(obj) {
  const parts = [];
  for (const k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    const v = obj[k] == null ? '' : String(obj[k]);
    parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
  }
  return parts.join('&');
}
function getQueryParam(name) {
  if (typeof URLSearchParams !== 'undefined') {
    return new URLSearchParams(location.search).get(name);
  }
  const q = parseQS(location.search);
  return q[name] || null;
}
function appendQuery(url, paramsObj) {
  const hasQ = url.indexOf('?') >= 0;
  const qs = (typeof URLSearchParams !== 'undefined')
    ? new URLSearchParams(paramsObj).toString()
    : buildQS(paramsObj);
  return url + (hasQ ? '&' : '?') + qs;
}

function $(s, r=document){ return r.querySelector(s); }

// 인덱스 재진입 토큰 처리
function enforceResetFromIndex(){
  function uiReset(){
    try { localStorage.removeItem(K_STATE); } catch(_){}
    ['#meText','#youText','#loveText'].forEach(id => {
      const el = $(id); if (el) el.value = '';
    });
  }
  function maybeReset(){
    const resetEpoch = localStorage.getItem(K_RESET) || '';
    const seenEpoch  = sessionStorage.getItem(K_SEEN) || '';
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
  const areas = ['#meText','#youText','#loveText'].map(sel => $(sel)).filter(Boolean);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(K_STATE) || 'null'); } catch(_){}
  if (saved && saved.emotion && saved.emotion !== emotionLabel) {
    try { localStorage.removeItem(K_STATE); } catch(_){}
    saved = null;
  }
  if (saved && Array.isArray(saved.values)) {
    areas.forEach((ta, i) => { if (typeof saved.values[i] === 'string') ta.value = saved.values[i]; });
  }
  const save = () => {
    const values = areas.map(ta => (ta && ta.value) ? ta.value : '');
    try {
      localStorage.setItem(K_STATE, JSON.stringify({ emotion: emotionLabel, values, ts: Date.now() }));
    } catch(_){}
  };
  areas.forEach(ta => ta && ta.addEventListener('input', save));
  window.addEventListener('beforeunload', save);
}

document.addEventListener('DOMContentLoaded', () => {
  // emotion 파라미터 안전 파싱
  let raw = (getQueryParam('emotion') || '').trim();
  let label = '선택 안됨';
  if (raw && ALLOWED.has(raw)) label = KEY_TO_KO[raw] || raw;
  else {
    const alt = (getQueryParam('emo') || getQueryParam('e') || '').trim();
    if (alt && ALLOWED.has(alt)) label = KEY_TO_KO[alt] || alt;
  }

  const emoEl = document.querySelector('#emotionValue .chip-label');
  if (emoEl) emoEl.textContent = label;

  enforceResetFromIndex();
  bindPersistence(label);

  // ▼ CTA 이동
// ▼ CTA 이동 — 단일 click 리스너 + iOS BFCache 리셋 (가장 보수적으로)
(function initCTA(){
  var btn = document.getElementById('nextBtn');
  if (!btn) return;                      // 버튼 못 찾으면 조용히 종료

  var didGo = false;                     // 다중 클릭 방지 플래그

  // 쿼리 파서(폴백 포함)
  function getQS(name){
    if (typeof URLSearchParams !== 'undefined') {
      return new URLSearchParams(location.search).get(name);
    }
    var s = (location.search || '').replace(/^\?/, '');
    if (!s) return null;
    var o = {};
    s.split('&').forEach(function(p){
      var i = p.indexOf('=');
      if (i < 0) { o[decodeURIComponent(p)] = ''; return; }
      o[decodeURIComponent(p.slice(0,i))] = decodeURIComponent(p.slice(i+1));
    });
    return o[name] || null;
  }
  function buildQS(obj){
    if (typeof URLSearchParams !== 'undefined') return new URLSearchParams(obj).toString();
    var out = [];
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj,k)) {
      var v = obj[k] == null ? '' : String(obj[k]);
      out.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
    return out.join('&');
  }
  function safeNextFile(s){
    s = (s || '').trim();
    return (/^[a-z0-9._/-]+\.html(?:\?.*)?$/i.test(s)) ? s : 'future.html';
  }

  function computeTarget(){
    // emotion 값: 쿼리 우선, 없으면 화면 라벨 폴백
    var emotion = (getQS('emotion') || '').trim();
    if (!emotion) {
      var t = document.querySelector('#emotionValue .chip-label');
      if (t && t.textContent) emotion = t.textContent.trim();
    }
    var override = getQS('next') || '';
    var nextFile = safeNextFile(override || 'future.html');
    return nextFile + (nextFile.indexOf('?') >= 0 ? '&' : '?') + buildQS({ emotion: emotion });
  }

  function go(ev){
    try { ev && ev.preventDefault(); ev && ev.stopPropagation(); } catch(_){}
    if (didGo) return;
    didGo = true;

    var target = computeTarget();

    // iOS에서 assign 타이밍 이슈 회피용 미세 지연
    setTimeout(function(){
      try { window.location.assign(target); }
      catch (_){ window.location.href = target; }
    }, 0);
  }

  // 단일 click만 사용 (touch/pointer는 iOS에서 click 합성 → 중복/충돌 원인)
  btn.addEventListener('click', go, { passive:false });

  // BFCache 복원 시 플래그 리셋 (아이폰 뒤로 왔다가 다시 클릭 가능하게)
  window.addEventListener('pageshow', function(e){
    // e.persisted: 사파리 BFCache / nav.type === 'back_forward' 다른 브라우저
    var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation') || [])[0];
    var isBF = (e && e.persisted) || (nav && nav.type === 'back_forward');
    if (isBF) didGo = false;
  });

  // 가끔 탭 복귀 시 첫 클릭이 씹히는 케이스 보강
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'visible') didGo = false;
  });
})();


