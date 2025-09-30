// =========================
// Namespaces & Keys
// =========================
const NS = 'thisdive';
const K_G_DATA   = `${NS}.g:data`;
const K_P4_LAST  = `${NS}.p4:lastSource`;
const K_T_DATA   = `${NS}.t:data`;
const K_T_MUSTRESET = `${NS}.t:mustReset`;
const K_REWARD   = `${NS}.reward`; // 목표 페이지와 공유

// DOM helpers
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// Elements
const timeEl     = $('#time');
const progressEl = $('.progress');
const completeBtn= $('#completeBtn');
const timeButtonsWrap = $('#timeButtons');

let timerInterval = null;
let totalSeconds = 0;
let remainingSeconds = 0;

// =========================
// Boot
// =========================
document.addEventListener('DOMContentLoaded', () => {
  initGoalBanner();
  checkSourceAndInit();
  bindTimeButtons();
  bindComplete();
  // BFCache 복귀 시 초기화
  window.addEventListener('pageshow', onBFCache);
});

// =========================
// Goal banner
// =========================
function initGoalBanner(){
  const sp = new URLSearchParams(location.search);
  let goal = (sp.get('goal') || '').trim();
  if(!goal){
    try{ goal = sessionStorage.getItem(`${NS}.goal`) || ''; }catch(_){}
  }
  if(goal){
    $('#goalText').textContent = goal;
    $('#goalBanner').hidden = false;
  }
}

// =========================
// Source / reset logic
// =========================
function cameFromOtherPage(){
  try{
    if (!document.referrer) return false;
    const ref = new URL(document.referrer);
    const here = new URL(location.href);
    return (ref.origin === here.origin) && (ref.pathname !== here.pathname);
  }catch(_){
    return !!document.referrer;
  }
}

function checkSourceAndInit(){
  // 보상 파라미터 → 세션 캐싱
  const sp = new URLSearchParams(location.search);
  const rewardFromQS = (sp.get('reward') || '').trim();
  if (rewardFromQS) {
    try{ sessionStorage.setItem(K_REWARD, rewardFromQS); }catch(_){}
  }

  // mustReset 판단
  let mustReset = false;
  try{
    if (sessionStorage.getItem(K_T_MUSTRESET) === '1') mustReset = true;
  }catch(_){}
  if (cameFromOtherPage()) mustReset = true;
  try{ sessionStorage.removeItem(K_T_MUSTRESET); }catch(_){}

  let gRaw=null, p4Raw=null;
  try{
    gRaw  = localStorage.getItem(K_G_DATA);
    p4Raw = localStorage.getItem(K_P4_LAST);
  }catch(_){}

  if (mustReset || gRaw !== p4Raw) {
    try{ localStorage.removeItem(K_T_DATA); }catch(_){}
    try{ localStorage.setItem(K_P4_LAST, gRaw ?? ''); }catch(_){}
    resetVisual();
  } else {
    restoreTimer();
  }

  updateTimeDisplay();
  updateProgressCircle();
}

// =========================
// Timer core
// =========================
function startTimer(minutes){
  clearInterval(timerInterval);
  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  updateTimeDisplay();
  updateProgressCircle();
  setDisabled(completeBtn, true);

  snapshotSave({ minutes, startedAt: Date.now(), finished:false });

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimeDisplay();
    updateProgressCircle();

    if (remainingSeconds % 5 === 0) snapshotSave({ tick: Date.now() });

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      remainingSeconds = 0;
      setDisabled(completeBtn, false);
      snapshotSave({ finished:true, finishedAt: Date.now() });
    }
  }, 1000);
}

function updateTimeDisplay(){
  const min = String(Math.floor((remainingSeconds||0) / 60)).padStart(2, '0');
  const sec = String((remainingSeconds||0) % 60).padStart(2, '0');
  timeEl.textContent = `${min}:${sec}`;
}

function updateProgressCircle(){
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const ratio = totalSeconds ? (1 - (remainingSeconds / totalSeconds)) : 0;
  progressEl.style.strokeDasharray = `${circumference}`;
  progressEl.style.strokeDashoffset = `${circumference * ratio}`;
}

