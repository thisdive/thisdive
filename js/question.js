// ==========================
// Security & constants
// ==========================
const NS = 'thisdive';
const K_RESET  = `${NS}.resetEpoch`;      // (선택) index 등에서 세션 리셋용으로 기록
const K_SEEN   = `${NS}.seenEpoch:talk`;  // 이 페이지가 마지막으로 본 토큰
const K_STATE  = 'talkPageState';         // 이 페이지 로컬 상태 저장 키

// ▣ 감정 화이트리스트 (URL 파라미터 엄격 처리)
const ALLOWED = new Set([
// 한글 값(이전 페이지가 한글을 넘기는 케이스)
"기쁘다","설렌다","감사하다","평온하다",
"지친다","우울하다","무기력하다","외롭다",
"짜증난다","화가난다","질투난다","부끄럽다",
"불안하다","긴장된다","두렵다","부담된다",
// 키 기반(영문 키 → 한글 매핑을 허용하려면 아래 map과 함께 사용)
"joy","spark","gratitude","calm",
"tired","blue","lethargy","lonely",
"annoyed","angry","jealous","shy",
"anxious","tense","afraid","burdened"
]);
// 영문 키를 한글로 매핑(필요 시 확장)
const KEY_TO_KO = Object.freeze({
joy:"기쁘다", spark:"설렌다", gratitude:"감사하다", calm:"평온하다",
tired:"지친다", blue:"우울하다", lethargy:"무기력하다", lonely:"외롭다",
annoyed:"짜증난다", angry:"화가난다", jealous:"질투난다", shy:"부끄럽다",
anxious:"불안하다", tense:"긴장된다", afraid:"두렵다", burdened:"부담된다"
});

// ▣ 프레임 버스트(클릭재킹 억제; GitHub Pages에서 frame-ancestors 대안)
(function frameBust(){
if (window.top !== window.self) {
try { window.top.location = window.location; } catch (_) { /* cross-origin이면 실패 가능 */ }
}
})();

// ==========================
// Helpers
// ==========================
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

// (선택) 인덱스 재진입 초기화 토큰 감지 → 이 페이지 UI 초기화
function enforceResetFromIndex(){
function uiReset(){
try { localStorage.removeItem(K_STATE); } catch(*){}
try {
['#meText','#youText','#loveText'].forEach(id=>{
const el = $(id); if(el) el.value = '';
});
} catch(*){}
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
const textareas = ['#meText','#youText','#loveText'].map(sel => $(sel)).filter(Boolean);

// 복원
let saved = null;
try { saved = JSON.parse(localStorage.getItem(K_STATE) || 'null'); } catch(*){}
if (saved && saved.emotion && saved.emotion !== emotionLabel) {
// 다른 감정이면 해당 저장은 무효화
try { localStorage.removeItem(K_STATE); } catch(*){}
saved = null;
}
if (saved && Array.isArray(saved.values)) {
textareas.forEach((ta, i) => {
if (typeof saved.values[i] === 'string') ta.value = saved.values[i];
});
}

// 저장
const save = () => {
const values = textareas.map(ta => (ta && ta.value) ? ta.value : '');
const payload = { emotion: emotionLabel, values, ts: Date.now() };
try { localStorage.setItem(K_STATE, JSON.stringify(payload)); } catch(_){}
};

textareas.forEach(ta => ta && ta.addEventListener('input', save));
window.addEventListener('beforeunload', save);
}

// ==========================
// Init
// ==========================
document.addEventListener('DOMContentLoaded', () => {
// URL 파라미터에서 emotion 추출(화이트리스트)
const params = new URLSearchParams(location.search);
let raw = (params.get('emotion') || '').trim();
let label = '선택 안됨';

if (raw && ALLOWED.has(raw)) {
// 영문 키면 한글로
label = KEY_TO_KO[raw] || raw;
} else {
// 혹시 q=emotion 등 다른 키로 들어온 경우를 대비해 보정(선택)
const alt = (params.get('emo') || params.get('e') || '').trim();
if (alt && ALLOWED.has(alt)) label = KEY_TO_KO[alt] || alt;
}

// 렌더
const emoEl = $('#emotionValue .chip-label');
if (emoEl) emoEl.textContent = label;

// 인덱스 재진입 토큰 체크 → 필요 시 UI 초기화
enforceResetFromIndex();

// 상태 저장/복원
bindPersistence(label);

// CTA 이동
const nextBtn = $('#nextBtn');
if (nextBtn) {
nextBtn.addEventListener('click', () => {
// 다음 페이지 파일명은 파라미터로 오버라이드 가능 (없으면 기본 goal.html)
const next = params.get('next') || 'goal.html';
const q = new URLSearchParams({ emotion: label }).toString();
location.href = `${next}?${q}`;
});
}

// ==========================
// Init
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  // URL 파라미터에서 emotion 추출(화이트리스트)
  const params = new URLSearchParams(location.search);
  let raw = (params.get('emotion') || '').trim();
  let label = '선택 안됨';

  if (raw && ALLOWED.has(raw)) {
    label = KEY_TO_KO[raw] || raw;
  } else {
    const alt = (params.get('emo') || params.get('e') || '').trim();
    if (alt && ALLOWED.has(alt)) label = KEY_TO_KO[alt] || alt;
  }

  // 렌더
  const emoEl = document.querySelector('#emotionValue .chip-label');
  if (emoEl) emoEl.textContent = label;

  // 인덱스 재진입 토큰 체크 → 필요 시 UI 초기화
  enforceResetFromIndex();

  // 상태 저장/복원
  bindPersistence(label);

  // ▼ 변경: 기본 이동 파일을 f-test4.html 로
  const nextBtn = document.querySelector('#nextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const next = new URLSearchParams(location.search).get('next') || 'f-test4.html';
      const q = new URLSearchParams({ emotion: label }).toString();
      location.href = `${next}?${q}`;
    });
  }
});
