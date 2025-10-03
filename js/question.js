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
  const nextBtn = document.querySelector('#nextBtn');
  if (nextBtn) {
    let didGo = false; // 다중 트리거 방지
    const go = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (didGo) return;
      didGo = true;

      // ?next= 덮어쓰기 (상대경로 .html만 허용)
      let nextFile = (getQueryParam('next') || '').trim() || 'future.html';
      if (!/^[a-z0-9._/-]+\.html(?:\?.*)?$/i.test(nextFile)) {
        nextFile = 'future.html';
      }

      const target = appendQuery(nextFile, { emotion: label });
      try { window.location.assign(target); }
      catch { window.location.href = target; }
    };
    nextBtn.addEventListener('click', go, { passive:false });
    nextBtn.addEventListener('touchend', go, { passive:false });
    nextBtn.addEventListener('pointerup', go, { passive:false });

    // 🔹 iOS Safari BFCache 복원 시 플래그 리셋
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        didGo = false;
      }
    });
  }
});