function resetVisual(){
  clearInterval(timerInterval);
  timerInterval = null;
  totalSeconds = 0;
  remainingSeconds = 0;
  timeEl.textContent = '00:00';
  updateTimeDisplay();
  updateProgressCircle();
  setDisabled(completeBtn, true);
  $$('.timer-controls button').forEach(b=> b.classList.remove('active'));
}

function restoreTimer(){
  const s = snapshotGet();
  if (s && s.minutes){
    const btn = [...$$('.timer-controls button')]
      .find(b => parseInt(b.textContent,10) === Number(s.minutes));
    if (btn) btn.classList.add('active');
  }
  if (s && s.minutes && s.startedAt && !s.finished){
    const elapsed = Math.max(0, Math.floor((Date.now() - s.startedAt)/1000));
    totalSeconds = Number(s.minutes) * 60;
    remainingSeconds = Math.max(0, totalSeconds - elapsed);
    if (remainingSeconds > 0){
      clearInterval(timerInterval);
      timerInterval = setInterval(()=>{
        remainingSeconds--;
        updateTimeDisplay();
        updateProgressCircle();
        if (remainingSeconds <= 0){
          clearInterval(timerInterval);
          setDisabled(completeBtn, false);
          snapshotSave({ finished:true, finishedAt: Date.now() });
        }
      }, 1000);
    }else{
      remainingSeconds = 0;
      setDisabled(completeBtn, false);
    }
    updateTimeDisplay();
    updateProgressCircle();
    return;
  }
  if (s && s.finished){
    totalSeconds = Number(s.minutes || 0) * 60;
    remainingSeconds = 0;
    updateTimeDisplay();
    updateProgressCircle();
    setDisabled(completeBtn, false);
  }
}

// =========================
// Snapshot
// =========================
function snapshotGet(){
  try{
    const raw = localStorage.getItem(K_T_DATA);
    return raw ? JSON.parse(raw) : {};
  }catch(_){ return {}; }
}
function snapshotSave(part){
  try{
    const cur = snapshotGet();
    const next = { ...cur, ...part };
    localStorage.setItem(K_T_DATA, JSON.stringify(next));
  }catch(_){}
}

// =========================
// Bindings
// =========================
function bindTimeButtons(){
  timeButtonsWrap.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    $$('.timer-controls button').forEach(b=> b.classList.remove('active'));
    btn.classList.add('active');
    const n = parseInt(btn.textContent, 10);
    if(Number.isFinite(n) && n > 0){
      startTimer(n);
      snapshotSave({ minutes:n });
    }
  }, { passive:true });
}

function bindComplete(){
  if(!completeBtn) return;
  const go = (e)=>{
    e.preventDefault();
    completeBtn.textContent = '💫몰입 성공💫';
    completeBtn.classList.add('done');
    showToast();
  };
  ['click','touchend','pointerup'].forEach(evt =>
    completeBtn.addEventListener(evt, go, { passive:false, once:true })
  );
}

function showToast(){
  const toast = $('#toast');
  if(!toast) return;

  const reward = getRewardText();
  const message = reward
    ? `☕ 약속한 보상: ${reward}, 지금요.`
    : `스스로에게 작은 칭찬 한 줄 😊`;

  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(()=> toast.classList.add('show'));
  setTimeout(()=>{
    toast.classList.remove('show');
    setTimeout(()=> toast.hidden = true, 200);
  }, 3000);
}

function getRewardText(){
  try{
    const sp = new URLSearchParams(location.search);
    let reward = (sp.get('reward') || '').trim();
    if (!reward){
      reward = (sessionStorage.getItem(K_REWARD) || '').trim();
    } else {
      sessionStorage.setItem(K_REWARD, reward);
    }
    return reward;
  }catch(_){
    try{ return (sessionStorage.getItem(K_REWARD) || '').trim(); }catch(__){ return ''; }
  }
}

function setDisabled(el, v){ if(el){ el.disabled = !!v; } }

function onBFCache(e){
  const nav = (performance.getEntriesByType && performance.getEntriesByType('navigation') || [])[0];
  const isBF = e.persisted || (nav && nav.type === 'back_forward');
  if (isBF) {
    try{ localStorage.removeItem(K_T_DATA); }catch(_){}
    resetVisual();
  }
}
